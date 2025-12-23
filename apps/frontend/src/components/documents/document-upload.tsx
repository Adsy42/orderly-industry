"use client";

import * as React from "react";
import { Dropzone, type DropzoneFile } from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { useDocuments, type CreateDocumentInput } from "@/hooks/use-documents";

interface DocumentUploadProps {
  matterId: string;
  onUploadComplete?: () => void;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext;
}

export function DocumentUpload({
  matterId,
  onUploadComplete,
}: DocumentUploadProps) {
  const { createDocument } = useDocuments({ matterId });

  const handleUploadComplete = React.useCallback(
    async (file: DropzoneFile, storagePath: string) => {
      // Create document record in database
      const input: CreateDocumentInput = {
        matter_id: matterId,
        storage_path: storagePath,
        filename: file.file.name,
        file_type: getFileType(file.file.name),
        file_size: file.file.size,
        mime_type: file.file.type,
      };

      await createDocument(input);
      onUploadComplete?.();
    },
    [matterId, createDocument, onUploadComplete],
  );

  const handleUploadError = React.useCallback(
    (file: DropzoneFile, error: Error) => {
      console.error(`Failed to upload ${file.file.name}:`, error.message);
    },
    [],
  );

  const {
    files,
    isUploading,
    upload,
    removeFile,
    retryUpload,
    getAcceptedMimeTypes,
  } = useSupabaseUpload({
    bucketName: "documents",
    path: `matters/${matterId}`,
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    onUploadComplete: handleUploadComplete,
    onUploadError: handleUploadError,
  });

  return (
    <Dropzone
      files={files}
      onDrop={upload}
      onRemove={removeFile}
      onRetry={retryUpload}
      accept={getAcceptedMimeTypes()}
      maxFiles={MAX_FILES}
      maxSize={MAX_FILE_SIZE}
      disabled={isUploading}
    />
  );
}

export type { DocumentUploadProps };
