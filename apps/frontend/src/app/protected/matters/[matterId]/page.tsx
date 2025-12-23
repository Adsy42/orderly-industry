"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Clock,
  Pencil,
  Trash2,
  Upload,
  Loader2,
  Users,
  X,
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  archived: "bg-amber-500/10 text-amber-500 border-amber-500/20",
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

  // Participants management
  const { participants } = useParticipants({ matterId });

  // Document management
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

  // Fetch matter on mount
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
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/protected/matters"
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matters
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <h2 className="mb-2 text-xl font-semibold">Matter not found</h2>
          <p className="text-muted-foreground">
            {error || "This matter does not exist or you don't have access."}
          </p>
        </div>
      </div>
    );
  }

  const documentCount = matter.documents?.[0]?.count ?? 0;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Back Link */}
      <Link
        href="/protected/matters"
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matters
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground mb-1 text-sm font-medium">
            {matter.matter_number}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{matter.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
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
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Description */}
      {matter.description && (
        <div className="bg-card mb-8 rounded-lg border p-4">
          <h2 className="text-muted-foreground mb-2 text-sm font-semibold">
            Description
          </h2>
          <p className="text-sm">{matter.description}</p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <FileText className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documentCount}</p>
              <p className="text-muted-foreground text-sm">Documents</p>
            </div>
          </div>
        </div>
        <div
          className="bg-card hover:border-primary/50 cursor-pointer rounded-lg border p-4 transition-colors"
          onClick={() => setIsParticipantsDialogOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Users className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{participants.length + 1}</p>
              <p className="text-muted-foreground text-sm">Participants</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Clock className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {format(new Date(matter.created_at), "MMM d, yyyy")}
              </p>
              <p className="text-muted-foreground text-sm">Created</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Search */}
      {documents.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Search Documents</h2>
          <DocumentSearch
            matterId={matterId}
            onResultClick={(result) => {
              // Could navigate to document or highlight
              const doc = documents.find((d) => d.id === result.document_id);
              if (doc) {
                handleDownloadDocument(doc);
              }
            }}
          />
        </div>
      )}

      {/* Documents Section */}
      <div className="rounded-lg border">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">
            Documents
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({documents.length})
            </span>
          </h2>
          <Button
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
        <div className="p-4">
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
      {isEditDialogOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-lg rounded-lg border p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-semibold">Edit Matter</h2>
            <MatterForm
              matter={matter}
              onSubmit={handleEdit}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-md rounded-lg border p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Delete Matter</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{matter.title}</strong>?
              This will permanently remove all documents and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
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

      {/* Upload Dialog */}
      {isUploadDialogOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-lg rounded-lg border p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload Documents</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DocumentUpload
              matterId={matterId}
              onUploadComplete={() => {
                // Refetch documents to show the new upload
                refetchDocuments();
              }}
            />
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Dialog */}
      {isParticipantsDialogOpen && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-lg rounded-lg border p-6 shadow-lg">
            <ParticipantsManager
              matterId={matterId}
              isOwner={matter.created_by === matter.created_by} // TODO: Compare with current user ID
              onClose={() => setIsParticipantsDialogOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Document Confirmation */}
      {deletingDocument && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card relative w-full max-w-md rounded-lg border p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Delete Document</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingDocument.filename}</strong>? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingDocument(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDocument}
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
