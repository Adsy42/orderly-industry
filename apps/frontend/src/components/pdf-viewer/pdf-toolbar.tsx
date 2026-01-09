"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ZOOM_PRESETS } from "./types";

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  onDownload?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function PDFToolbar({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onDownload,
  isLoading,
  className,
}: PDFToolbarProps) {
  const [pageInput, setPageInput] = React.useState(String(currentPage));

  // Sync page input with current page
  React.useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
  };

  const handleZoomIn = () => {
    const currentIndex = ZOOM_PRESETS.findIndex((z) => z >= scale);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_PRESETS.length - 1);
    onScaleChange(ZOOM_PRESETS[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_PRESETS.findIndex((z) => z >= scale);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onScaleChange(ZOOM_PRESETS[prevIndex]);
  };

  const zoomPercentage = Math.round(scale * 100);

  return (
    <div
      className={cn(
        "bg-background flex items-center justify-between gap-4 border-b px-4 py-2",
        className,
      )}
    >
      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 text-sm">
          <Input
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="h-8 w-12 text-center"
            disabled={isLoading}
          />
          <span className="text-muted-foreground">/ {totalPages}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          disabled={scale <= ZOOM_PRESETS[0] || isLoading}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex min-w-[60px] items-center justify-center gap-1 text-sm">
          <ZoomIn className="text-muted-foreground h-4 w-4" />
          <span>{zoomPercentage}%</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          disabled={scale >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1] || isLoading}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Download button */}
      {onDownload && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDownload}
          disabled={isLoading}
          aria-label="Download document"
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
