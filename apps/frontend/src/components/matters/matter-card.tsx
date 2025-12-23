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
import { Card } from "@/components/ui/card";
import type { MatterWithDocumentCount } from "@/hooks/use-matters";

interface MatterCardProps {
  matter: MatterWithDocumentCount;
  onEdit?: (matter: MatterWithDocumentCount) => void;
  onDelete?: (matter: MatterWithDocumentCount) => void;
  onArchive?: (matter: MatterWithDocumentCount) => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  archived: "bg-amber-500/10 text-amber-500 border-amber-500/20",
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
    <Card
      className={cn(
        "group hover:border-primary/50 relative overflow-hidden transition-all hover:shadow-md",
        className,
      )}
    >
      <Link
        href={`/protected/matters/${matter.id}`}
        className="block p-5"
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground mb-1 text-xs font-medium">
              {matter.matter_number}
            </p>
            <h3 className="text-foreground group-hover:text-primary truncate text-lg font-semibold">
              {matter.title}
            </h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
              statusColors[matter.status],
            )}
          >
            {matter.status}
          </span>
        </div>

        {/* Description */}
        {matter.description && (
          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
            {matter.description}
          </p>
        )}

        {/* Footer */}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {documentCount} {documentCount === 1 ? "document" : "documents"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {updatedAgo}
          </span>
        </div>
      </Link>

      {/* Actions Menu */}
      <div
        ref={actionsRef}
        className="absolute top-3 right-3"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
          <div className="bg-popover absolute top-full right-0 z-10 mt-1 min-w-[140px] rounded-md border p-1 shadow-md">
            {onEdit && (
              <button
                className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
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
                className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
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
                className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
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
    </Card>
  );
}

export type { MatterCardProps };
