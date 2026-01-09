/**
 * Types for PDF Viewer components
 */

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

export interface TextPositionIndex {
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  items: TextPositionItem[];
}

export interface TextPositionItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  charOffset: number;
}

export interface PDFViewerProps {
  documentId: string;
  matterId?: string;
  highlightStart?: number;
  highlightEnd?: number;
  highlightText?: string;
  initialPage?: number;
  onClose?: () => void;
}

export interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onDownload: () => void;
  isLoading?: boolean;
}

export interface PDFHighlightLayerProps {
  highlights: HighlightRect[];
  scale: number;
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
}

export type ZoomLevel = "fit-width" | "fit-page" | number;

export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
