"use client";

import { cn } from "@/lib/utils";
import type { Severity } from "@/types/contract-analysis";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const severityStyles: Record<Severity, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MEDIUM:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  LOW: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function SeverityBadge({
  severity,
  className,
  size = "md",
}: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide uppercase",
        severityStyles[severity],
        sizeStyles[size],
        className,
      )}
    >
      {severity}
    </span>
  );
}

// Severity icon colors for use in other components
export const severityColors: Record<
  Severity,
  { bg: string; text: string; border: string }
> = {
  CRITICAL: {
    bg: "bg-red-50 dark:bg-red-950/50",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  HIGH: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  MEDIUM: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  LOW: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
};
