"use client";

import * as React from "react";
import { Plus, Search, X, Loader2, Briefcase } from "lucide-react";
import {
  useMatters,
  type MatterWithDocumentCount,
  type CreateMatterInput,
  type UpdateMatterInput,
} from "@/hooks/use-matters";
import { MatterList } from "@/components/matters/matter-list";
import { MatterForm } from "@/components/matters/matter-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "active" | "archived";

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
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("active");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        if (e.key === "Escape") {
          if (isCreateDialogOpen) setIsCreateDialogOpen(false);
          if (editingMatter) setEditingMatter(null);
          if (deletingMatter) setDeletingMatter(null);
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === "n") {
        e.preventDefault();
        setIsCreateDialogOpen(true);
      }

      if ((isMod && e.key === "k") || e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === "Escape") {
        if (isCreateDialogOpen) setIsCreateDialogOpen(false);
        if (editingMatter) setEditingMatter(null);
        if (deletingMatter) setDeletingMatter(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCreateDialogOpen, editingMatter, deletingMatter]);

  // Filter matters by search query and status
  const filteredMatters = React.useMemo(() => {
    let filtered = matters;

    // Filter by status
    if (activeFilter === "active") {
      filtered = filtered.filter((m) => m.status === "active");
    } else if (activeFilter === "archived") {
      filtered = filtered.filter(
        (m) => m.status === "archived" || m.status === "closed",
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.matter_number.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [matters, searchQuery, activeFilter]);

  const handleCreateMatter = async (
    input: CreateMatterInput | UpdateMatterInput,
  ) => {
    setIsSubmitting(true);
    try {
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

  const filterTabs: { value: FilterTab; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "all", label: "All" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Matters"
        subtitle="Manage your legal matters and documents"
        icon={Briefcase}
        actions={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="shadow-primary/25 hover:shadow-primary/30 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Matter
          </Button>
        }
      />

      {/* Search & Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
          <Input
            ref={searchInputRef}
            placeholder="Search matters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border-zinc-200 bg-white pr-20 pl-10 dark:border-slate-700 dark:bg-slate-800"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute top-1/2 right-3 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-400 sm:flex dark:border-slate-600 dark:bg-slate-700">
              <kbd>/</kbd>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                activeFilter === tab.value
                  ? "text-foreground bg-white shadow-sm dark:bg-slate-700"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive mb-6 rounded-2xl border p-4">
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
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Create New Matter</DialogTitle>
            <DialogDescription>
              Add a new matter to organize your documents and legal work.
            </DialogDescription>
          </DialogHeader>
          <MatterForm
            onSubmit={handleCreateMatter}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingMatter}
        onOpenChange={(open) => !open && setEditingMatter(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Matter</DialogTitle>
            <DialogDescription>
              Update the details for this matter.
            </DialogDescription>
          </DialogHeader>
          {editingMatter && (
            <MatterForm
              matter={editingMatter}
              onSubmit={handleEditMatter}
              onCancel={() => setEditingMatter(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingMatter}
        onOpenChange={(open) => !open && setDeletingMatter(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Matter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deletingMatter?.title}
              </strong>
              ? This will permanently remove all documents and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingMatter(null)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMatter}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
