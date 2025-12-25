"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, FileText } from "lucide-react";
import type { DocumentSection } from "@/types/documents";

interface SectionTreeProps {
  /** Hierarchical sections to display */
  sections: DocumentSection[];
  /** Matter ID for navigation links */
  matterId: string;
  /** Document ID for navigation links */
  documentId: string;
  /** Currently selected section ID */
  selectedSectionId?: string;
  /** Callback when section is selected */
  onSectionSelect?: (section: DocumentSection) => void;
}

/**
 * Collapsible tree view of document sections.
 *
 * Displays hierarchical document structure with section numbers,
 * titles, and page numbers. Clicking a section navigates to that
 * location in the document viewer.
 */
export function SectionTree({
  sections,
  matterId,
  documentId,
  selectedSectionId,
  onSectionSelect,
}: SectionTreeProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        No sections detected in this document.
      </div>
    );
  }

  return (
    <nav
      className="space-y-1 p-2"
      aria-label="Document sections"
    >
      {sections.map((section) => (
        <SectionNode
          key={section.id}
          section={section}
          matterId={matterId}
          documentId={documentId}
          selectedSectionId={selectedSectionId}
          onSectionSelect={onSectionSelect}
          depth={0}
        />
      ))}
    </nav>
  );
}

interface SectionNodeProps {
  section: DocumentSection;
  matterId: string;
  documentId: string;
  selectedSectionId?: string;
  onSectionSelect?: (section: DocumentSection) => void;
  depth: number;
}

function SectionNode({
  section,
  matterId,
  documentId,
  selectedSectionId,
  onSectionSelect,
  depth,
}: SectionNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = section.children && section.children.length > 0;
  const isSelected = section.id === selectedSectionId;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSectionSelect?.(section);
  };

  const href = `/protected/matters/${matterId}/documents/${documentId}?section=${section.id}${section.start_page ? `&page=${section.start_page}` : ""}`;

  return (
    <div className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${isSelected ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"} `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse icon */}
        {hasChildren ? (
          <button
            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" /> // Spacer for alignment
        )}

        {/* Section icon */}
        <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />

        {/* Section content */}
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          {/* Section number */}
          {section.section_number && (
            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
              {section.section_number}
            </span>
          )}

          {/* Section title */}
          <span className="flex-1 truncate">{section.title || "Untitled"}</span>

          {/* Page number */}
          {section.start_page && (
            <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
              p.{section.start_page}
            </span>
          )}
        </Link>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {section.children!.map((child) => (
            <SectionNode
              key={child.id}
              section={child}
              matterId={matterId}
              documentId={documentId}
              selectedSectionId={selectedSectionId}
              onSectionSelect={onSectionSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for section tree.
 */
export function SectionTreeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2"
        >
          <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </div>
      ))}
    </div>
  );
}
