"use client";

import * as React from "react";
import { FileText, Trash2, Pencil, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useSavedIQLQueries,
  type SavedIQLQuery,
} from "@/hooks/use-saved-iql-queries";
import { cn } from "@/lib/utils";

interface SavedQueriesProps {
  onSelectQuery: (query: string) => void;
  matterId?: string;
  className?: string;
}

export function SavedQueries({
  onSelectQuery,
  matterId,
  className,
}: SavedQueriesProps) {
  const { queries, isLoading, deleteQuery, updateQuery } = useSavedIQLQueries({
    matterId,
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editQueryString, setEditQueryString] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const handleStartEdit = (query: SavedIQLQuery) => {
    setEditingId(query.id);
    setEditName(query.name);
    setEditDescription(query.description || "");
    setEditQueryString(query.query_string);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditQueryString("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      await updateQuery(editingId, {
        name: editName,
        description: editDescription || null,
        query_string: editQueryString,
      });
      handleCancelEdit();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this saved query?")) {
      await deleteQuery(id);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed py-12",
          className,
        )}
      >
        <FileText className="text-muted-foreground mb-3 h-10 w-10" />
        <p className="text-muted-foreground text-sm">No saved queries yet</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {queries.map((query) => (
        <Card
          key={query.id}
          className="p-4"
        >
          {editingId === query.id ? (
            <div className="space-y-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Query name"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <Textarea
                value={editQueryString}
                onChange={(e) => setEditQueryString(e.target.value)}
                placeholder="IQL query"
                rows={2}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={
                    isSaving || !editName.trim() || !editQueryString.trim()
                  }
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium">{query.name}</h4>
                  {query.description && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {query.description}
                    </p>
                  )}
                  <code className="bg-muted mt-2 block rounded px-2 py-1 text-xs">
                    {query.query_string}
                  </code>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onSelectQuery(query.query_string)}
                    title="Apply query"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleStartEdit(query)}
                    title="Edit query"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => handleDelete(query.id)}
                    title="Delete query"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export type { SavedQueriesProps };
