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
}

export function IQLQueryBuilder({
  documentId,
  onResults,
  initialQuery = "",
  onQueryChange,
  onSaveQuery,
  className,
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
  const [showHelp, setShowHelp] = React.useState(false);
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
      setError("Please enter an IQL query");
      return;
    }

    // Check validation
    const validation = validateIQLQuery(query);
    if (!validation.valid) {
      setError(validation.error || "Invalid IQL query syntax");
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
      console.error("IQL query error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to execute IQL query",
      );
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
      <div className="space-y-2">
        <label
          htmlFor="iql-query"
          className="text-sm font-medium"
        >
          IQL Query
        </label>
        <Textarea
          id="iql-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter IQL query, e.g., {IS confidentiality clause}"
          className={cn(
            "font-mono text-sm",
            validationError && "border-destructive",
          )}
          rows={3}
          disabled={isExecuting}
        />
        {validationError && (
          <p
            id="iql-query-error"
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
            id="iql-query-help"
            className="text-muted-foreground text-xs"
          >
            Press Cmd/Ctrl + Enter to execute
          </p>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          >
            <HelpCircle className="h-3 w-3" />
            {showHelp ? "Hide" : "Show"} IQL help
          </button>
        </div>
        {showHelp && (
          <div className="bg-muted space-y-3 rounded-md border p-3 text-xs">
            {/* Templates vs Custom Statements */}
            <div className="border-primary/20 bg-primary/5 rounded border p-2">
              <p className="mb-1 flex items-center gap-1 font-medium">
                <Info className="h-3 w-3" />
                Templates vs Custom Statements
              </p>
              <p className="text-muted-foreground">
                <strong>Templates</strong> (recommended) are hand-optimized for
                accuracy:
                <code className="bg-background mx-1 rounded px-1">
                  {"{IS confidentiality clause}"}
                </code>
              </p>
              <p className="text-muted-foreground mt-1">
                <strong>Custom descriptions</strong> work best with the
                &quot;clause that&quot; template:
                <code className="bg-background mx-1 rounded px-1">
                  {'{IS clause that "your description"}'}
                </code>
              </p>
              <p className="text-muted-foreground mt-1">
                <strong>Standalone queries</strong> without brackets work for
                simple cases:
                <code className="bg-background mx-1 rounded px-1">
                  confidentiality clause
                </code>
              </p>
            </div>

            <div>
              <p className="mb-1 font-medium">Logical Operators:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                <li>
                  <code>AND</code> - Both conditions must match (returns minimum
                  score)
                </li>
                <li>
                  <code>OR</code> - Either condition matches (returns maximum
                  score)
                </li>
                <li>
                  <code>NOT</code> - Inverts the score (1 - original score)
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium">Comparison Operators:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                <li>
                  <code>&gt;</code> - Returns first score if greater, else 0
                </li>
                <li>
                  <code>&lt;</code> - Returns second score if greater, else 0
                </li>
                <li>
                  <code>+</code> - Averages all statement scores
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium">Examples:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                <li>
                  <code>
                    {"{IS confidentiality clause} AND {IS unilateral clause}"}
                  </code>
                </li>
                <li>
                  <code>
                    {
                      '{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}'
                    }
                  </code>
                </li>
                <li>
                  <code>
                    {"{IS termination clause} OR {IS remedial clause}"}
                  </code>
                </li>
                <li>
                  <code>{"NOT {IS liability limitation clause}"}</code>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-1 font-medium">Operator Precedence:</p>
              <p className="text-muted-foreground">
                <code>()</code> → <code>+</code> → <code>&gt;</code>,{" "}
                <code>&lt;</code> → <code>NOT</code> → <code>AND</code> →{" "}
                <code>OR</code>
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium">Chained Comparisons:</p>
              <p className="text-muted-foreground">
                <code>A &gt; B &gt; C</code> is interpreted as{" "}
                <code>(A &gt; B) AND (B &gt; C)</code>
              </p>
            </div>
          </div>
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
          aria-label="Execute IQL query"
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Execute Query
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

      {/* Save Query Dialog */}
      {showSaveDialog && onSaveQuery && (
        <div className="bg-muted space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Save Query</h4>
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
              placeholder="Query name"
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
