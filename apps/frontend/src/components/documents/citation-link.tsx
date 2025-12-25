"use client";

import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FormattedCitation } from "@/types/documents";

interface CitationLinkProps {
  /** Formatted citation with short, full, and link formats */
  citation: FormattedCitation;
  /** Optional preview content to show in tooltip */
  preview?: string;
  /** Use inline or block display */
  inline?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Clickable citation link with tooltip preview.
 *
 * Displays a short citation format that links to the document viewer
 * with the relevant section highlighted.
 *
 * @example
 * <CitationLink
 *   citation={{
 *     short: "Contract.pdf, p.12, § 7.2",
 *     full: "Master Services Agreement (Contract.pdf), Page 12, Section 7.2 Governing Law",
 *     link: "/protected/matters/abc/documents/xyz?section=123&page=12"
 *   }}
 *   preview="The governing law for this agreement shall be..."
 * />
 */
export function CitationLink({
  citation,
  preview,
  inline = true,
  className = "",
}: CitationLinkProps) {
  const linkContent = (
    <Link
      href={citation.link}
      className={`text-sm font-medium text-blue-600 underline decoration-dotted underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-solid dark:text-blue-400 dark:hover:text-blue-300 ${inline ? "inline" : "block"} ${className} `}
    >
      [{citation.short}]
    </Link>
  );

  // If no preview, just render the link
  if (!preview) {
    return linkContent;
  }

  // With preview, wrap in tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-sm border bg-white p-3 shadow-lg dark:bg-gray-900"
        >
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {citation.full}
            </p>
            <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
              {preview}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Parse and render citations from AI response text.
 *
 * Finds citation patterns like [Document.pdf, p.12, § 7.2] and renders
 * them as clickable CitationLink components.
 */
interface CitationRendererProps {
  /** Text containing citation patterns */
  text: string;
  /** Matter ID for building links */
  matterId: string;
  /** Map of filename to document ID */
  documentMap: Map<string, string>;
}

export function CitationRenderer({
  text,
  matterId,
  documentMap,
}: CitationRendererProps) {
  // Pattern to match citations
  const pattern =
    /\[([^,\]]+\.(pdf|docx|txt)),?\s*(?:p\.?|Page\s*)(\d+)(?:,?\s*(?:§\s*|Section\s*)([^\]]+))?\]/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    const filename = match[1];
    const page = parseInt(match[3], 10);
    const section = match[4]?.trim();

    // Look up document ID
    const documentId = documentMap.get(filename);

    if (documentId) {
      const citation: FormattedCitation = {
        short: `${filename}, p.${page}${section ? `, § ${section}` : ""}`,
        full: `${filename}, Page ${page}${section ? `, Section ${section}` : ""}`,
        link: `/protected/matters/${matterId}/documents/${documentId}?page=${page}`,
      };

      parts.push(
        <CitationLink
          key={key++}
          citation={citation}
        />,
      );
    } else {
      // If document not found, render as plain text
      parts.push(<span key={key++}>{match[0]}</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
