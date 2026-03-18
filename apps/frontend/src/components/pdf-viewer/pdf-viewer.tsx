"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePdfDocument } from "./use-pdf-document";
import { PDFToolbar } from "./pdf-toolbar";
import type { PDFViewerProps } from "./types";

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false },
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});

// Import styles
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

/**
 * Normalize text for fuzzy matching: collapse whitespace, lowercase.
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").toLowerCase();
}

/**
 * Search through the text layer DOM of a page container and apply
 * yellow highlight styles to spans that overlap with the search text.
 * Returns the first highlighted element for scrolling, or null.
 */
function highlightTextInTextLayer(
  pageContainer: HTMLElement,
  searchText: string,
): HTMLElement | null {
  const textLayer = pageContainer.querySelector(
    ".react-pdf__Page__textContent",
  );
  if (!textLayer) return null;

  const spans = Array.from(textLayer.querySelectorAll("span"));
  if (spans.length === 0) return null;

  // Build a map of concatenated text -> span positions
  let fullText = "";
  const spanMap: { el: HTMLElement; start: number; end: number }[] = [];

  for (const span of spans) {
    const text = span.textContent || "";
    const start = fullText.length;
    fullText += text;
    spanMap.push({ el: span as HTMLElement, start, end: fullText.length });
  }

  const normalizedFull = normalizeText(fullText);
  const normalizedSearch = normalizeText(searchText);

  // Try matching with progressively shorter substrings for robustness
  let matchIdx = -1;
  let matchLen = 0;
  const searchLengths = [
    normalizedSearch.length,
    Math.min(150, normalizedSearch.length),
    Math.min(80, normalizedSearch.length),
  ];

  for (const len of searchLengths) {
    if (len <= 10) continue;
    const sub = normalizedSearch.substring(0, len);
    matchIdx = normalizedFull.indexOf(sub);
    if (matchIdx !== -1) {
      matchLen = len;
      break;
    }
  }

  if (matchIdx === -1) return null;

  // Map normalized match positions back to original text positions.
  // Build a mapping from normalized index -> original index.
  const normToOrig: number[] = [];
  for (let oi = 0; oi < fullText.length; oi++) {
    const ch = fullText[oi];
    const isWs = /\s/.test(ch);
    if (isWs) {
      // In normalized text, consecutive whitespace collapses to one space
      if (oi === 0 || !/\s/.test(fullText[oi - 1])) {
        normToOrig.push(oi);
      }
    } else {
      normToOrig.push(oi);
    }
  }

  const origStart = normToOrig[matchIdx] ?? matchIdx;
  const origEnd = normToOrig[matchIdx + matchLen] ?? fullText.length;

  // Highlight matching spans
  let firstHighlighted: HTMLElement | null = null;
  for (const { el, start, end } of spanMap) {
    if (end > origStart && start < origEnd) {
      el.style.backgroundColor = "rgba(250, 204, 21, 0.4)";
      el.style.borderBottom = "2px solid rgb(250, 204, 21)";
      el.style.borderRadius = "2px";
      if (!firstHighlighted) firstHighlighted = el;
    }
  }

  return firstHighlighted;
}

/**
 * Main PDF Viewer component with highlighting support.
 * Renders PDF documents with navigation, zoom, and clause highlighting.
 */
