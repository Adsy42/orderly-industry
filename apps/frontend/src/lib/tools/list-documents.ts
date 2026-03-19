/**
 * List Matter Documents Tool - direct Supabase query
 *
 * Returns document metadata for a matter.
 */

import { createClient } from "@/lib/supabase/server";

interface ListDocumentsParams {
  matter_id: string;
}

export async function executeListDocuments(params: ListDocumentsParams) {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("documents")
    .select(
      "id, filename, file_type, file_size, processing_status, uploaded_at",
    )
    .eq("matter_id", params.matter_id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return {
      documents: [],
      total_count: 0,
      matter_id: params.matter_id,
      error: error.message,
    };
  }

  if (!documents?.length) {
    return {
      documents: [],
      total_count: 0,
      matter_id: params.matter_id,
      message: "No documents have been uploaded to this matter yet.",
    };
  }

  const formatted = documents.map((doc) => ({
    document_id: doc.id,
    filename: doc.filename,
    file_type: doc.file_type,
    file_size: doc.file_size,
    processing_status: doc.processing_status,
    uploaded_at: doc.uploaded_at,
  }));

  const readyCount = documents.filter(
    (d) => d.processing_status === "ready",
  ).length;
  const processingCount = documents.filter((d) =>
    ["pending", "extracting", "embedding"].includes(d.processing_status),
  ).length;
  const errorCount = documents.filter(
    (d) => d.processing_status === "error",
  ).length;

  return {
    documents: formatted,
    total_count: formatted.length,
    matter_id: params.matter_id,
    summary: {
      ready_for_search: readyCount,
      still_processing: processingCount,
      failed: errorCount,
    },
  };
}
