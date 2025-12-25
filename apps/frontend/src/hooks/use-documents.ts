"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface Document {
  id: string;
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: "pdf" | "docx" | "txt";
  file_size: number;
  mime_type: string | null;
  extracted_text: string | null;
  processing_status: "pending" | "extracting" | "embedding" | "ready" | "error";
  error_message: string | null;
  uploaded_by: string;
  uploaded_at: string;
  processed_at: string | null;
}

export interface CreateDocumentInput {
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
}

interface UseDocumentsOptions {
  matterId: string;
}

interface UseDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: Error | null;
  createDocument: (input: CreateDocumentInput) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  getSignedUrl: (storagePath: string) => Promise<string | null>;
  refetch: () => Promise<void>;
}

export function useDocuments({
  matterId,
}: UseDocumentsOptions): UseDocumentsReturn {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("documents")
        .select("*")
        .eq("matter_id", matterId)
        .order("uploaded_at", { ascending: false });

      if (fetchError) throw new Error(fetchError.message);
      setDocuments((data as Document[]) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch documents"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [matterId]);

  // Set up real-time subscription for document status updates
  React.useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    fetchDocuments();

    // Subscribe to changes on documents for this matter
    const channel = supabase
      .channel(`documents:${matterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `matter_id=eq.${matterId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDocuments((prev) => [payload.new as Document, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === payload.new.id ? (payload.new as Document) : doc,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setDocuments((prev) =>
              prev.filter((doc) => doc.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matterId, fetchDocuments]);

  const createDocument = React.useCallback(
    async (input: CreateDocumentInput): Promise<Document | null> => {
      const supabase = createClient();
      setError(null);

      try {
        const { data, error: createError } = await supabase
          .from("documents")
          .insert({
            matter_id: input.matter_id,
            storage_path: input.storage_path,
            filename: input.filename,
            file_type: input.file_type,
            file_size: input.file_size,
            mime_type: input.mime_type || null,
            processing_status: "pending", // Start as pending for processing
          })
          .select()
          .single();

        if (createError) throw new Error(createError.message);

        // Trigger document processing via new API route
        try {
          if (data) {
            fetch("/api/documents/process", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document_id: data.id,
              }),
            }).catch((err) => {
              console.warn("Document processing request failed:", err);
            });
          }
        } catch (err) {
          console.warn("Failed to trigger document processing:", err);
        }

        return data as Document;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create document"),
        );
        return null;
      }
    },
    [],
  );

  const deleteDocument = React.useCallback(
    async (id: string): Promise<boolean> => {
      const supabase = createClient();
      setError(null);

      try {
        // Find the document to get storage path
        const doc = documents.find((d) => d.id === id);
        if (doc) {
          // Delete from storage first
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove([doc.storage_path]);

          if (storageError) {
            console.warn(
              "Failed to delete from storage:",
              storageError.message,
            );
          }
        }

        // Delete from database (cascades to embeddings)
        const { error: deleteError } = await supabase
          .from("documents")
          .delete()
          .eq("id", id);

        if (deleteError) throw new Error(deleteError.message);

        // Remove from local state
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to delete document"),
        );
        return false;
      }
    },
    [documents],
  );

  const getSignedUrl = React.useCallback(
    async (storagePath: string): Promise<string | null> => {
      const supabase = createClient();

      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(storagePath, 3600); // 1 hour expiry

        if (error) throw error;
        return data.signedUrl;
      } catch {
        return null;
      }
    },
    [],
  );

  return {
    documents,
    isLoading,
    error,
    createDocument,
    deleteDocument,
    getSignedUrl,
    refetch: fetchDocuments,
  };
}

export type { UseDocumentsOptions, UseDocumentsReturn };
