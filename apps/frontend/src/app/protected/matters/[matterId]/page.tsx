"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  FileText,
  Clock,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Users,
  Calendar,
} from "lucide-react";
import {
  useMatters,
  type MatterWithDocumentCount,
  type UpdateMatterInput,
} from "@/hooks/use-matters";
import { useDocuments, type Document } from "@/hooks/use-documents";
import { MatterForm, ParticipantsManager } from "@/components/matters";
import { useParticipants } from "@/hooks/use-participants";
import {
  DocumentList,
  DocumentUpload,
  DocumentSearch,
} from "@/components/documents";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  closed: "bg-zinc-100 text-zinc-500 dark:bg-slate-700 dark:text-slate-400",
  archived:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function MatterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matterId = params.matterId as string;
  const { getMatter, updateMatter, deleteMatter } = useMatters();

  const [matter, setMatter] = React.useState<MatterWithDocumentCount | null>(
    null,
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [isParticipantsDialogOpen, setIsParticipantsDialogOpen] =
    React.useState(false);
  const [deletingDocument, setDeletingDocument] =
    React.useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { participants } = useParticipants({ matterId });

  const {
    documents,
    isLoading: isLoadingDocuments,
    deleteDocument,
    getSignedUrl,
    refetch: refetchDocuments,
  } = useDocuments({ matterId });

  const handleDownloadDocument = async (doc: Document) => {
    const url = await getSignedUrl(doc.storage_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return;
    setIsSubmitting(true);
    try {
      await deleteDocument(deletingDocument.id);
      setDeletingDocument(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    async function fetchMatter() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMatter(matterId);
        if (!data) {
          setError("Matter not found");
        } else {
          setMatter(data);
        }
      } catch {
        setError("Failed to load matter");
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatter();
  }, [matterId, getMatter]);

  const handleEdit = async (input: UpdateMatterInput) => {
    if (!matter) return;
    setIsSubmitting(true);
    try {
      const updated = await updateMatter(matter.id, input);
      if (updated) {
        setMatter({ ...matter, ...updated, documents: matter.documents });
        setIsEditDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!matter) return;
    setIsSubmitting(true);
    try {
      const success = await deleteMatter(matter.id);
      if (success) {
        router.push("/protected/matters");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 rounded-2xl"
            />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div>
        <PageHeader
          title="Matter not found"
          breadcrumbs={[{ label: "Matters", href: "/protected/matters" }]}
        />
        <EmptyState
          icon={FileText}
          title="Matter not found"
          description={
            error || "This matter does not exist or you don't have access."
          }
          action={{
            label: "Back to Matters",
            onClick: () => router.push("/protected/matters"),
          }}
        />
      </div>
    );
  }

  const documentCount = matter.documents?.[0]?.count ?? 0;

  return (
    <div>
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        title={matter.title}
        breadcrumbs={[
          { label: "Matters", href: "/protected/matters" },
          { label: matter.matter_number },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="rounded-xl"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="rounded-xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Status and Meta */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium capitalize",
            statusColors[matter.status],
          )}
        >
          {matter.status}
        </span>
        <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Clock className="h-3.5 w-3.5" />
          Updated{" "}
          {formatDistanceToNow(new Date(matter.updated_at), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* Description */}
      {matter.description && (
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
            Description
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-slate-400">
            {matter.description}
          </p>
        </div>
      )}

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Documents Stat */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-200 hover:shadow-md dark:border-stone-700 dark:bg-stone-800/50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
            <FileText className="h-6 w-6" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {documentCount}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Documents</p>
        </div>

        {/* Participants Stat */}
        <button
          onClick={() => setIsParticipantsDialogOpen(true)}
          className={cn(
            "rounded-2xl border border-stone-200 bg-white p-5 text-left",
            "transition-all duration-200",
            "hover:border-stone-400 hover:shadow-md",
            "dark:border-stone-700 dark:bg-stone-800/50 dark:hover:border-stone-500",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {participants.length + 1}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Participants</p>
        </button>

        {/* Created Date Stat */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-200 hover:shadow-md dark:border-stone-700 dark:bg-stone-800/50">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300">
            <Calendar className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            {format(new Date(matter.created_at), "MMM d, yyyy")}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">Created</p>
        </div>

        {/* Upload Action Card */}
        <button
          onClick={() => setIsUploadDialogOpen(true)}
          className={cn(
            "rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-5 text-left",
            "transition-all duration-200",
            "hover:border-stone-400 hover:bg-stone-100",
            "dark:border-stone-700 dark:bg-stone-800/30 dark:hover:border-stone-500 dark:hover:bg-stone-700/50",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-slate-700 dark:text-slate-500">
            <Upload className="h-6 w-6" />
          </div>
          <p className="font-semibold text-zinc-900 dark:text-white">
            Upload Files
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Add documents to this matter
          </p>
        </button>
      </div>

      {/* Document Search */}
      {documents.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Search Documents
          </h2>
          <DocumentSearch
            matterId={matterId}
            onResultClick={(result) => {
              const doc = documents.find((d) => d.id === result.document_id);
              if (doc) {
                handleDownloadDocument(doc);
              }
            }}
          />
        </div>
      )}

      {/* Documents Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Documents
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({documents.length})
            </span>
          </h2>
          <Button
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
            className="rounded-xl"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
        <div className="p-6">
          <DocumentList
            documents={documents}
            isLoading={isLoadingDocuments}
            onUpload={() => setIsUploadDialogOpen(true)}
            onDownload={handleDownloadDocument}
            onDelete={(doc) => setDeletingDocument(doc)}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Matter</DialogTitle>
            <DialogDescription>
              Update the details for this matter.
            </DialogDescription>
          </DialogHeader>
          <MatterForm
            matter={matter}
            onSubmit={handleEdit}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Matter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{matter.title}</strong>? This
              will permanently remove all documents and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

      {/* Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Documents</DialogTitle>
            <DialogDescription>
              Add documents to this matter. Supported formats: PDF, DOCX, TXT.
            </DialogDescription>
          </DialogHeader>
          <DocumentUpload
            matterId={matterId}
            onUploadComplete={() => {
              refetchDocuments();
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              className="rounded-xl"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Dialog */}
      <Dialog
        open={isParticipantsDialogOpen}
        onOpenChange={setIsParticipantsDialogOpen}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <ParticipantsManager
            matterId={matterId}
            isOwner={true}
            onClose={() => setIsParticipantsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation */}
      <Dialog
        open={!!deletingDocument}
        onOpenChange={(open) => !open && setDeletingDocument(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deletingDocument?.filename}
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingDocument(null)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDocument}
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
