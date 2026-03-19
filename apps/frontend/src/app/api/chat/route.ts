import { openai } from "@ai-sdk/openai";
import { streamText, stepCountIs, jsonSchema, type Tool } from "ai";
import { createClient } from "@/lib/supabase/server";
import { executeLegalAnswer } from "@/lib/tools/legal-answer";
import { executeLegalClassify } from "@/lib/tools/legal-classify";
import { executeListDocuments } from "@/lib/tools/list-documents";
import { executeWebSearch } from "@/lib/tools/web-search";

export const maxDuration = 120;

const SYSTEM_PROMPT = `# Orderly Legal AI Assistant

You are an AI legal research assistant for Australian legal professionals (counsel).
You have two core capabilities:

1. **Web Research** - Search the web for legal information, case law, and general research
2. **Document Analysis** - Search, extract, and analyze documents uploaded to client matters

## Document Analysis

When users ask about documents in their matter, use the appropriate tool:

| Query Type | Tool | Example |
|------------|------|---------|
| List/inventory | list_matter_documents | "What documents are in this matter?" |
| Answer question | legal_answer | "What is the notice period?" |
| Find clauses | legal_classify | "Show me termination clauses" |
| Web research | web_search | "What is the law on unfair dismissal?" |

## Finding the matter_id

Look for a [CONTEXT] message in the conversation that contains the matter_id UUID.
If no [CONTEXT] message exists, ask the user which matter they're referring to.

## Citation Rules

**EVERY piece of information from documents MUST include a citation.**

Tools return citations in this format:
\`citation.markdown: "[filename.pdf](cite:doc-id@123-456)"\`

Always include the citation.markdown value in your response.

Example: The notice period is 30 days written notice [Contract.pdf](cite:abc123@1542-1564).

## When Finding Clauses

When legal_classify returns matches, list ALL of them grouped by document.
Never show only one match when multiple exist.

## Research

For web research queries:
- Use web_search to find relevant information
- Cite sources with [1], [2] format and include URLs
- Use think tool to reflect on findings before responding

## Response Format

1. Lead with the direct answer
2. Include ALL citations from tool results
3. Group by document when multiple matches
4. Quote relevant text when helpful
5. Be concise and professional`;

// Define tools using jsonSchema for Zod v4 compatibility
const tools: Record<string, Tool<any, any>> = {
  legal_answer: {
    description:
      "Extract precise answers from legal documents with exact citations. Use when users ask specific questions.",
    inputSchema: jsonSchema({
      type: "object" as const,
      properties: {
        matter_id: { type: "string", description: "UUID of the matter" },
        question: { type: "string", description: "The question to answer" },
        document_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional document UUIDs to search",
        },
      },
      required: ["matter_id", "question"],
    }),
    execute: async (params: {
      matter_id: string;
      question: string;
      document_ids?: string[];
    }) => executeLegalAnswer(params),
  },

  legal_classify: {
    description:
      "Find and classify legal clauses in documents with exact citations.",
    inputSchema: jsonSchema({
      type: "object" as const,
      properties: {
        matter_id: { type: "string", description: "UUID of the matter" },
        clause_type: {
          type: "string",
          description: "Type of clause to find",
        },
        document_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional document UUIDs to search",
        },
      },
      required: ["matter_id", "clause_type"],
    }),
    execute: async (params: {
      matter_id: string;
      clause_type: string;
      document_ids?: string[];
    }) => executeLegalClassify(params),
  },

  list_matter_documents: {
    description: "List all documents in a matter with their metadata.",
    inputSchema: jsonSchema({
      type: "object" as const,
      properties: {
        matter_id: {
          type: "string",
          description: "UUID of the matter to list documents for",
        },
      },
      required: ["matter_id"],
    }),
    execute: async (params: { matter_id: string }) =>
      executeListDocuments(params),
  },

  web_search: {
    description: "Search the web for information.",
    inputSchema: jsonSchema({
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        max_results: {
          type: "number",
          description: "Max results (default: 3)",
        },
        topic: {
          type: "string",
          enum: ["general", "news", "finance"],
          description: "Topic filter",
        },
      },
      required: ["query"],
    }),
    execute: async (params: {
      query: string;
      max_results?: number;
      topic?: "general" | "news" | "finance";
    }) => executeWebSearch(params),
  },

  think: {
    description: "Tool for strategic reflection on research progress.",
    inputSchema: jsonSchema({
      type: "object" as const,
      properties: {
        reflection: {
          type: "string",
          description: "Your reflection on research progress",
        },
      },
      required: ["reflection"],
    }),
    execute: async ({ reflection }: { reflection: string }) => ({
      recorded: true,
      reflection,
    }),
  },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, conversationId } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async () => {
      if (conversationId) {
        try {
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        } catch {
          // Non-critical
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
