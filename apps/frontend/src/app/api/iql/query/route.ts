import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  validateIQLQuery,
  validateIQLQueryWithOperators,
} from "@/lib/iql-validation";
import {
  classifyIQL,
  ClassificationModel,
  extractClauseWithLLM,
} from "@/lib/isaacus";

/**
 * IQL Query API Route
 *
 * Executes Isaacus Query Language queries against documents.
 * Isaacus automatically handles document chunking and returns
 * accurate character positions relative to the original document.
 *
 * @see https://docs.isaacus.com/iql/introduction
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[IQL Query] Received request");

    const body = await request.json();
    const { documentId, query, model = "kanon-universal-classifier" } = body;

    console.log("[IQL Query] Request params:", { documentId, query, model });

    if (!documentId || !query) {
      return NextResponse.json(
        { error: "documentId and query are required" },
        { status: 400 },
      );
    }

    // Validate IQL query syntax
    const hasOperators = /(AND|OR|NOT|>|<|\+)/i.test(query);
    const validation = hasOperators
      ? validateIQLQueryWithOperators(query)
      : validateIQLQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Invalid IQL query syntax",
          details: validation.error,
          suggestions: validation.suggestions,
        },
        { status: 400 },
      );
    }

    // Get Supabase client
    const supabase = await createServerSupabaseClient();

    // Get document with extracted text
    console.log("[IQL Query] Fetching document:", documentId);
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, filename, extracted_text, processing_status, matter_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("[IQL Query] Document fetch error:", docError);
      return NextResponse.json(
        {
          error: "Document not found",
          details: docError?.message || "Document does not exist",
        },
        { status: 404 },
      );
    }

    console.log("[IQL Query] Document found:", {
      id: document.id,
      filename: document.filename,
      status: document.processing_status,
      hasText: !!document.extracted_text,
      textLength: document.extracted_text?.length || 0,
    });

    // Check if document is ready
    if (document.processing_status !== "ready") {
      return NextResponse.json(
        {
          error: "Document not ready",
          status: document.processing_status,
        },
        { status: 422 },
      );
    }

    // Check if document has extracted text
    if (
      !document.extracted_text ||
      document.extracted_text.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Document has no extracted text" },
        { status: 422 },
      );
    }

    // Execute IQL query on full document using shared client
    // Isaacus handles chunking internally and returns document-relative positions
    console.log(
      `[IQL Query] Executing query "${query}" on document ${documentId} (${document.filename})`,
    );

    const queryResult = await classifyIQL(
      query,
      document.extracted_text,
      model as ClassificationModel,
    );

    console.log(
      `[IQL Query] IQL found ${queryResult.matches.length} passages, now extracting precise clauses with LLM...`,
    );

    // Extract the query type from IQL format for LLM extraction
    // e.g., "{IS termination clause}" -> "termination clause"
    const queryType =
      query
        .replace(/\{IS\s+/gi, "")
        .replace(/\{CONTAINS\s+/gi, "")
        .replace(/\}/g, "")
        .trim() || query;

    // Context window expansion: grab extra chars before/after chunk to handle cut-off sentences
    const CONTEXT_WINDOW = 200; // characters to add on each side
    const fullText = document.extracted_text;

    // For each IQL match (passage), use LLM to extract the precise clause
    const matchesWithExtractions = await Promise.all(
      queryResult.matches.map(async (match) => {
        const chunkStart = match.startIndex;
        const chunkEnd = match.endIndex;
        const chunkText = match.text;

        // Expand the window to capture sentences that might be cut off at chunk boundaries
        const expandedStart = Math.max(0, chunkStart - CONTEXT_WINDOW);
        const expandedEnd = Math.min(
          fullText.length,
          chunkEnd + CONTEXT_WINDOW,
        );
        const expandedText = fullText.slice(expandedStart, expandedEnd);

        try {
          // Use sentence-based LLM extraction - segments text into sentences,
          // presents them as numbered options, and picks the best one(s)
          console.log(
            `[IQL Query] Extracting "${queryType}" using sentence-based selection (${expandedText.length} chars, window: ${CONTEXT_WINDOW})`,
          );

          // Pass the expandedStart offset so positions are relative to the full document
          const extraction = await extractClauseWithLLM(
            expandedText,
            queryType,
            expandedStart,
          );

          if (
            extraction.clause &&
            extraction.confidence > 0.3 &&
            extraction.startIndex !== undefined &&
            extraction.endIndex !== undefined
          ) {
            const docStart = extraction.startIndex;
            const docEnd = extraction.endIndex;
            const permalink = `cite:${document.id}@${docStart}-${docEnd}`;

            console.log(
              `[IQL Query] LLM selected sentence(s): "${extraction.clause.slice(0, 60)}..." at ${docStart}-${docEnd} (confidence: ${extraction.confidence}${extraction.reasoning ? `, reason: ${extraction.reasoning}` : ""})`,
            );

            return {
              text: extraction.clause,
              startIndex: docStart,
              endIndex: docEnd,
              score: match.score * extraction.confidence,
              // Also include the full chunk for context
              chunkText: chunkText,
              chunkStart: chunkStart,
              chunkEnd: chunkEnd,
              citation: {
                formatted: document.filename,
                permalink,
                markdown: `[${document.filename}](${permalink})`,
                documentId: document.id,
                start: docStart,
                end: docEnd,
              },
            };
          } else {
            console.log(
              `[IQL Query] LLM extraction low confidence (${extraction.confidence}) or no positions, using full chunk`,
            );
          }
        } catch (err) {
          console.error(`[IQL Query] LLM extraction failed for chunk: ${err}`);
        }

        // Fallback: use the full chunk if extraction fails
        const permalink = `cite:${document.id}@${chunkStart}-${chunkEnd}`;
        return {
          ...match,
          citation: {
            formatted: document.filename,
            permalink,
            markdown: `[${document.filename}](${permalink})`,
            documentId: document.id,
            start: chunkStart,
            end: chunkEnd,
          },
        };
      }),
    );

    // Return results
    const result = {
      query,
      documentId: document.id,
      documentName: document.filename,
      matterId: document.matter_id,
      score: queryResult.score,
      matches: matchesWithExtractions,
      executedAt: new Date().toISOString(),
      model,
    };

    console.log(
      `[IQL Query] Query completed: ${matchesWithExtractions.length} matches with LLM-extracted clauses`,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[IQL Query] API error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Internal server error";

    // Handle Isaacus-specific errors
    if (errorMessage.includes("Isaacus") || errorMessage.includes("ISAACUS")) {
      return NextResponse.json(
        {
          error: "Failed to execute IQL query",
          message: "Isaacus API unavailable. Please try again later.",
          details: errorMessage,
        },
        { status: 500 },
      );
    }

    // Handle OpenAI-specific errors
    if (errorMessage.includes("OPENAI") || errorMessage.includes("OpenAI")) {
      return NextResponse.json(
        {
          error: "Failed to extract clause",
          message: "OpenAI API unavailable. Results will show full chunks.",
          details: errorMessage,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while processing your query.",
        ...(process.env.NODE_ENV === "development" && {
          details: errorMessage,
        }),
      },
      { status: 500 },
    );
  }
}
