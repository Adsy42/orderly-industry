"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Search,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  extracted_text: string | null;
  matter_id: string;
}

interface DocumentChunk {
  id: string;
  content: string;
  chunk_index: number;
  citation: {
    page?: number;
    section_path?: string[];
    heading?: string;
  } | null;
}

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string | null;
  order_index: number;
}

/**
 * Renders text with a highlighted span at the specified character positions.
 * This enables precise highlighting of extracted answers within chunks.
 */
function HighlightedText({
  text,
  start,
  end,
  markRef,
}: {
  text: string;
  start: number;
  end: number;
  markRef?: React.RefObject<HTMLElement | null>;
}) {
  // Validate positions
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));

  if (safeStart >= safeEnd) {
    return <>{text}</>;
  }

  const before = text.slice(0, safeStart);
  const highlighted = text.slice(safeStart, safeEnd);
  const after = text.slice(safeEnd);

  return (
    <>
      {before}
      <mark
        ref={markRef as React.RefObject<HTMLElement>}
        className="rounded bg-yellow-200 px-0.5 text-gray-900 ring-2 ring-yellow-300"
      >
        {highlighted}
      </mark>
      {after}
    </>
  );
}

/**
 * Shows a focused excerpt around the highlighted text with context.
 * Used for IQL results to avoid rendering the entire document.
 */
function FocusedHighlight({
  text,
  start,
  end,
  contextChars = 500,
  markRef,
}: {
  text: string;
  start: number;
  end: number;
  contextChars?: number;
  markRef?: React.RefObject<HTMLDivElement | null>;
}) {
  // Validate positions
  const safeStart = Math.max(0, Math.min(start, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end, text.length));

  if (safeStart >= safeEnd) {
    return <p className="text-muted-foreground text-sm">No highlight found</p>;
  }

  // Calculate context window
  const excerptStart = Math.max(0, safeStart - contextChars);
  const excerptEnd = Math.min(text.length, safeEnd + contextChars);

  // Adjust positions relative to excerpt
  const relativeStart = safeStart - excerptStart;
  const relativeEnd = safeEnd - excerptStart;

  const excerpt = text.slice(excerptStart, excerptEnd);
  const showStartEllipsis = excerptStart > 0;
  const showEndEllipsis = excerptEnd < text.length;

  const before = excerpt.slice(0, relativeStart);
  const highlighted = excerpt.slice(relativeStart, relativeEnd);
  const after = excerpt.slice(relativeEnd);

  return (
    <div ref={markRef}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
        {showStartEllipsis && <span className="text-gray-400">... </span>}
        {before}
        <mark className="rounded bg-yellow-200 px-0.5 text-gray-900 ring-2 ring-yellow-300">
          {highlighted}
        </mark>
        {after}
        {showEndEllipsis && <span className="text-gray-400"> ...</span>}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">
        Position: {start.toLocaleString()}-{end.toLocaleString()} of{" "}
        {text.length.toLocaleString()} chars
      </p>
    </div>
  );
}

