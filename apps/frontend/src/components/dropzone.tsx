"use client";

import * as React from "react";
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DropzoneFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface DropzoneProps {
  files: DropzoneFile[];
  onDrop: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function Dropzone({
  files,
  onDrop,
  onRemove,
  onRetry,
  accept,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  className,
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragActive(true);
    },
    [disabled],
  );

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = React.useCallback(
    (fileList: FileList | File[]): File[] => {
      const validFiles: File[] = [];
      const filesArray = Array.from(fileList);

      for (const file of filesArray) {
        // Check max files
        if (files.length + validFiles.length >= maxFiles) break;

        // Check file size
        if (file.size > maxSize) continue;

        // Check file type if accept is specified
        if (accept) {
          const fileType = file.type;
          const isAccepted = Object.entries(accept).some(
            ([mimeType, extensions]) => {
              if (fileType === mimeType) return true;
              const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
              return extensions.includes(ext);
            },
          );
          if (!isAccepted) continue;
        }

        validFiles.push(file);
      }

      return validFiles;
    },
    [accept, files.length, maxFiles, maxSize],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (disabled) return;

      const droppedFiles = validateFiles(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onDrop(droppedFiles);
      }
    },
    [disabled, onDrop, validateFiles],
  );

  const handleFileSelect = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = validateFiles(e.target.files);
        if (selectedFiles.length > 0) {
          onDrop(selectedFiles);
        }
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [onDrop, validateFiles],
  );

  const openFileDialog = React.useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const getFileIcon = (status: DropzoneFile["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <Loader2 className="h-4 w-4 animate-spin text-stone-700 dark:text-stone-300" />
        );
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="text-muted-foreground h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const acceptString = accept
    ? Object.entries(accept)
        .flatMap(([mimeType, exts]) => [mimeType, ...exts])
        .join(",")
    : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragActive
            ? "border-stone-800 bg-stone-100 dark:border-stone-300 dark:bg-stone-800"
            : "border-muted-foreground/25 hover:border-stone-500",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptString}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        <Upload
          className={cn(
            "mb-2 h-10 w-10",
            isDragActive
              ? "text-stone-800 dark:text-stone-300"
              : "text-muted-foreground",
          )}
        />
        <p className="text-muted-foreground text-sm">
          {isDragActive ? (
            <span className="text-stone-800 dark:text-stone-300">
              Drop files here
            </span>
          ) : (
            <>
              <span className="text-foreground font-medium">
                Click to upload
              </span>{" "}
              or drag and drop
            </>
          )}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          PDF, DOCX, or TXT up to {formatFileSize(maxSize)}
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="bg-card flex items-center gap-3 rounded-lg border p-3"
            >
              {getFileIcon(file.status)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.file.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {formatFileSize(file.file.size)}
                  </span>
                  {file.status === "uploading" && (
                    <span className="text-xs text-stone-700 dark:text-stone-300">
                      {file.progress}%
                    </span>
                  )}
                  {file.status === "error" && file.error && (
                    <span className="text-xs text-red-500">{file.error}</span>
                  )}
                </div>
                {file.status === "uploading" && (
                  <div className="bg-muted mt-1 h-1 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full bg-stone-800 transition-all dark:bg-stone-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {file.status === "error" && onRetry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(file.id);
                    }}
                  >
                    <Loader2 className="h-4 w-4" />
                    <span className="sr-only">Retry</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.id);
                  }}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { DropzoneFile, DropzoneProps };
