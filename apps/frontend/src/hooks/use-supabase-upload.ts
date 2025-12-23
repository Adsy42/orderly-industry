"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { DropzoneFile } from "@/components/dropzone";

interface UseSupabaseUploadOptions {
  bucketName: string;
  path?: string;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number;
  onUploadComplete?: (file: DropzoneFile, storagePath: string) => void;
  onUploadError?: (file: DropzoneFile, error: Error) => void;
}

interface UseSupabaseUploadReturn {
  files: DropzoneFile[];
  isUploading: boolean;
  uploadProgress: number;
  upload: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  retryUpload: (id: string) => void;
  clearFiles: () => void;
  getAcceptedMimeTypes: () => Record<string, string[]>;
}

export function useSupabaseUpload({
  bucketName,
  path = "",
  allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  onUploadComplete,
  onUploadError,
}: UseSupabaseUploadOptions): UseSupabaseUploadReturn {
  const [files, setFiles] = React.useState<DropzoneFile[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getAcceptedMimeTypes = React.useCallback(() => {
    const accept: Record<string, string[]> = {};

    for (const mimeType of allowedMimeTypes) {
      switch (mimeType) {
        case "application/pdf":
          accept[mimeType] = [".pdf"];
          break;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          accept[mimeType] = [".docx"];
          break;
        case "text/plain":
          accept[mimeType] = [".txt"];
          break;
        default:
          accept[mimeType] = [];
      }
    }

    return accept;
  }, [allowedMimeTypes]);

  const uploadFile = React.useCallback(
    async (dropzoneFile: DropzoneFile) => {
      const supabase = createClient();
      const { file } = dropzoneFile;

      // Construct storage path
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const storagePath = path ? `${path}/${fileName}` : fileName;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === dropzoneFile.id
              ? { ...f, status: "uploading" as const, progress: 0 }
              : f,
          ),
        );

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === dropzoneFile.id
              ? { ...f, status: "success" as const, progress: 100 }
              : f,
          ),
        );

        // Call completion callback
        if (onUploadComplete) {
          onUploadComplete(dropzoneFile, data.path);
        }

        return data.path;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === dropzoneFile.id
              ? { ...f, status: "error" as const, error: errorMessage }
              : f,
          ),
        );

        // Call error callback
        if (onUploadError) {
          onUploadError(
            dropzoneFile,
            error instanceof Error ? error : new Error(errorMessage),
          );
        }

        throw error;
      }
    },
    [bucketName, path, onUploadComplete, onUploadError],
  );

  const upload = React.useCallback(
    async (newFiles: File[]) => {
      // Create DropzoneFile objects
      const dropzoneFiles: DropzoneFile[] = newFiles.map((file) => ({
        id: generateId(),
        file,
        progress: 0,
        status: "pending" as const,
      }));

      // Add to state
      setFiles((prev) => {
        const combined = [...prev, ...dropzoneFiles];
        return combined.slice(0, maxFiles);
      });

      setIsUploading(true);

      // Upload all files in parallel
      try {
        await Promise.allSettled(dropzoneFiles.map((file) => uploadFile(file)));
      } finally {
        setIsUploading(false);
      }
    },
    [maxFiles, uploadFile],
  );

  const removeFile = React.useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryUpload = React.useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;

      // Reset status
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "pending" as const, error: undefined }
            : f,
        ),
      );

      setIsUploading(true);
      try {
        await uploadFile(file);
      } finally {
        setIsUploading(false);
      }
    },
    [files, uploadFile],
  );

  const clearFiles = React.useCallback(() => {
    setFiles([]);
  }, []);

  const uploadProgress = React.useMemo(() => {
    if (files.length === 0) return 0;
    const totalProgress = files.reduce((sum, f) => sum + f.progress, 0);
    return Math.round(totalProgress / files.length);
  }, [files]);

  return {
    files,
    isUploading,
    uploadProgress,
    upload,
    removeFile,
    retryUpload,
    clearFiles,
    getAcceptedMimeTypes,
  };
}

export type { UseSupabaseUploadOptions, UseSupabaseUploadReturn };
