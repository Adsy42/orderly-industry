import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/citations/[documentId]
 *
 * Fetches citation context for preview tooltips in chat.
 * Returns document metadata and optional chunk context.
 *
 * Query params:
 * - chunkId: Optional chunk ID to fetch specific chunk text
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const { searchParams } = new URL(request.url);
  const chunkId = searchParams.get("chunkId");

  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch document metadata
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, filename, file_type, matter_id")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // If chunk ID provided, fetch the chunk text
  let chunkPreview: string | null = null;
  if (chunkId) {
    const { data: chunk } = await supabase
      .from("document_chunks")
      .select("content, citation")
      .eq("id", chunkId)
      .eq("document_id", documentId)
      .single();

    if (chunk) {
      // Return first 200 chars as preview
      chunkPreview = chunk.content?.slice(0, 200) + "...";
    }
  }

  return NextResponse.json({
    documentId: document.id,
    filename: document.filename,
    fileType: document.file_type,
    matterId: document.matter_id,
    preview: chunkPreview,
    link: `/protected/matters/${document.matter_id}/documents/${document.id}`,
  });
}
