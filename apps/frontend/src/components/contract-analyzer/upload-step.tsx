"use client";

import * as React from "react";
import { Upload, FileText, Zap, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/types/contract-analysis";

interface UploadStepProps {
  onUpload: (file: File | null, documentType: DocumentType) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or DOCX file");
      return;
    }
    // Auto-detect document type based on filename (simplified for demo)
    const docType: DocumentType = file.name.toLowerCase().includes("section")
      ? "section_32"
      : "contract_of_sale";
    onUpload(file, docType);
  };

  const handleSampleContract = () => {
    onUpload(null, "contract_of_sale");
  };

  const handleSampleSection32 = () => {
    onUpload(null, "section_32");
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Dropzone */}
      <div
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300",
          isDragOver
            ? "border-stone-800 bg-stone-100 dark:border-stone-300 dark:bg-stone-800"
            : "border-stone-300 bg-stone-50/50 hover:border-stone-500 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800/50 dark:hover:border-stone-400",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div
          className={cn(
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300",
            isDragOver
              ? "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200"
              : "bg-stone-100 text-stone-400 dark:bg-stone-700 dark:text-stone-500",
          )}
        >
          <Upload className="h-8 w-8" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
          Drop your contract here
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          or click to browse files
        </p>
        <p className="text-muted-foreground text-xs">Supports: PDF, DOCX</p>
      </div>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-slate-700" />
        <span className="text-muted-foreground text-sm font-medium">
          or try a sample
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-slate-700" />
      </div>

      {/* Sample document buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={handleSampleContract}
          className={cn(
            "group flex items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5",
            "transition-all duration-200",
            "hover:border-stone-400 hover:shadow-lg hover:shadow-stone-100",
            "dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-500",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-700 transition-colors group-hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300">
            <Zap className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Sample Contract of Sale
            </p>
            <p className="text-muted-foreground text-sm">
              Instant demo with 8 red flags
            </p>
          </div>
        </button>

        <button
          onClick={handleSampleSection32}
          className={cn(
            "group flex items-center gap-4 rounded-2xl border-2 border-stone-200 bg-white p-5",
            "transition-all duration-200",
            "hover:border-stone-400 hover:shadow-lg hover:shadow-stone-100",
            "dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-500",
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-700 transition-colors group-hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300">
            <FileCheck className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-zinc-900 dark:text-white">
              Sample Section 32
            </p>
            <p className="text-muted-foreground text-sm">
              Vendor statement with 9 flags
            </p>
          </div>
        </button>
      </div>

      {/* Info box */}
      <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50">
        <div className="flex items-start gap-3">
          <FileText className="text-muted-foreground mt-0.5 h-5 w-5" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              What we analyze
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Our AI scans for 27 types of red flags across Contract of Sale and
              Section 32 documents, including financial risks, title issues,
              planning restrictions, and compliance concerns specific to
              Victorian property law.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
