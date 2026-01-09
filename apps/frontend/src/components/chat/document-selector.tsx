"use client";

import * as React from "react";
import { FileText, X, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDocuments } from "@/hooks/use-documents";

interface DocumentSelectorProps {
  matterId: string;
  selectedDocumentIds: string[];
  onSelectionChange: (documentIds: string[]) => void;
  className?: string;
}

export function DocumentSelector({
  matterId,
  selectedDocumentIds,
  onSelectionChange,
  className,
}: DocumentSelectorProps) {
  const { documents, isLoading } = useDocuments({ matterId });
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter to only ready documents
  const readyDocuments = React.useMemo(
    () => documents.filter((doc) => doc.processing_status === "ready"),
    [documents],
  );

  // Filter by search
  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return readyDocuments;
    const query = searchQuery.toLowerCase();
    return readyDocuments.filter((doc) =>
      doc.filename.toLowerCase().includes(query),
    );
  }, [readyDocuments, searchQuery]);

  // Get selected documents for display
  const selectedDocuments = React.useMemo(
    () => readyDocuments.filter((doc) => selectedDocumentIds.includes(doc.id)),
    [readyDocuments, selectedDocumentIds],
  );

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opening
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleDocument = (docId: string) => {
    if (selectedDocumentIds.includes(docId)) {
      onSelectionChange(selectedDocumentIds.filter((id) => id !== docId));
    } else {
      onSelectionChange([...selectedDocumentIds, docId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(readyDocuments.map((doc) => doc.id));
    setIsOpen(false);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (!matterId) {
    return null;
  }

  return (
    <div
      className={cn("relative", className)}
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 gap-1.5 text-xs font-normal",
          selectedDocumentIds.length > 0
            ? "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            : "text-stone-600 dark:text-stone-400",
        )}
      >
        <FileText className="size-3.5" />
        {selectedDocumentIds.length === 0 ? (
          <span>All documents</span>
        ) : selectedDocumentIds.length === readyDocuments.length ? (
          <span>All documents</span>
        ) : (
          <span>
            {selectedDocumentIds.length} document
            {selectedDocumentIds.length !== 1 ? "s" : ""}
          </span>
        )}
        <ChevronDown className="size-3 opacity-50" />
      </Button>

      {/* Selected Document Pills */}
      {selectedDocumentIds.length > 0 &&
        selectedDocumentIds.length < readyDocuments.length && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {selectedDocuments.slice(0, 3).map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
              >
                <FileText className="size-3" />
                <span className="max-w-[120px] truncate">{doc.filename}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDocument(doc.id);
                  }}
                  className="rounded-full p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ))}
            {selectedDocuments.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                +{selectedDocuments.length - 3} more
              </span>
            )}
          </div>
        )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-72 rounded-lg border bg-white shadow-lg">
          {/* Search */}
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border bg-stone-50 py-1.5 pr-3 pl-8 text-sm outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:focus:border-stone-500 dark:focus:ring-stone-700"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 border-b px-2 py-1.5">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-stone-600 hover:underline dark:text-stone-400"
            >
              Select all
            </button>
            {selectedDocumentIds.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Document List */}
          <div className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading documents...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? "No matching documents" : "No documents found"}
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const isSelected = selectedDocumentIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDocument(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                        : "text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-stone-700 bg-stone-700 dark:border-stone-400 dark:bg-stone-400"
                          : "border-stone-300 dark:border-stone-600",
                      )}
                    >
                      {isSelected && <Check className="size-3 text-white" />}
                    </div>
                    <FileText className="size-4 shrink-0 text-gray-400" />
                    <span className="flex-1 truncate">{doc.filename}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
            {selectedDocumentIds.length === 0
              ? "No filter — searching all documents"
              : `Searching ${selectedDocumentIds.length} of ${readyDocuments.length} documents`}
          </div>
        </div>
      )}
    </div>
  );
}
