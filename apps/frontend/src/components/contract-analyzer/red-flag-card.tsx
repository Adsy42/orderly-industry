"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, ExternalLink, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityBadge, severityColors } from "./severity-badge";
import type { DetectedFlag } from "@/types/contract-analysis";

interface RedFlagCardProps {
  flag: DetectedFlag;
  onViewInDocument?: () => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function RedFlagCard({
  flag,
  onViewInDocument,
  isExpanded = false,
  onToggle,
}: RedFlagCardProps) {
  const colors = severityColors[flag.severity];
  const confidencePercent = Math.round(flag.confidence * 100);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border-2 transition-all duration-200",
        colors.border,
        colors.bg,
        flag.severity === "CRITICAL" && "shadow-lg shadow-red-500/10",
      )}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <SeverityBadge
            severity={flag.severity}
            size="sm"
          />
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-white">
              {flag.name}
            </h4>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Tag className="h-3 w-3" />
                {flag.category}
              </span>
              <span className="text-muted-foreground text-xs">
                {confidencePercent}% confidence
              </span>
            </div>
          </div>
        </div>
        {onToggle &&
          (isExpanded ? (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronRight className="text-muted-foreground h-5 w-5" />
          ))}
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-zinc-200/50 px-4 pt-3 pb-4 dark:border-slate-700/50">
          {/* Confidence bar */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Detection Confidence
              </span>
              <span className={cn("font-semibold", colors.text)}>
                {confidencePercent}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200/50 dark:bg-slate-700/50">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  flag.severity === "CRITICAL" && "bg-red-600",
                  flag.severity === "HIGH" && "bg-red-500",
                  flag.severity === "MEDIUM" && "bg-amber-500",
                  flag.severity === "LOW" && "bg-yellow-500",
                )}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <h5 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Issue
            </h5>
            <p className="text-sm text-zinc-700 dark:text-slate-300">
              {flag.description}
            </p>
          </div>

          {/* Matched text */}
          <div className="mb-4">
            <h5 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Found Text
            </h5>
            <p className="rounded-lg bg-white/50 p-2 font-mono text-xs text-zinc-600 dark:bg-slate-800/50 dark:text-slate-400">
              &quot;{flag.matched_text}&quot;
            </p>
          </div>

          {/* Action */}
          <div className="mb-4">
            <h5 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Recommended Action
            </h5>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              {flag.action}
            </p>
          </div>

          {/* Financial impact */}
          {flag.financial_impact && (
            <div className="mb-4 rounded-lg bg-zinc-100/50 p-3 dark:bg-slate-800/30">
              <h5 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                Financial Impact
              </h5>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                {flag.financial_impact}
              </p>
            </div>
          )}

          {/* View in document button */}
          {onViewInDocument && (
            <button
              onClick={onViewInDocument}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors",
                "bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800",
                colors.text,
              )}
            >
              <ExternalLink className="h-4 w-4" />
              View in Document
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for summary lists
interface RedFlagCardCompactProps {
  flag: DetectedFlag;
  onClick?: () => void;
}

export function RedFlagCardCompact({ flag, onClick }: RedFlagCardCompactProps) {
  const colors = severityColors[flag.severity];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-200",
        "hover:shadow-md",
        colors.border,
        "bg-white dark:bg-slate-800/50",
      )}
    >
      <div className="flex items-center gap-3">
        <SeverityBadge
          severity={flag.severity}
          size="sm"
        />
        <span className="text-sm font-medium text-zinc-900 dark:text-white">
          {flag.name}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">
        {Math.round(flag.confidence * 100)}%
      </span>
    </button>
  );
}
