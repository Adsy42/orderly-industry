/**
 * Text Position Mapper
 *
 * Maps character offsets in extracted text to PDF page coordinates.
 * Uses pdf.js text content API to build a mapping between character
 * positions and visual positions on the page.
 */

import type {
  PDFDocumentProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";

export interface TextPosition {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSpan {
  pageNumber: number;
  positions: TextPosition[];
}

interface PageTextIndex {
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  text: string;
  items: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    charStart: number;
    charEnd: number;
  }>;
}

/**
 * Builds a character offset index for a PDF document.
 * This maps character positions to page numbers and coordinates.
 */
export async function buildTextPositionIndex(
  pdfDocument: PDFDocumentProxy,
): Promise<PageTextIndex[]> {
  const index: PageTextIndex[] = [];
  let cumulativeOffset = 0;

  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const pageStartOffset = cumulativeOffset;
    let pageText = "";
    const items: PageTextIndex["items"] = [];

    for (const item of textContent.items) {
      // Type guard for TextItem (has str property)
      if (!("str" in item)) continue;
      const textItem = item as TextItem;

      const text = textItem.str;
      if (!text) continue;

      // Transform coordinates from PDF space to viewport space
      const [x, y] = [textItem.transform[4], textItem.transform[5]];
      const width = textItem.width || 0;
      const height = textItem.height || Math.abs(textItem.transform[0]) || 12;

      // Convert from bottom-left origin to top-left origin
      const topY = viewport.height - y - height;

      items.push({
        text,
        x,
        y: topY,
        width,
        height,
        charStart: cumulativeOffset,
        charEnd: cumulativeOffset + text.length,
      });

      pageText += text;
      cumulativeOffset += text.length;

      // Add space between items if needed (pdf.js doesn't include inter-item spaces)
      if (textItem.hasEOL) {
        pageText += "\n";
        cumulativeOffset += 1;
      }
    }

    index.push({
      pageNumber: pageNum,
      startOffset: pageStartOffset,
      endOffset: cumulativeOffset,
      text: pageText,
      items,
    });
  }

  return index;
}

/**
 * Finds the page number for a given character offset.
 */
export function getPageForOffset(
  index: PageTextIndex[],
  offset: number,
): number | null {
  for (const page of index) {
    if (offset >= page.startOffset && offset < page.endOffset) {
      return page.pageNumber;
    }
  }
  // If offset is at or past the end, return last page
  if (index.length > 0 && offset >= index[index.length - 1].endOffset) {
    return index[index.length - 1].pageNumber;
  }
  return null;
}

/**
 * Finds the visual positions for a character range.
 * Returns bounding boxes for all text items that fall within the range.
 */
export function getPositionsForRange(
  index: PageTextIndex[],
  startOffset: number,
  endOffset: number,
): TextSpan | null {
  const positions: TextPosition[] = [];
  let foundPage: number | null = null;

  for (const page of index) {
    // Skip pages that don't overlap with our range
    if (endOffset <= page.startOffset || startOffset >= page.endOffset) {
      continue;
    }

    foundPage = page.pageNumber;

    for (const item of page.items) {
      // Check if this item overlaps with our range
      if (item.charEnd <= startOffset || item.charStart >= endOffset) {
        continue;
      }

      positions.push({
        pageNumber: page.pageNumber,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      });
    }
  }

  if (positions.length === 0 || foundPage === null) {
    return null;
  }

  return {
    pageNumber: foundPage,
    positions,
  };
}

/**
 * Merges adjacent/overlapping positions into larger bounding boxes.
 * This creates cleaner highlight rectangles.
 */
export function mergePositions(positions: TextPosition[]): TextPosition[] {
  if (positions.length === 0) return [];

  // Group by page
  const byPage = new Map<number, TextPosition[]>();
  for (const pos of positions) {
    const existing = byPage.get(pos.pageNumber) || [];
    existing.push(pos);
    byPage.set(pos.pageNumber, existing);
  }

  const merged: TextPosition[] = [];

  for (const [_pageNumber, pagePositions] of byPage) {
    // Sort by y position (top to bottom), then x position (left to right)
    pagePositions.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 5) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

    // Merge positions on the same line
    let currentLine: TextPosition | null = null;
    const lineThreshold = 5; // pixels

    for (const pos of pagePositions) {
      if (!currentLine) {
        currentLine = { ...pos };
        continue;
      }

      // Check if on same line (similar y position)
      if (Math.abs(pos.y - currentLine.y) < lineThreshold) {
        // Extend the current line
        const newRight = Math.max(
          currentLine.x + currentLine.width,
          pos.x + pos.width,
        );
        currentLine.width = newRight - currentLine.x;
        currentLine.height = Math.max(currentLine.height, pos.height);
      } else {
        // New line - save current and start new
        merged.push(currentLine);
        currentLine = { ...pos };
      }
    }

    if (currentLine) {
      merged.push(currentLine);
    }
  }

  return merged;
}

/**
 * Finds text positions using fuzzy text matching.
 * Useful when exact character offsets don't match due to extraction differences.
 */
export function findTextByContent(
  index: PageTextIndex[],
  searchText: string,
  maxResults: number = 1,
): TextSpan[] {
  const results: TextSpan[] = [];
  const normalizedSearch = normalizeText(searchText);

  for (const page of index) {
    const normalizedPage = normalizeText(page.text);
    let searchStart = 0;

    while (searchStart < normalizedPage.length && results.length < maxResults) {
      const foundIndex = normalizedPage.indexOf(normalizedSearch, searchStart);
      if (foundIndex === -1) break;

      // Map back to original positions
      const matchStart = page.startOffset + foundIndex;
      const matchEnd = matchStart + normalizedSearch.length;

      const span = getPositionsForRange(index, matchStart, matchEnd);
      if (span) {
        results.push(span);
      }

      searchStart = foundIndex + 1;
    }
  }

  return results;
}

/**
 * Normalizes text for fuzzy matching.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Creates a bounding box that encompasses all positions.
 */
export function getBoundingBox(positions: TextPosition[]): TextPosition | null {
  if (positions.length === 0) return null;

  const pageNumber = positions[0].pageNumber;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pos of positions) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }

  return {
    pageNumber,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
