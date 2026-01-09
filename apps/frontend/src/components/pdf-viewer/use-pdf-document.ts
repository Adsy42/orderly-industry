"use client";

import * as React from "react";

interface UsePdfDocumentOptions {
  documentId: string;
}

interface UsePdfDocumentReturn {
  pdfUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  source: "original" | "cached" | "converted" | "inline" | null;
  originalType: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch PDF URL for a document.
 * Handles PDF passthrough and DOCX conversion automatically.
 */
export function usePdfDocument({
  documentId,
}: UsePdfDocumentOptions): UsePdfDocumentReturn {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [source, setSource] =
    React.useState<UsePdfDocumentReturn["source"]>(null);
  const [originalType, setOriginalType] = React.useState<string | null>(null);

  const fetchPdf = React.useCallback(async () => {
    if (!documentId) {
      setError(new Error("Document ID is required"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents/${documentId}/pdf`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch PDF: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data.pdf_url) {
        throw new Error("No PDF URL returned");
      }

      setPdfUrl(data.pdf_url);
      setSource(data.source || null);
      setOriginalType(data.original_type || data.file_type || null);
    } catch (err) {
      console.error("Failed to fetch PDF:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch PDF"));
      setPdfUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  React.useEffect(() => {
    fetchPdf();
  }, [fetchPdf]);

  return {
    pdfUrl,
    isLoading,
    error,
    source,
    originalType,
    refetch: fetchPdf,
  };
}
