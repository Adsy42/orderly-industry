/**
 * PDF Annotator Utility
 *
 * Uses pdf-lib to add highlight annotations to PDFs based on detected flags.
 */

import { PDFDocument, rgb } from "pdf-lib";
import type { DetectedFlag, Severity } from "@/types/contract-analysis";

interface HighlightAnnotation {
  pageIndex: number;
  rect: { x: number; y: number; width: number; height: number };
  color: { r: number; g: number; b: number };
  flagId: string;
}

/**
 * Get highlight color based on severity
 */
function getSeverityColor(severity: Severity): {
  r: number;
  g: number;
  b: number;
} {
  switch (severity) {
    case "CRITICAL":
      return { r: 1, g: 0.2, b: 0.2 }; // Red
    case "HIGH":
      return { r: 1, g: 0.4, b: 0.4 }; // Light red
    case "MEDIUM":
      return { r: 1, g: 0.75, b: 0.2 }; // Amber
    case "LOW":
      return { r: 1, g: 0.9, b: 0.2 }; // Yellow
    default:
      return { r: 1, g: 0.9, b: 0.2 }; // Default to yellow
  }
}

/**
 * Extract text positions from PDF using pdf.js
 * Returns a mapping of character offsets to page positions
 */
async function extractTextPositions(pdfBytes: ArrayBuffer): Promise<{
  positions: Array<{
    pageIndex: number;
    items: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      charStart: number;
      charEnd: number;
    }>;
  }>;
  totalChars: number;
}> {
  // Load pdf.js from CDN if not already loaded
  if (!(window as any).pdfjsLib) {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF.js"));
      document.head.appendChild(script);
    });
    await new Promise((r) => setTimeout(r, 100));
    (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  const pdfjsLib = (window as any).pdfjsLib;
  const doc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;

  const positions: Array<{
    pageIndex: number;
    items: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      charStart: number;
      charEnd: number;
    }>;
  }> = [];

  let cumulativeOffset = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageItems: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      charStart: number;
      charEnd: number;
    }> = [];

    for (const item of textContent.items) {
      if (!item.str) continue;

      const text = item.str;
      const x = item.transform[4];
      // PDF coordinates are bottom-up, pdf-lib uses same coordinate system
      const y = item.transform[5];
      const width = item.width || 0;
      const height = item.height || Math.abs(item.transform[0]) || 12;

      pageItems.push({
        text,
        x,
        y,
        width,
        height,
        charStart: cumulativeOffset,
        charEnd: cumulativeOffset + text.length,
      });

      cumulativeOffset += text.length;
      if (item.hasEOL) cumulativeOffset += 1;
    }

    positions.push({
      pageIndex: pageNum - 1, // 0-indexed for pdf-lib
      items: pageItems,
    });
  }

  return { positions, totalChars: cumulativeOffset };
}

/**
 * Search for text in the PDF and return matching positions
 */
function findTextMatches(
  positions: Array<{
    pageIndex: number;
    items: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      charStart: number;
      charEnd: number;
    }>;
  }>,
  searchTerms: string[],
): Array<{ pageIndex: number; item: (typeof positions)[0]["items"][0] }> {
  const results: Array<{
    pageIndex: number;
    item: (typeof positions)[0]["items"][0];
  }> = [];
  const seenPositions = new Set<string>();

  for (const searchTerm of searchTerms) {
    const keywords = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 3);

    if (keywords.length === 0) continue;

    for (const pageData of positions) {
      for (const item of pageData.items) {
        const itemLower = item.text.toLowerCase();
        const posKey = `${pageData.pageIndex}-${item.x}-${item.y}`;

        // Skip if already highlighted
        if (seenPositions.has(posKey)) continue;

        // Check if this item contains any keyword
        for (const keyword of keywords) {
          if (itemLower.includes(keyword)) {
            results.push({ pageIndex: pageData.pageIndex, item });
            seenPositions.add(posKey);
            break;
          }
        }
      }
    }
  }

  return results;
}

/**
 * Create an annotated PDF with highlights for detected flags
 */
export async function createAnnotatedPdf(
  pdfBytes: ArrayBuffer,
  flags: DetectedFlag[],
): Promise<Uint8Array> {
  // Make a copy of the ArrayBuffer since pdf.js may detach it
  const pdfBytesCopy = pdfBytes.slice(0);

  // Extract text positions using pdf.js (uses original buffer)
  const { positions } = await extractTextPositions(pdfBytes);

  // Load the PDF with pdf-lib (uses copy since original may be detached)
  const pdfDoc = await PDFDocument.load(pdfBytesCopy);
  const pages = pdfDoc.getPages();

  // Build highlight annotations
  const annotations: HighlightAnnotation[] = [];

  for (const flag of flags) {
    const color = getSeverityColor(flag.severity);

    // Check if positions look valid (not 0-100 demo data)
    const hasValidPositions = flag.start_char > 0 || flag.end_char > 200;

    if (hasValidPositions) {
      // Use character positions
      for (const pageData of positions) {
        for (const item of pageData.items) {
          if (
            item.charEnd <= flag.start_char ||
            item.charStart >= flag.end_char
          ) {
            continue;
          }
          annotations.push({
            pageIndex: pageData.pageIndex,
            rect: {
              x: item.x,
              y: item.y,
              width: Math.max(item.width, 20),
              height: item.height,
            },
            color,
            flagId: flag.id,
          });
        }
      }
    } else {
      // Fallback: search for text matches using flag metadata
      const searchTerms = [flag.name, flag.category, flag.description].filter(
        Boolean,
      );

      const matches = findTextMatches(positions, searchTerms);

      // Limit highlights per flag to avoid overwhelming the document
      const limitedMatches = matches.slice(0, 10);

      for (const match of limitedMatches) {
        annotations.push({
          pageIndex: match.pageIndex,
          rect: {
            x: match.item.x,
            y: match.item.y,
            width: Math.max(match.item.width, 20),
            height: match.item.height,
          },
          color,
          flagId: flag.id,
        });
      }
    }
  }

  // Apply highlights to the PDF
  // pdf-lib doesn't have built-in annotation support, so we draw rectangles
  for (const annotation of annotations) {
    const page = pages[annotation.pageIndex];
    if (!page) continue;

    // Draw a semi-transparent rectangle as highlight
    page.drawRectangle({
      x: annotation.rect.x,
      y: annotation.rect.y - 2, // Slight offset to cover text better
      width: annotation.rect.width,
      height: annotation.rect.height + 4,
      color: rgb(annotation.color.r, annotation.color.g, annotation.color.b),
      opacity: 0.35,
    });
  }

  // Save and return the annotated PDF
  return await pdfDoc.save();
}

/**
 * Open an annotated PDF in a new browser tab
 */
export async function openAnnotatedPdfInNewTab(
  file: File,
  flags: DetectedFlag[],
): Promise<void> {
  const pdfBytes = await file.arrayBuffer();
  const annotatedPdfBytes = await createAnnotatedPdf(pdfBytes, flags);

  // Create blob and open in new tab
  const blob = new Blob([annotatedPdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  // Open in new tab
  const newTab = window.open(url, "_blank");

  // Clean up URL after tab is opened (with delay to ensure tab loads)
  if (newTab) {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
