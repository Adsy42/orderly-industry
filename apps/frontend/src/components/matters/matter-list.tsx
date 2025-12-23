"use client";

import * as React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { MatterCard } from "./matter-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatterWithDocumentCount } from "@/hooks/use-matters";

interface MatterListProps {
  matters: MatterWithDocumentCount[];
  isLoading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (matter: MatterWithDocumentCount) => void;
  onDelete?: (matter: MatterWithDocumentCount) => void;
  onArchive?: (matter: MatterWithDocumentCount) => void;
}

export function MatterList({
  matters,
  isLoading = false,
  onCreateNew,
  onEdit,
  onDelete,
  onArchive,
}: MatterListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[180px] rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (matters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <FolderOpen className="text-muted-foreground/50 mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No matters yet</h3>
        <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
          Create your first matter to start organizing documents and work for
          your legal cases.
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Matter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matters.map((matter) => (
        <MatterCard
          key={matter.id}
          matter={matter}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}

export type { MatterListProps };
