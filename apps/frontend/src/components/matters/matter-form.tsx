"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Matter,
  CreateMatterInput,
  UpdateMatterInput,
} from "@/hooks/use-matters";

interface MatterFormProps {
  matter?: Matter;
  onSubmit: (data: CreateMatterInput | UpdateMatterInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function MatterForm({
  matter,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MatterFormProps) {
  const [title, setTitle] = React.useState(matter?.title ?? "");
  const [description, setDescription] = React.useState(
    matter?.description ?? "",
  );
  const [status, setStatus] = React.useState<"active" | "closed" | "archived">(
    matter?.status ?? "active",
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isEditing = !!matter;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (description && description.length > 2000) {
      newErrors.description = "Description must be 2000 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing) {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      } as UpdateMatterInput);
    } else {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
      } as CreateMatterInput);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Smith v Jones - Commercial Dispute"
          disabled={isSubmitting}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the matter..."
          rows={4}
          disabled={isSubmitting}
          className={errors.description ? "border-destructive" : ""}
        />
        <p className="text-muted-foreground text-xs">
          {description.length}/2000 characters
        </p>
        {errors.description && (
          <p className="text-destructive text-sm">{errors.description}</p>
        )}
      </div>

      {/* Status (only for editing) */}
      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "active" | "closed" | "archived")
            }
            disabled={isSubmitting}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Matter"}
        </Button>
      </div>
    </form>
  );
}

export type { MatterFormProps };
