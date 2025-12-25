import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/isaacus";

/**
 * Document Processing API Route
 *
 * Triggers asynchronous document processing pipeline:
 * 1. Downloads file from Supabase Storage
 * 2. Calls LangGraph agent for structure extraction
 * 3. Generates embeddings for chunks
 * 4. Stores sections, chunks, and embeddings in database
 *
 * POST /api/documents/process
 * Body: { document_id: string }
 */

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

// Get LangGraph agent URL from environment
const LANGGRAPH_URL = process.env.LANGGRAPH_URL || "http://localhost:2024";

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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Call LangGraph agent for structure extraction
    let structureResult: AgentStructureResponse;
    try {
      const agentResponse = await fetch(
        `${LANGGRAPH_URL}/invoke/extract_structure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LANGGRAPH_API_KEY || ""}`,
          },
          body: JSON.stringify({
            document_id,
            file_content: fileContent,
            file_type: document.file_type,
            use_hi_res: true,
          }),
        },
      );

      if (!agentResponse.ok) {
        throw new Error(`Agent returned ${agentResponse.status}`);
      }

      structureResult = await agentResponse.json();
    } catch (agentError) {
      console.error("Agent structure extraction failed:", agentError);

      // Fallback: simple text extraction without structure
      const text = await extractBasicText(fileData, document.file_type);

      structureResult = {
        success: true,
        document_id,
        sections: [],
        chunks: createBasicChunks(text, document_id),
        normalized_markdown: text,
        extraction_quality: 0.3,
        page_count: 1,
      };
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

    // Store sections in database
    if (structureResult.sections && structureResult.sections.length > 0) {
      // Insert sections with parent mapping
      for (const section of structureResult.sections) {
        await supabase.from("document_sections").insert({
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
        });
      }
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

      // Store chunks with embeddings
      try {
        for (let i = 0; i < structureResult.chunks.length; i++) {
          const chunk = structureResult.chunks[i];
          const embedding = embeddings[i];

          if (!embedding) {
            throw new Error(`Missing embedding for chunk ${i}`);
          }

          await supabase.from("document_chunks").insert({
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
          });
        }
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

/**
 * Fallback basic text extraction for when agent is unavailable.
 */
async function extractBasicText(
  fileData: Blob,
  fileType: string,
): Promise<string> {
  const arrayBuffer = await fileData.arrayBuffer();

  if (fileType === "txt") {
    return new TextDecoder().decode(arrayBuffer);
  }

  // For other types, return empty string (real extraction needs agent)
  return "";
}

/**
 * Create basic chunks without structure for fallback.
 */
function createBasicChunks(
  text: string,
  documentId: string,
): AgentStructureResponse["chunks"] {
  const CHUNK_SIZE = 2000;
  const CHUNK_OVERLAP = 200;
  const chunks: NonNullable<AgentStructureResponse["chunks"]> = [];

  if (!text) return chunks;

  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const content = text.slice(start, end);

    chunks.push({
      id: crypto.randomUUID(),
      section_id: null,
      parent_chunk_id: null,
      chunk_level: "paragraph",
      chunk_index: index,
      content,
      content_hash: hashContent(content),
      citation: {
        page: null,
        section_path: [],
        paragraph_index: index,
        heading: null,
        context_before: null,
        context_after: null,
      },
    });

    start += CHUNK_SIZE - CHUNK_OVERLAP;
    index++;
  }

  return chunks;
}

/**
 * Simple content hash using Web Crypto API.
 */
function hashContent(content: string): string {
  // Use simple hash for fallback (real hash computed by agent)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

