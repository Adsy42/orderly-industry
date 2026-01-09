"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MatterWithDocumentCount } from "@/hooks/use-matters";

interface MatterCardProps {
  matter: MatterWithDocumentCount;
  onEdit?: (matter: MatterWithDocumentCount) => void;
  onDelete?: (matter: MatterWithDocumentCount) => void;
  onArchive?: (matter: MatterWithDocumentCount) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-zinc-100 text-zinc-500 dark:bg-slate-700 dark:text-slate-400",
  archived:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function MatterCard({
  matter,
  onEdit,
  onDelete,
  onArchive,
  className,
}: MatterCardProps) {
  const [showActions, setShowActions] = React.useState(false);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  const documentCount = matter.documents?.[0]?.count ?? 0;
  const updatedAgo = formatDistanceToNow(new Date(matter.updated_at), {
    addSuffix: true,
  });

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-stone-200 bg-white",
        "transition-all duration-300",
        "hover:border-stone-400 hover:shadow-xl hover:shadow-stone-200/50",
        "dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-500 dark:hover:shadow-stone-900/50",
        className,
      )}
    >
      <Link
        href={`/protected/matters/${matter.id}`}
        className="block p-6"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              {matter.matter_number}
            </p>
            <h3
              className={cn(
                "text-xl font-semibold tracking-tight text-zinc-900",
                "transition-colors duration-200 group-hover:text-stone-700",
                "dark:text-white dark:group-hover:text-stone-300",
              )}
            >
              {matter.title}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize",
                statusColors[matter.status],
              )}
            >
              {matter.status}
            </span>
          </div>
        </div>

        {/* Description */}
        {matter.description && (
          <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-slate-400">
            {matter.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-6 border-t border-zinc-100 pt-4 dark:border-slate-700/50">
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            {documentCount} {documentCount === 1 ? "doc" : "docs"}
          </span>
          <span className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {updatedAgo}
          </span>
        </div>
      </Link>

      {/* Actions Menu */}
      <div
        ref={actionsRef}
        className="absolute top-4 right-4"
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-lg",
            "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowActions(!showActions);
          }}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>

        {showActions && (
          <div
            className={cn(
              "absolute top-full right-0 z-50 mt-2 w-48",
              "rounded-xl border border-zinc-200 bg-white p-2 shadow-xl",
              "dark:border-slate-700 dark:bg-slate-800",
            )}
          >
            {onEdit && (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2",
                  "text-sm font-medium transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-slate-700",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowActions(false);
                  onEdit(matter);
                }}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
            {onArchive && matter.status !== "archived" && (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2",
                  "text-sm font-medium transition-colors",
                  "hover:bg-zinc-100 dark:hover:bg-slate-700",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowActions(false);
                  onArchive(matter);
                }}
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>
            )}
            {onDelete && (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2",
                  "text-destructive text-sm font-medium transition-colors",
                  "hover:bg-destructive/10",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowActions(false);
                  onDelete(matter);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { MatterCardProps };
