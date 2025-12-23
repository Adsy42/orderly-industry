"use client";

import * as React from "react";
import { FileText, Upload } from "lucide-react";
import { DocumentCard } from "./document-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document } from "@/hooks/use-documents";

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  onUpload?: () => void;
  onDownload?: (document: Document) => void;
  onView?: (document: Document) => void;
  onDelete?: (document: Document) => void;
}

export function DocumentList({
  documents,
  isLoading = false,
  onUpload,
  onDownload,
  onView,
  onDelete,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[88px] rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <FileText className="text-muted-foreground/50 mb-4 h-10 w-10" />
        <h3 className="mb-2 font-medium">No documents yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
          Upload documents to this matter to start organizing and analyzing your
          files.
        </p>
        {onUpload && (
          <Button
            onClick={onUpload}
            size="sm"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onDownload={onDownload}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export type { DocumentListProps };
