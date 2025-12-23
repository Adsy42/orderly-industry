"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  FileCode,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Document } from "@/hooks/use-documents";

interface DocumentCardProps {
  document: Document;
  onDownload?: (document: Document) => void;
  onView?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  className?: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  docx: <FileCode className="h-5 w-5 text-blue-500" />,
  txt: <File className="h-5 w-5 text-gray-500" />,
};

const statusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  pending: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Queued",
    color: "text-muted-foreground",
  },
  extracting: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Extracting text...",
    color: "text-blue-500",
  },
  embedding: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Generating embeddings...",
    color: "text-purple-500",
  },
  ready: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Ready",
    color: "text-emerald-500",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "Error",
    color: "text-destructive",
  },
};

export function DocumentCard({
  document,
  onDownload,
  onView,
  onDelete,
  className,
}: DocumentCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  const status =
    statusConfig[document.processing_status] || statusConfig.pending;
  const uploadedAgo = formatDistanceToNow(new Date(document.uploaded_at), {
    addSuffix: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    }
    globalThis.document.addEventListener("mousedown", handleClickOutside);
    return () =>
      globalThis.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card
      className={cn(
        "group relative p-4 transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="bg-muted shrink-0 rounded-lg p-2">
          {fileTypeIcons[document.file_type] || <File className="h-5 w-5" />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-medium">{document.filename}</h4>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>{formatFileSize(document.file_size)}</span>
            <span>{uploadedAgo}</span>
          </div>

          {/* Status */}
          <div
            className={cn(
              "mt-2 flex items-center gap-1.5 text-xs",
              status.color,
            )}
          >
            {status.icon}
            <span>{status.label}</span>
          </div>

          {/* Error Message */}
          {document.processing_status === "error" && document.error_message && (
            <p className="text-destructive mt-1 text-xs">
              {document.error_message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          ref={actionsRef}
          className="relative shrink-0"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>

          {showActions && (
            <div className="bg-popover absolute top-full right-0 z-10 mt-1 min-w-[120px] rounded-md border p-1 shadow-md">
              {onView && document.processing_status === "ready" && (
                <button
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => {
                    setShowActions(false);
                    onView(document);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              )}
              {onDownload && (
                <button
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => {
                    setShowActions(false);
                    onDownload(document);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              )}
              {onDelete && (
                <button
                  className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                  onClick={() => {
                    setShowActions(false);
                    onDelete(document);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export type { DocumentCardProps };
