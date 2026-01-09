"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Check,
  Circle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "./severity-badge";
import { IqlDisplay } from "./iql-display";
import type { PlaybookCheck } from "@/types/playbook";

interface CheckItemProps {
  check: PlaybookCheck;
  showIql?: boolean;
  onToggleIql?: () => void;
  onRemove?: () => void;
  /** Analysis status */
  status?: "pending" | "checking" | "complete";
  /** Analysis result (only when status is complete) */
  result?: { detected: boolean; confidence: number };
  /** Whether this is in a compact list mode */
  compact?: boolean;
}

export function CheckItem({
  check,
  showIql = false,
  onToggleIql,
  onRemove,
  status,
  result,
  compact = false,
}: CheckItemProps) {
  const isCustom = check.source === "custom";
  const isAnalyzing = status !== undefined;

  // Determine background based on analysis state
  const getBackgroundClass = () => {
    if (!isAnalyzing) {
      return "bg-white dark:bg-stone-800/50";
    }
    if (status === "checking") {
      return "bg-stone-100 ring-2 ring-stone-300 dark:bg-stone-700 dark:ring-stone-500";
    }
    if (status === "complete" && result?.detected) {
      return "bg-red-50 dark:bg-red-950/20";
    }
    return "bg-stone-50 dark:bg-stone-800/30";
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 transition-all duration-200",
        "dark:border-stone-700",
        getBackgroundClass(),
        compact && "p-3",
        !compact && "p-4",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Status icon for analyzing mode */}
          {isAnalyzing && (
            <div className="mt-0.5">
              {status === "pending" && (
                <Circle className="h-5 w-5 text-stone-300 dark:text-stone-600" />
              )}
              {status === "checking" && (
                <Loader2 className="h-5 w-5 animate-spin text-stone-700 dark:text-stone-300" />
              )}
              {status === "complete" && result?.detected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}
              {status === "complete" && !result?.detected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-800">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-white">
                {check.title}
              </span>
              <SeverityBadge
                severity={check.severity}
                size="sm"
              />
              {isCustom && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
              {isAnalyzing && status === "complete" && result?.detected && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  DETECTED {Math.round(result.confidence * 100)}%
                </span>
              )}
              {isAnalyzing && status === "complete" && !result?.detected && (
                <span className="text-muted-foreground text-xs">No match</span>
              )}
            </div>

            {!compact && (
              <p className="text-muted-foreground mt-1 text-sm">
                {check.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onToggleIql && (
            <button
              onClick={onToggleIql}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                "text-muted-foreground hover:bg-stone-100 hover:text-stone-700",
                "dark:hover:bg-stone-700 dark:hover:text-stone-300",
              )}
              aria-label={showIql ? "Hide IQL" : "Show IQL"}
            >
              {showIql ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                "text-muted-foreground hover:bg-red-50 hover:text-red-600",
                "dark:hover:bg-red-950/30 dark:hover:text-red-400",
              )}
              aria-label="Remove check"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* IQL display (expanded) */}
      {showIql && (
        <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-700">
          <IqlDisplay
            iql={check.iql}
            variant="block"
            showCopy
          />
          {isCustom && check.originalNlQuery && (
            <p className="text-muted-foreground mt-2 text-xs">
              <span className="font-medium">Original query:</span> &quot;
              {check.originalNlQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Always show IQL in analyzing mode (inline) */}
      {isAnalyzing && !showIql && (
        <div className="mt-2">
          <IqlDisplay
            iql={check.iql}
            variant="inline"
          />
        </div>
      )}
    </div>
  );
}
