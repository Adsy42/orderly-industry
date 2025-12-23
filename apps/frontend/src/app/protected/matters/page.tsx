"use client";

import * as React from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
import {
  useMatters,
  type MatterWithDocumentCount,
  type CreateMatterInput,
  type UpdateMatterInput,
} from "@/hooks/use-matters";
import { MatterList, MatterForm } from "@/components/matters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MattersPage() {
  const {
    matters,
    isLoading,
    error,
    createMatter,
    deleteMatter,
    updateMatter,
  } = useMatters();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [editingMatter, setEditingMatter] =
    React.useState<MatterWithDocumentCount | null>(null);
  const [deletingMatter, setDeletingMatter] =
    React.useState<MatterWithDocumentCount | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape to close dialogs even when in input
        if (e.key === "Escape") {
          if (isCreateDialogOpen) setIsCreateDialogOpen(false);
          if (editingMatter) setEditingMatter(null);
          if (deletingMatter) setDeletingMatter(null);
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N: New Matter
      if (isMod && e.key === "n") {
        e.preventDefault();
        setIsCreateDialogOpen(true);
      }

      // Cmd/Ctrl + K or /: Focus search
      if ((isMod && e.key === "k") || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape: Close dialogs
      if (e.key === "Escape") {
        if (isCreateDialogOpen) setIsCreateDialogOpen(false);
        if (editingMatter) setEditingMatter(null);
        if (deletingMatter) setDeletingMatter(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCreateDialogOpen, editingMatter, deletingMatter]);

  // Filter matters by search query
  const filteredMatters = React.useMemo(() => {
    if (!searchQuery.trim()) return matters;
    const query = searchQuery.toLowerCase();
    return matters.filter(
      (m) =>
        m.title.toLowerCase().includes(query) ||
        m.matter_number.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query),
    );
  }, [matters, searchQuery]);

  const handleCreateMatter = async (
    input: CreateMatterInput | UpdateMatterInput,
  ) => {
    setIsSubmitting(true);
    try {
      // Type guard: CreateMatterInput requires title to be defined
      const createInput = input as CreateMatterInput;
      if (!createInput.title) return;
      const result = await createMatter(createInput);
      if (result) {
        setIsCreateDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMatter = async (
    input: CreateMatterInput | UpdateMatterInput,
  ) => {
    if (!editingMatter) return;
    setIsSubmitting(true);
    try {
      const result = await updateMatter(
        editingMatter.id,
        input as UpdateMatterInput,
      );
      if (result) {
        setEditingMatter(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatter = async () => {
    if (!deletingMatter) return;
    setIsSubmitting(true);
    try {
      const success = await deleteMatter(deletingMatter.id);
      if (success) {
        setDeletingMatter(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveMatter = async (matter: MatterWithDocumentCount) => {
    await updateMatter(matter.id, { status: "archived" });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matters</h1>
          <p className="text-muted-foreground mt-1">
            Organize your legal cases and projects
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Matter
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            placeholder="Search matters... (/ or ⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive mb-6 rounded-lg border p-4">
          {error.message}
        </div>
      )}

      {/* Matter List */}
      <MatterList
        matters={filteredMatters}
        isLoading={isLoading}
        onCreateNew={() => setIsCreateDialogOpen(true)}
        onEdit={(matter) => setEditingMatter(matter)}
        onDelete={(matter) => setDeletingMatter(matter)}
        onArchive={handleArchiveMatter}
      />

      {/* Create Dialog */}
      {isCreateDialogOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-lg rounded-lg border p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold">Create New Matter</h2>
            <MatterForm
              onSubmit={handleCreateMatter}
              onCancel={() => setIsCreateDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingMatter && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-lg rounded-lg border p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold">Edit Matter</h2>
            <MatterForm
              matter={editingMatter}
              onSubmit={handleEditMatter}
              onCancel={() => setEditingMatter(null)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingMatter && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-md rounded-lg border p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Delete Matter</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingMatter.title}</strong>? This will permanently
              remove all documents and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingMatter(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMatter}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
