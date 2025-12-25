/**
 * Citation formatting utilities for legal documents.
 *
 * Formats citations in legal style (Document.pdf, p.X, § Y.Z)
 * for search results and AI responses.
 */

import type { Citation, FormattedCitation } from "@/types/documents";

/**
 * Format a citation in full legal style.
 *
 * Example: "Master Services Agreement (Contract.pdf), Page 12, Section 7.2 Governing Law"
 */
export function formatCitationFull(
  filename: string,
  citation: Citation,
  documentTitle?: string,
): string {
  const parts: string[] = [];

  // Document name
  if (documentTitle) {
    parts.push(`${documentTitle} (${filename})`);
  } else {
    parts.push(filename);
  }

  // Page number
  if (citation.page) {
    parts.push(`Page ${citation.page}`);
  }

  // Section path
  if (citation.section_path && citation.section_path.length > 0) {
    const lastSection = citation.section_path[citation.section_path.length - 1];
    parts.push(`Section ${lastSection}`);
  } else if (citation.heading) {
    parts.push(citation.heading);
  }

  return parts.join(", ");
}

/**
 * Format a citation in short inline style.
 *
 * Example: "Contract.pdf, p.12, § 7.2"
 */
export function formatCitationShort(
  filename: string,
  citation: Citation,
): string {
  const parts: string[] = [filename];

  // Page number (abbreviated)
  if (citation.page) {
    parts.push(`p.${citation.page}`);
  }

  // Section number (legal style with §)
  if (citation.section_path && citation.section_path.length > 0) {
    const lastSection = citation.section_path[citation.section_path.length - 1];
    // Extract section number if present (e.g., "7.2 Governing Law" -> "§ 7.2")
    const sectionMatch = lastSection.match(/^(\d+\.?)+/);
    if (sectionMatch) {
      parts.push(`§ ${sectionMatch[0]}`);
    } else {
      // Use first few words of heading
      const shortHeading = lastSection.split(" ").slice(0, 3).join(" ");
      parts.push(shortHeading);
    }
  }

  return parts.join(", ");
}

/**
 * Build a citation link for navigation to document viewer.
 *
 * @param matterId - Matter UUID
 * @param documentId - Document UUID
 * @param sectionId - Optional section UUID to highlight
 * @param page - Optional page number to scroll to
 */
export function buildCitationLink(
  matterId: string,
  documentId: string,
  sectionId?: string | null,
  page?: number | null,
): string {
  const url = `/protected/matters/${matterId}/documents/${documentId}`;
  const params = new URLSearchParams();

  if (sectionId) {
    params.set("section", sectionId);
  }

  if (page) {
    params.set("page", page.toString());
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Format a complete citation object with all formats.
 */
export function formatCitation(
  filename: string,
  citation: Citation,
  matterId: string,
  documentId: string,
  sectionId?: string | null,
  documentTitle?: string,
): FormattedCitation {
  return {
    short: formatCitationShort(filename, citation),
    full: formatCitationFull(filename, citation, documentTitle),
    link: buildCitationLink(matterId, documentId, sectionId, citation.page),
  };
}

/**
 * Parse a citation pattern from AI response text.
 *
 * Matches patterns like:
 * - [Contract.pdf, p.12, § 7.2]
 * - [Document.pdf, Page 5]
 * - [filename.pdf, p.1, Section 3.1]
 *
 * @returns Array of parsed citation matches with positions
 */
export function parseCitationPatterns(text: string): Array<{
  match: string;
  filename: string;
  page?: number;
  section?: string;
  startIndex: number;
  endIndex: number;
}> {
  const citations: Array<{
    match: string;
    filename: string;
    page?: number;
    section?: string;
    startIndex: number;
    endIndex: number;
  }> = [];

  // Pattern: [filename.pdf, p.X, § Y.Z] or similar variations
  const pattern =
    /\[([^,\]]+\.(pdf|docx|txt)),?\s*(?:p\.?|Page\s*)(\d+)(?:,?\s*(?:§\s*|Section\s*)([^\]]+))?\]/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    citations.push({
      match: match[0],
      filename: match[1],
      page: parseInt(match[3], 10),
      section: match[4]?.trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return citations;
}

/**
 * Format citation for AI system prompt instruction.
 *
 * Returns the expected format for citations in AI responses.
 */
export function getCitationFormatInstruction(): string {
  return `When citing document sources, use the format: [filename.pdf, p.X, § Y.Z]
Example: [Contract.pdf, p.12, § 7.2]
If section number is not available, use the section heading: [Contract.pdf, p.5, Termination]
Always include page numbers when available.`;
}
