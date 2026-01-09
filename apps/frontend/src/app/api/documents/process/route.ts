import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/isaacus";

/**
 * Document Processing API Route
 *
 * Triggers asynchronous document processing pipeline:
 * 1. Downloads file from Supabase Storage
 * 2. Calls LangGraph agent for structure extraction (Azure Document Intelligence)
 * 3. Generates embeddings for chunks
 * 4. Stores sections, chunks, and embeddings in database
 *
 * Supports: PDF, DOCX, DOC files only (requires Azure Document Intelligence)
 *
 * POST /api/documents/process
 * Body: { document_id: string }
 */

// Timeout for LangGraph agent calls (ms)
const LANGGRAPH_TIMEOUT_MS = 120000;

interface ProcessRequest {
  document_id: string;
}

interface AgentStructureResponse {
  success: boolean;
  document_id: string;
  sections?: Array<{
    id: string;
    parent_id: string | null;
    section_number: string | null;
    title: string | null;
    level: number;
    sequence: number;
    path: string[];
    start_page: number | null;
    end_page: number | null;
  }>;
  chunks?: Array<{
    id: string;
    section_id: string | null;
    parent_chunk_id: string | null;
    chunk_level: string;
    chunk_index: number;
    content: string;
    content_hash: string;
    citation: Record<string, unknown>;
  }>;
  normalized_markdown?: string;
  extraction_quality?: number;
  page_count?: number;
  error?: string;
}

import { getLangGraphApiUrl } from "@/lib/env";

// Get LangGraph agent URL from environment at request time (not module load time)
// In production, LANGGRAPH_API_URL must be set to your LangSmith deployment URL

