"use client";

import * as React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { MatterCard } from "./matter-card";
import { EmptyState } from "@/components/shared/empty-state";
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[200px] rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (matters.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No matters yet"
        description="Create your first matter to start organizing documents and work for your legal cases."
        action={
          onCreateNew
            ? {
                label: "Create Matter",
                onClick: onCreateNew,
                icon: Plus,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
