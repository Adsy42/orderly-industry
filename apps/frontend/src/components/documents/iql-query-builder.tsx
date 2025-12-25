"use client";

import * as React from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  HelpCircle,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  validateIQLQuery,
  validateIQLQueryWithOperators,
} from "@/lib/iql-validation";
import { cn } from "@/lib/utils";
import type { IQLQueryResult, IQLValidationResult } from "@/types/iql";
import { IQLHelp } from "./iql-help";

interface IQLQueryBuilderProps {
  documentId: string;
  onResults?: (results: IQLQueryResult) => void;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
  onSaveQuery?: (
    name: string,
    query: string,
    description?: string,
  ) => Promise<void>;
  className?: string;
  hideInlineHelp?: boolean; // If true, don't show inline help (help shown at page level)
}

export function IQLQueryBuilder({
  documentId,
  onResults,
  initialQuery = "",
  onQueryChange,
  onSaveQuery,
  className,
  hideInlineHelp = false,
}: IQLQueryBuilderProps) {
  const [query, setQuery] = React.useState(initialQuery);

  // Update query when initialQuery prop changes (e.g., from template selector)
  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Notify parent of query changes
  React.useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );
  const [validationWarnings, setValidationWarnings] = React.useState<string[]>(
    [],
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");
  const [saveDescription, setSaveDescription] = React.useState("");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  // Validate query on change (with operator support)
  React.useEffect(() => {
    if (!query.trim()) {
      setValidationError(null);
      setValidationWarnings([]);
      return;
    }

    // Use advanced validation for queries with operators
    const hasOperators = /(AND|OR|NOT|>|<|\+)/i.test(query);
    const validation: IQLValidationResult = hasOperators
      ? validateIQLQueryWithOperators(query)
      : validateIQLQuery(query);

    if (!validation.valid) {
      setValidationError(validation.error || "Invalid query syntax");
      setValidationWarnings([]);
    } else {
      setValidationError(null);
      setValidationWarnings(validation.warnings || []);
    }
  }, [query]);

  const handleExecute = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    // Check validation
    const validation = validateIQLQuery(query);
    if (!validation.valid) {
      setError(validation.error || "Invalid query syntax");
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      const response = await fetch("/api/iql/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          query: query.trim(),
          model: "kanon-universal-classifier",
        }),
      });

      // Clone response for error handling (response body can only be read once)
      const responseClone = response.clone();
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        let errorText: string = "";

        try {
          // Read the response body
          if (contentType?.includes("application/json")) {
            errorData = await response.json();
          } else {
            errorText = await response.text();
            // Try to parse as JSON even if content-type doesn't say so
            if (errorText) {
              try {
                errorData = JSON.parse(errorText);
              } catch {
                // If not JSON, use as plain text
                errorData = { error: errorText };
              }
            }
          }
        } catch (parseError) {
          console.error(
            "[IQL Query Builder] Failed to parse error response:",
            parseError,
          );
          // Try reading from clone as fallback
          try {
            errorText = await responseClone.text();
            errorData = {
              error:
                errorText || `HTTP ${response.status}: ${response.statusText}`,
            };
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
        }

        console.error("[IQL Query Builder] API error:", {
          status: response.status,
          statusText: response.statusText,
          contentType,
          error: errorData,
          errorKeys: Object.keys(errorData),
          rawText: errorText?.substring(0, 200),
        });

        // Build a more descriptive error message
        const errorMessage =
          (errorData.error as string) ||
          (errorData.message as string) ||
          (errorData.details as string) ||
          (errorText
            ? `Server error: ${errorText.substring(0, 100)}`
            : `Failed to execute query (HTTP ${response.status})`);

        throw new Error(errorMessage);
      }

      const results: IQLQueryResult = await response.json();
      onResults?.(results);
    } catch (err) {
      console.error("Clause Finder error:", err);
      setError(err instanceof Error ? err.message : "Failed to execute search");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Instructions Info Box - Always visible */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-medium text-blue-900">
              How to find clauses
            </h4>
            <p className="text-sm text-blue-800">
              Use built-in clause types like{" "}
              <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
                {"{IS confidentiality clause}"}
              </code>{" "}
              or combine searches with{" "}
              <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
                AND
              </code>
              ,{" "}
              <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
                OR
              </code>
              , and{" "}
              <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
                NOT
              </code>
              . Use the buttons above for example queries, operator guide, and
              understanding results.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="clause-finder-query"
          className="text-sm font-medium"
        >
          Clause Finder
        </label>
        <Textarea
          id="clause-finder-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find clauses, e.g., {IS confidentiality clause}"
          className={cn(
            "font-mono text-sm",
            validationError && "border-destructive",
          )}
          rows={3}
          disabled={isExecuting}
        />
        {validationError && (
          <p
            id="clause-finder-error"
            className="text-destructive flex items-center gap-1 text-xs"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle
              className="h-3 w-3"
              aria-hidden="true"
            />
            {validationError}
          </p>
        )}
        {validationWarnings.length > 0 && (
          <div
            className="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400"
            role="status"
          >
            <AlertTriangle
              className="mt-0.5 h-3 w-3 shrink-0"
              aria-hidden="true"
            />
            <div>
              {validationWarnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p
            id="clause-finder-hint"
            className="text-muted-foreground text-xs"
          >
            Press Cmd/Ctrl + Enter to search
          </p>
        </div>
        {!hideInlineHelp && (
          <IQLHelp
            onInsertQuery={(insertedQuery) => setQuery(insertedQuery)}
            className="mt-2"
          />
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-2 rounded-md border p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleExecute}
          disabled={isExecuting || !query.trim() || !!validationError}
          className="flex-1"
          aria-label="Find matching clauses"
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Find Clauses
            </>
          )}
        </Button>
        {onSaveQuery && query.trim() && !validationError && (
          <Button
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            disabled={isExecuting}
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && onSaveQuery && (
        <div className="bg-muted space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Save Search</h4>
            <button
              type="button"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName("");
                setSaveDescription("");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Search name"
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
            <textarea
              value={saveDescription}
              onChange={(e) => setSaveDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                if (!saveName.trim()) return;
                setIsSaving(true);
                try {
                  await onSaveQuery(
                    saveName,
                    query,
                    saveDescription || undefined,
                  );
                  setShowSaveDialog(false);
                  setSaveName("");
                  setSaveDescription("");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving || !saveName.trim()}
              className="flex-1"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName("");
                setSaveDescription("");
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export type { IQLQueryBuilderProps };