export default function DocumentViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const matterId = params.matterId as string;
  const documentId = params.documentId as string;
  const highlightChunkId = searchParams.get("highlight");

  // Parse precise character positions for exact text highlighting
  const highlightStart = searchParams.get("start")
    ? parseInt(searchParams.get("start")!, 10)
    : null;
  const highlightEnd = searchParams.get("end")
    ? parseInt(searchParams.get("end")!, 10)
    : null;

  const [document, setDocument] = React.useState<Document | null>(null);
  const [chunks, setChunks] = React.useState<DocumentChunk[]>([]);
  const [sections, setSections] = React.useState<DocumentSection[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const highlightRef = React.useRef<HTMLDivElement>(null);

  // Fetch document info and chunks
  React.useEffect(() => {
    async function fetchDocumentData() {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();

        // Fetch document
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

        if (docError || !docData) {
          setError("Document not found");
          return;
        }
        setDocument(docData);

        // Fetch chunks
        const { data: chunkData } = await supabase
          .from("document_chunks")
          .select("id, content, chunk_index, citation")
          .eq("document_id", documentId)
          .order("chunk_index", { ascending: true });

        if (chunkData) {
          setChunks(chunkData);
        }

        // Fetch sections
        const { data: sectionData } = await supabase
          .from("document_sections")
          .select("id, title, level, content, order_index")
          .eq("document_id", documentId)
          .order("order_index", { ascending: true });

        if (sectionData) {
          setSections(sectionData);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }

    if (documentId) {
      fetchDocumentData();
    }
  }, [documentId]);

  // Scroll to highlighted area after load - simplified and more reliable
  React.useEffect(() => {
    const hasHighlighting =
      highlightChunkId || (highlightStart !== null && highlightEnd !== null);

    if (!hasHighlighting || isLoading) {
      return;
    }

    // Use a simple, reliable scroll approach
    const scrollToHighlight = () => {
      const element = highlightRef.current;
      if (!element) return false;

      // Check if element has dimensions (is rendered)
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
      return true;
    };

    // Try immediately after a short delay for initial render
    const initialTimeout = setTimeout(() => {
      if (!scrollToHighlight()) {
        // If failed, try again with RAF + delay
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToHighlight();
          }, 100);
        });
      }
    }, 200);

    return () => clearTimeout(initialTimeout);
  }, [highlightChunkId, highlightStart, highlightEnd, isLoading]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error || "Document not found"}</p>
          <Link href={`/protected/matters/${matterId}`}>
            <Button
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href={`/protected/matters/${matterId}`}
              className="hover:text-gray-700"
            >
              Matter
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span>Documents</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-700">{document.filename}</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6 text-blue-600" />
            {document.filename}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{document.file_type.toUpperCase()}</span>
            <span>•</span>
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                document.processing_status === "ready"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600",
              )}
            >
              {document.processing_status}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/protected/matters/${matterId}/documents/${documentId}/iql`}
          >
            <Button
              variant="outline"
              size="sm"
            >
              <Search className="mr-2 h-4 w-4" />
              Clause Finder
            </Button>
          </Link>
        </div>
      </div>

      {/* Document Sections */}
      {sections.length > 0 && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Document Structure
          </h2>
          <div className="space-y-1">
            {sections.map((section) => (
              <div
                key={section.id}
                className="text-sm"
                style={{ paddingLeft: `${(section.level - 1) * 16}px` }}
              >
                <span className="text-gray-600">{section.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Content - Chunks or Full Text with Highlighting */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Document Content</h2>

        {/* 
          IQL case: Document-level positions but no chunk ID 
          Show focused excerpt around the highlighted text
        */}
        {!highlightChunkId &&
        highlightStart !== null &&
        highlightEnd !== null &&
        document.extracted_text ? (
          <div
            ref={highlightRef}
            className="rounded-lg border bg-white p-6 ring-2 ring-yellow-300"
          >
            <div className="mb-2 text-xs text-gray-500">
              Highlighted match in document
            </div>
            <FocusedHighlight
              text={document.extracted_text}
              start={highlightStart}
              end={highlightEnd}
              contextChars={500}
            />
          </div>
        ) : chunks.length > 0 ? (
          <div className="space-y-3">
            {chunks.map((chunk) => {
              const isHighlighted = chunk.id === highlightChunkId;
              const citation = chunk.citation;

              return (
                <div
                  key={chunk.id}
                  ref={isHighlighted ? highlightRef : undefined}
                  className={cn(
                    "rounded-lg border p-4 transition-all",
                    isHighlighted
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  {/* Citation header */}
                  {citation && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                      {citation.page && <span>Page {citation.page}</span>}
                      {citation.section_path &&
                        citation.section_path.length > 0 && (
                          <>
                            {citation.page && <span>•</span>}
                            <span>§ {citation.section_path.join(" › ")}</span>
                          </>
                        )}
                      {citation.heading && (
                        <>
                          <span>•</span>
                          <span className="font-medium">
                            {citation.heading}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Chunk content with optional precise highlighting */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                    {isHighlighted &&
                    highlightStart !== null &&
                    highlightEnd !== null ? (
                      <HighlightedText
                        text={chunk.content}
                        start={highlightStart}
                        end={highlightEnd}
                      />
                    ) : (
                      chunk.content
                    )}
                  </p>

                  {/* Chunk footer */}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>Chunk {chunk.chunk_index + 1}</span>
                    {isHighlighted && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {highlightStart !== null
                          ? "Exact match highlighted"
                          : "Highlighted from citation"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : document.extracted_text ? (
          <div
            ref={
              !highlightChunkId && highlightStart !== null
                ? highlightRef
                : undefined
            }
            className={cn(
              "rounded-lg border bg-white p-6",
              !highlightChunkId &&
                highlightStart !== null &&
                "ring-2 ring-yellow-300",
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {highlightStart !== null && highlightEnd !== null ? (
                <HighlightedText
                  text={document.extracted_text}
                  start={highlightStart}
                  end={highlightEnd}
                />
              ) : (
                document.extracted_text
              )}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed bg-gray-50 p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">
              Document is still being processed...
            </p>
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="pt-4">
        <Link href={`/protected/matters/${matterId}`}>
          <Button
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matter
          </Button>
        </Link>
      </div>
    </div>
  );
}
