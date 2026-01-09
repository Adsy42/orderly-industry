"use client";

import * as React from "react";
import {
  FileCheck,
  Search,
  Home,
  TrendingUp,
  Zap,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Playbook } from "@/types/playbook";
import { PLAYBOOK_THEME_COLORS } from "@/types/playbook";

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  FileCheck,
  Search,
  Home,
  TrendingUp,
  Zap,
};

interface PlaybookCardProps {
  playbook: Playbook;
  isSelected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}

export function PlaybookCard({
  playbook,
  isSelected = false,
  onSelect,
  disabled = false,
}: PlaybookCardProps) {
  const IconComponent = ICON_MAP[playbook.icon] || FileCheck;
  const themeColors = PLAYBOOK_THEME_COLORS[playbook.colorTheme];

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative w-full rounded-xl border-2 p-4 text-left transition-all duration-200",
        "focus:ring-2 focus:ring-stone-400/50 focus:ring-offset-2 focus:outline-none",
        themeColors.border,
        isSelected && "ring-2 ring-stone-800 ring-offset-2 dark:ring-stone-300",
        !disabled &&
          "hover:scale-[1.02] hover:border-stone-400 hover:shadow-md dark:hover:border-stone-500",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-white shadow-sm dark:bg-stone-200 dark:text-stone-900">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* Icon and title row */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            themeColors.bg,
            themeColors.icon,
          )}
        >
          <IconComponent className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-white">
            {playbook.name}
          </h3>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {playbook.description}
          </p>
        </div>
      </div>

      {/* Footer with metadata */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            themeColors.bg,
            themeColors.icon,
          )}
        >
          {playbook.checks.length} checks
        </span>

        <span className="text-muted-foreground text-xs">
          {playbook.documentTypes.includes("both")
            ? "All documents"
            : playbook.documentTypes[0] === "contract_of_sale"
              ? "Contract of Sale"
              : "Section 32"}
        </span>
      </div>
    </button>
  );
}

interface PlaybookCardCompactProps {
  playbook: Playbook;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function PlaybookCardCompact({
  playbook,
  isSelected = false,
  onSelect,
}: PlaybookCardCompactProps) {
  const IconComponent = ICON_MAP[playbook.icon] || FileCheck;
  const themeColors = PLAYBOOK_THEME_COLORS[playbook.colorTheme];

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
        "focus:ring-2 focus:ring-stone-400/50 focus:outline-none",
        themeColors.border,
        isSelected && "ring-2 ring-stone-800 dark:ring-stone-300",
        !isSelected && "hover:bg-stone-50 dark:hover:bg-stone-800/50",
      )}
    >
      <div className={cn("rounded p-1", themeColors.bg, themeColors.icon)}>
        <IconComponent className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium">{playbook.name}</span>
      <span className="text-muted-foreground text-xs">
        ({playbook.checks.length})
      </span>
    </button>
  );
}
