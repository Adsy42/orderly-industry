import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  validateIQLQuery,
  validateIQLQueryWithOperators,
} from "@/lib/iql-validation";
import { classifyIQL, ClassificationModel } from "@/lib/isaacus";

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
      .select("id, filename, extracted_text, processing_status")
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

    // Return results
    const result = {
      query,
      documentId: document.id,
      documentName: document.filename,
      score: queryResult.score,
      matches: queryResult.matches,
      executedAt: new Date().toISOString(),
      model,
    };

    console.log(
      `[IQL Query] Query completed: ${queryResult.matches.length} matches found with score ${queryResult.score.toFixed(2)}`,
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