export async function POST(request: NextRequest) {
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let document_id: string | undefined;

  try {
    const body: ProcessRequest = await request.json();
    document_id = body.document_id;

    if (!document_id) {
      return NextResponse.json(
        { error: "document_id is required" },
        { status: 400 },
      );
    }

    // Create Supabase client
    supabase = await createClient();

    // Get authenticated user and session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session for the access token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    // Fetch document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Update status to extracting
    await supabase
      .from("documents")
      .update({
        processing_status: "extracting",
        error_message: null,
      })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.storage_path);

    if (downloadError || !fileData) {
      await supabase
        .from("documents")
        .update({
          processing_status: "error",
          error_message: `Failed to download file: ${downloadError?.message}`,
        })
        .eq("id", document_id);

      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 },
      );
    }

    // Convert to bytes
    const fileBytes = await fileData.arrayBuffer();
    const fileContent = Buffer.from(fileBytes).toString("base64");

    // Update status to structuring
    await supabase
      .from("documents")
      .update({ processing_status: "structuring" })
      .eq("id", document_id);

    // Validate file type - only PDF, DOCX, DOC supported
    const supportedTypes = ["pdf", "docx", "doc"];
    if (!supportedTypes.includes(document.file_type?.toLowerCase())) {
      await supabase
        .from("documents")
        .update({
          processing_status: "error",
          error_message: `Unsupported file type: ${document.file_type}. Supported: ${supportedTypes.join(", ")}`,
        })
        .eq("id", document_id);

      return NextResponse.json(
        {
          error: `Unsupported file type: ${document.file_type}`,
          supported: supportedTypes,
        },
        { status: 400 },
      );
    }

    // Get environment variables at request time (not module load time)
    const LANGGRAPH_URL = getLangGraphApiUrl();

    // Call LangGraph agent for structure extraction
    let structureResult: AgentStructureResponse;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Pass user's Supabase JWT for authentication
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        console.warn(
          "[Document Process] No access token available - LangGraph auth will fail",
        );
      }

      console.log("[Document Process] Calling LangGraph agent:", {
        url: `${LANGGRAPH_URL}/invoke/extract_structure`,
        hasAuthHeader: !!accessToken,
        documentId: document_id,
        fileType: document.file_type,
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        LANGGRAPH_TIMEOUT_MS,
      );

      try {
        const agentResponse = await fetch(
          `${LANGGRAPH_URL}/invoke/extract_structure`,
          {
            method: "POST",
            headers,
            signal: controller.signal,
            body: JSON.stringify({
              document_id,
              file_content: fileContent,
              file_type: document.file_type,
              use_hi_res: true,
            }),
          },
        );

        clearTimeout(timeoutId);

        if (!agentResponse.ok) {
          const errorText = await agentResponse.text();
          console.error("[Document Process] LangGraph agent error:", {
            status: agentResponse.status,
            statusText: agentResponse.statusText,
            body: errorText,
          });
          throw new Error(
            `Agent returned ${agentResponse.status}: ${errorText}`,
          );
        }

        structureResult = await agentResponse.json();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error(
            `LangGraph agent timed out after ${LANGGRAPH_TIMEOUT_MS / 1000} seconds`,
          );
        }
        throw fetchError;
      }

      console.log("[Document Process] LangGraph extraction successful:", {
        sections: structureResult.sections?.length || 0,
        chunks: structureResult.chunks?.length || 0,
        textLength: structureResult.normalized_markdown?.length || 0,
      });
    } catch (agentError) {
      console.error(
        "[Document Process] Agent structure extraction failed:",
        agentError,
      );

      const errorMsg =
        agentError instanceof Error
          ? agentError.message
          : "LangGraph agent unavailable";
      await supabase
        .from("documents")
        .update({
          processing_status: "error",
          error_message: `Text extraction failed: ${errorMsg}. Ensure LangGraph agent is running.`,
        })
        .eq("id", document_id);

      return NextResponse.json(
        {
          error: `Text extraction failed for ${document.file_type.toUpperCase()}`,
          details: errorMsg,
          hint: "Ensure LangGraph agent is running with: cd apps/agent && langgraph dev",
        },
        { status: 500 },
      );
    }

    if (!structureResult.success) {
      await supabase
        .from("documents")
        .update({
          processing_status: "error",
          error_message: structureResult.error || "Structure extraction failed",
        })
        .eq("id", document_id);

      return NextResponse.json(
        { error: structureResult.error },
        { status: 500 },
      );
    }

    // Idempotency: Delete existing sections and chunks for this document
    // This allows re-processing documents without duplicates
    console.log("[Document Process] Clearing existing sections and chunks");
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", document_id);
    await supabase
      .from("document_sections")
      .delete()
      .eq("document_id", document_id);

    // Store sections in database (batch insert)
    if (structureResult.sections && structureResult.sections.length > 0) {
      const sectionsToInsert = structureResult.sections.map((section) => ({
        id: section.id,
        document_id,
        parent_section_id: section.parent_id,
        section_number: section.section_number,
        title: section.title,
        level: section.level,
        sequence: section.sequence,
        path: section.path,
        start_page: section.start_page,
        end_page: section.end_page,
      }));

      const { error: sectionsError } = await supabase
        .from("document_sections")
        .insert(sectionsToInsert);

      if (sectionsError) {
        console.error("Failed to store sections:", sectionsError);
        await supabase
          .from("documents")
          .update({
            processing_status: "error",
            error_message: `Failed to store sections: ${sectionsError.message}`,
          })
          .eq("id", document_id);
        return NextResponse.json(
          { error: `Failed to store sections: ${sectionsError.message}` },
          { status: 500 },
        );
      }

      console.log(
        `[Document Process] Stored ${sectionsToInsert.length} sections`,
      );
    }

    // Update status to embedding
    await supabase
      .from("documents")
      .update({ processing_status: "embedding" })
      .eq("id", document_id);

    // Generate embeddings for chunks
    if (structureResult.chunks && structureResult.chunks.length > 0) {
      const chunkContents = structureResult.chunks.map((c) => c.content);

      // Batch embed (Isaacus handles large batches automatically)
      let embeddings: number[][];
      try {
        embeddings = await embed(chunkContents, "retrieval/document");
      } catch (embedError) {
        console.error("Embedding failed:", embedError);
        const errorMsg =
          embedError instanceof Error
            ? embedError.message
            : "Failed to generate embeddings";
        await supabase
          .from("documents")
          .update({
            processing_status: "error",
            error_message: `Embedding failed: ${errorMsg}`,
          })
          .eq("id", document_id);
        return NextResponse.json(
          { error: `Embedding failed: ${errorMsg}` },
          { status: 500 },
        );
      }

      // Store chunks with embeddings (batch insert)
      try {
        const chunksToInsert = structureResult.chunks.map((chunk, i) => {
          const embedding = embeddings[i];
          if (!embedding) {
            throw new Error(`Missing embedding for chunk ${i}`);
          }
          return {
            id: chunk.id,
            document_id,
            section_id: chunk.section_id,
            parent_chunk_id: chunk.parent_chunk_id,
            chunk_level: chunk.chunk_level,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            content_hash: chunk.content_hash,
            citation: chunk.citation,
            embedding,
            embedding_model: "kanon-2",
          };
        });

        const { error: chunksError } = await supabase
          .from("document_chunks")
          .insert(chunksToInsert);

        if (chunksError) {
          throw chunksError;
        }

        console.log(
          `[Document Process] Stored ${chunksToInsert.length} chunks with embeddings`,
        );
      } catch (storageError) {
        console.error("Failed to store chunks:", storageError);
        const errorMsg =
          storageError instanceof Error
            ? storageError.message
            : "Failed to store chunks";
        await supabase
          .from("documents")
          .update({
            processing_status: "error",
            error_message: `Failed to store chunks: ${errorMsg}`,
          })
          .eq("id", document_id);
        return NextResponse.json(
          { error: `Failed to store chunks: ${errorMsg}` },
          { status: 500 },
        );
      }
    }

    // Update document with final status
    await supabase
      .from("documents")
      .update({
        processing_status: "ready",
        normalized_markdown: structureResult.normalized_markdown,
        structure_extracted: true,
        extraction_quality: structureResult.extraction_quality,
        extracted_text: structureResult.normalized_markdown,
        processed_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    return NextResponse.json({
      success: true,
      document_id,
      sections_count: structureResult.sections?.length || 0,
      chunks_count: structureResult.chunks?.length || 0,
      extraction_quality: structureResult.extraction_quality,
    });
  } catch (error) {
    console.error("Document processing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    // Ensure document status is updated on error (if we have both supabase and document_id)
    if (supabase && document_id) {
      try {
        await supabase
          .from("documents")
          .update({
            processing_status: "error",
            error_message: errorMessage,
          })
          .eq("id", document_id);
      } catch (updateError) {
        console.error("Failed to update document status:", updateError);
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
