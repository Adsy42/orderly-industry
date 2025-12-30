import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { IQL_TEMPLATES } from "@/lib/iql-templates";

/**
 * Get or create an OpenAI client instance.
 * Throws if API key is not configured.
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  return new OpenAI({ apiKey });
}

/**
 * IQL Translation API Route
 *
 * Translates natural language clause search descriptions into valid IQL syntax.
 * Uses GPT-4o-mini with structured JSON response format, prioritizing pre-optimized
 * IQL templates when available.
 *
 * @see https://docs.isaacus.com/iql/templates
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[IQL Translate] Received request");

    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[IQL Translate] Authentication error:", authError);
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { query } = body;

    console.log("[IQL Translate] Request params:", { query });

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Query is required",
          details:
            "Request body must include a 'query' field with non-empty string",
        },
        { status: 400 },
      );
    }

    // Build template list for prompt
    const templateList = IQL_TEMPLATES.map(
      (template) =>
        `- ${template.displayName} (${template.name}): ${template.description}`,
    ).join("\n");

    // System prompt with IQL specification and templates
    const systemPrompt = `You are a legal query translator that converts natural language descriptions into Isaacus Query Language (IQL) syntax.

IQL Syntax Rules:
- Statements must be enclosed in curly brackets: {IS template name} or {IS clause that "description"}
- Operators: AND, OR, NOT, > (greater than), < (less than), + (average)
- Operator precedence: () → + → >, < → NOT → AND → OR
- Templates are pre-optimized and should be preferred over custom descriptions when they match the user's intent

Available IQL Templates (PREFER THESE):
${templateList}

Translation Guidelines:
1. ALWAYS prefer using templates from the list above when they match the user's intent
2. For multiple clause types, combine templates with AND/OR operators
3. Use parameterized templates when specific parties are mentioned: {IS clause obligating "PartyName"}
4. Only use custom descriptions ({IS clause that "..."}) when no template matches
5. Respect operator precedence - use parentheses when needed
6. Return valid IQL syntax that follows the specification

Response Format (JSON):
{
  "iql": "the translated IQL query string",
  "explanation": "brief human-readable explanation of the translation",
  "templates_used": ["array of template names used, if any"],
  "confidence": 0.0-1.0 confidence score
}`;

    const userPrompt = `Translate this natural language query to IQL syntax:\n\n"${query.trim()}"`;

    const openai = getOpenAIClient();

    // Call OpenAI with timeout handling (15 seconds to allow for cold starts)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Translation timeout")), 15000),
    );

    const translationPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0, // Deterministic output
    });

    let completion: ChatCompletion;
    try {
      completion = (await Promise.race([
        translationPromise,
        timeoutPromise,
      ])) as ChatCompletion;
    } catch (error) {
      if (error instanceof Error && error.message === "Translation timeout") {
        console.error("[IQL Translate] Timeout after 15 seconds");
        return NextResponse.json(
          {
            error: "Translation timeout",
            message:
              "Translation is taking longer than expected. Try again or use IQL syntax directly.",
          },
          { status: 504 },
        );
      }
      throw error;
    }

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response content from OpenAI");
    }

    // Parse JSON response
    let translationResult: {
      iql: string;
      explanation?: string;
      templates_used?: string[];
      confidence?: number;
    };

    try {
      translationResult = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("[IQL Translate] JSON parse error:", parseError);
      throw new Error("Invalid JSON response from translation service");
    }

    // Validate required fields
    if (!translationResult.iql || typeof translationResult.iql !== "string") {
      throw new Error("Translation result missing required 'iql' field");
    }

    console.log("[IQL Translate] Translation successful:", {
      iql: translationResult.iql,
      templatesUsed: translationResult.templates_used?.length || 0,
      confidence: translationResult.confidence,
    });

    // Return successful translation
    return NextResponse.json({
      iql: translationResult.iql.trim(),
      explanation: translationResult.explanation,
      templates_used: translationResult.templates_used || [],
      confidence: translationResult.confidence,
    });
  } catch (error) {
    console.error("[IQL Translate] API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Internal server error";

    // Handle OpenAI-specific errors
    if (
      errorMessage.includes("OPENAI") ||
      errorMessage.includes("OpenAI") ||
      errorMessage.includes("api key") ||
      errorMessage.includes("API key")
    ) {
      return NextResponse.json(
        {
          error: "Translation failed",
          message:
            "Could not translate query. Please try rephrasing or use IQL syntax directly.",
          ...(process.env.NODE_ENV === "development" && {
            details: errorMessage,
          }),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Translation failed",
        message:
          "Could not translate query. Please try rephrasing or use IQL syntax directly.",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
        }),
      },
      { status: 500 },
    );
  }
}