export function PDFViewer({
  documentId,
  matterId,
  highlightStart,
  highlightEnd,
  highlightText,
  initialPage = 1,
  onClose,
}: PDFViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const [workerReady, setWorkerReady] = React.useState(false);

  const [numPages, setNumPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(initialPage);
  const [scale, setScale] = React.useState<number>(1);
  const [highlightPage, setHighlightPage] = React.useState<number | null>(null);
  const highlightApplied = React.useRef(false);

  const { pdfUrl, isLoading, error, source, originalType } = usePdfDocument({
    documentId,
  });

  // Configure PDF.js worker on client side only
  React.useEffect(() => {
    const setupWorker = async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setWorkerReady(true);
    };
    setupWorker();
  }, []);

  // Handle document load success
  const onDocumentLoadSuccess = React.useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      const targetPage = highlightPage || initialPage;
      if (targetPage > 0 && targetPage <= numPages) {
        setCurrentPage(targetPage);
      }
    },
    [initialPage, highlightPage],
  );

  // Handle page load success
  const onPageLoadSuccess = React.useCallback(
    (_page: { width: number; height: number; pageNumber: number }) => {
      // Page dimensions available if needed in the future
    },
    [],
  );

  // Scroll to page when it changes
  React.useEffect(() => {
    const pageElement = pageRefs.current.get(currentPage);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPage]);

  // After the PDF loads, scan pages with pdfjs to find which page contains the highlight text
  React.useEffect(() => {
    if (!highlightText || !pdfUrl || !numPages || !workerReady) return;

    let cancelled = false;
    const searchText = normalizeText(highlightText.substring(0, 150));
    if (searchText.length <= 10) return;

    const findPage = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const doc = await pdfjs.getDocument(pdfUrl).promise;

        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = normalizeText(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            textContent.items.map((item: any) => item.str).join(""),
          );

          if (pageText.includes(searchText)) {
            if (!cancelled) {
              setHighlightPage(i);
              setCurrentPage(i);
            }
            return;
          }
        }
      } catch (err) {
        console.error("[PDFViewer] Failed to search pages for highlight:", err);
      }
    };

    findPage();
    return () => {
      cancelled = true;
    };
  }, [highlightText, pdfUrl, numPages, workerReady]);

  // After pages render their text layers, apply DOM-based highlighting
  const tryApplyHighlight = React.useCallback(
    (pageNumber: number) => {
      if (!highlightText || highlightApplied.current) return;

      const pageEl = pageRefs.current.get(pageNumber);
      if (!pageEl) return;

      // Retry a few times waiting for the text layer to render
      let attempts = 0;
      const tryHighlight = () => {
        attempts++;
        const firstMatch = highlightTextInTextLayer(pageEl, highlightText);
        if (firstMatch) {
          highlightApplied.current = true;
          setTimeout(() => {
            firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 200);
        } else if (attempts < 10) {
          requestAnimationFrame(tryHighlight);
        }
      };
      requestAnimationFrame(tryHighlight);
    },
    [highlightText],
  );

  // Handle page navigation
  const handlePageChange = React.useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) {
        setCurrentPage(page);
      }
    },
    [numPages],
  );

  // Handle download
  const handleDownload = React.useCallback(() => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, [pdfUrl]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePageChange(currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        handlePageChange(currentPage + 1);
      } else if (e.key === "Home") {
        handlePageChange(1);
      } else if (e.key === "End") {
        handlePageChange(numPages);
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, handlePageChange, onClose]);

  // Loading state (waiting for worker or document)
  if (isLoading || !workerReady) {
    return (
      <div className="bg-muted/30 flex h-full flex-col items-center justify-center gap-4">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {!workerReady
            ? "Initializing PDF viewer..."
            : originalType === "docx"
              ? "Converting document to PDF..."
              : "Loading document..."}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-muted/30 flex h-full flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="text-destructive h-12 w-12" />
        <div className="text-center">
          <p className="text-destructive font-medium">
            Failed to load document
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // No URL state
  if (!pdfUrl) {
    return (
      <div className="bg-muted/30 flex h-full flex-col items-center justify-center gap-4">
        <FileText className="text-muted-foreground h-12 w-12" />
        <p className="text-muted-foreground text-sm">No document available</p>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 flex h-full flex-col">
      {/* Toolbar */}
      <PDFToolbar
        currentPage={currentPage}
        totalPages={numPages}
        scale={scale}
        onPageChange={handlePageChange}
        onScaleChange={setScale}
        onDownload={handleDownload}
        isLoading={isLoading}
      />

      {/* Source indicator */}
      {source && source !== "original" && (
        <div className="border-b bg-amber-50 px-4 py-1.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          {source === "converted"
            ? "This document was converted from DOCX to PDF for viewing."
            : source === "cached"
              ? "Viewing cached PDF conversion."
              : null}
        </div>
      )}

      {/* PDF Document */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
        style={{ backgroundColor: "rgb(82, 86, 89)" }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-white/70">
              <AlertCircle className="h-8 w-8" />
              <p>Failed to load PDF</p>
            </div>
          }
          className="flex flex-col items-center gap-4"
        >
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1;
            const isHighlightPage = pageNumber === highlightPage;

            return (
              <div
                key={pageNumber}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNumber, el);
                }}
                className={cn(
                  "relative shadow-lg",
                  isHighlightPage && "ring-2 ring-yellow-400 ring-offset-2",
                )}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadSuccess={(page) => {
                    onPageLoadSuccess({
                      width: page.width,
                      height: page.height,
                      pageNumber,
                    });
                  }}
                  onRenderSuccess={() => {
                    if (isHighlightPage) {
                      tryApplyHighlight(pageNumber);
                    }
                  }}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white"
                />

                {/* Page number indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                  {pageNumber}
                </div>
              </div>
            );
          })}
        </Document>
      </div>

      {/* Highlighted text sidebar (optional) */}
      {highlightText && (
        <div className="border-t bg-yellow-50 p-4 dark:bg-yellow-950/30">
          <h3 className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Matched Clause
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {highlightText.length > 300
              ? `${highlightText.substring(0, 300)}...`
              : highlightText}
          </p>
        </div>
      )}
    </div>
  );
}
