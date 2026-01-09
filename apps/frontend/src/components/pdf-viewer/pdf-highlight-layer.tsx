"use client";

import * as React from "react";
import type { HighlightRect } from "./types";

interface PDFHighlightLayerProps {
  highlights: HighlightRect[];
  scale: number;
  containerWidth: number;
  containerHeight: number;
}

/**
 * Renders transparent highlight overlays on top of PDF pages.
 * Positions are in PDF coordinate space (bottom-left origin).
 */
export function PDFHighlightLayer({
  highlights,
  scale,
  containerWidth,
  containerHeight,
}: PDFHighlightLayerProps) {
  if (highlights.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className="absolute rounded-sm bg-yellow-300/40 ring-2 ring-yellow-400/60"
          style={{
            left: highlight.x * scale,
            top: highlight.y * scale,
            width: highlight.width * scale,
            height: highlight.height * scale,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Creates a pulsing highlight effect for drawing attention.
 */
export function PDFHighlightPulse({
  x,
  y,
  width,
  height,
  scale,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}) {
  return (
    <div
      className="pointer-events-none absolute animate-pulse rounded-sm bg-yellow-300/50 ring-2 ring-yellow-500"
      style={{
        left: x * scale,
        top: y * scale,
        width: width * scale,
        height: height * scale,
      }}
    />
  );
}
