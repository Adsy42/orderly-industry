"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PDFViewer } from "@/components/pdf-viewer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * PDF Document Viewer Page
 *
 * Opens documents in a full-page viewer with highlighting support.
 * URL format: /protected/documents/view/[documentId]?start=X&end=Y&page=Z&matterId=M
 *
 * Query parameters:
 * - start: Start character position for highlighting
 * - end: End character position for highlighting
 * - page: Initial page number to display
 * - matterId: Matter ID for back navigation
 * - text: Text content to show in sidebar (optional)
 */
export default function DocumentViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const documentId = params.documentId as string;
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const page = searchParams.get("page");
  const matterId = searchParams.get("matterId");
  const highlightText = searchParams.get("text");

  const highlightStart = start ? parseInt(start, 10) : undefined;
  const highlightEnd = end ? parseInt(end, 10) : undefined;
  const initialPage = page ? parseInt(page, 10) : 1;

  // Build back link based on available context
  const backLink = matterId
    ? `/protected/matters/${matterId}/documents/${documentId}`
    : "/protected/matters";

  const handleClose = React.useCallback(() => {
    window.close();
  }, []);

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <Link href={backLink}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Document
            </Button>
          </Link>

          <div className="bg-border h-4 w-px" />

          <h1 className="text-muted-foreground text-sm font-medium">
            Document Viewer
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {matterId && (
            <Link
              href={`/protected/matters/${matterId}/documents/${documentId}/iql`}
              target="_blank"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Clause Finder
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* PDF Viewer */}
      <main className="flex-1 overflow-hidden">
        <PDFViewer
          documentId={documentId}
          matterId={matterId || undefined}
          highlightStart={highlightStart}
          highlightEnd={highlightEnd}
          highlightText={highlightText || undefined}
          initialPage={initialPage}
          onClose={handleClose}
        />
      </main>
    </div>
  );
}
