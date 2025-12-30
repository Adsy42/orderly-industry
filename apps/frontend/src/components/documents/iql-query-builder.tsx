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
  /** Callback to switch to IQL mode with a specific query (used by results component) */
  onSwitchToIQLMode?: (query: string) => void;
}

export function IQLQueryBuilder({
  documentId,
  onResults,
  initialQuery = "",
  onQueryChange,
  onSaveQuery,
  className,
  hideInlineHelp = false,
  onSwitchToIQLMode,
}: IQLQueryBuilderProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [mode, setMode] = React.useState<"natural-language" | "iql">(
    "natural-language",
  );
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translatedQuery, setTranslatedQuery] = React.useState<string | null>(
    null,
  );
  const [translationExplanation, setTranslationExplanation] = React.useState<
    string | null
  >(null);

  // Update query when initialQuery prop changes (e.g., from template selector)
  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle switch to IQL mode callback
  React.useEffect(() => {
    if (onSwitchToIQLMode) {
      // Store callback function for results component to use
      const switchToIQL = (iqlQuery: string) => {
        setMode("iql");
        setQuery(iqlQuery);
      };
      (
        window as unknown as { _switchToIQLMode?: (query: string) => void }
      )._switchToIQLMode = switchToIQL;
    }
  }, [onSwitchToIQLMode]);

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

  // Validate query on change (mode-specific validation)
  React.useEffect(() => {
    if (!query.trim()) {
      setValidationError(null);
      setValidationWarnings([]);
      return;
    }

    // In IQL mode, validate IQL syntax
    if (mode === "iql") {
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
    } else {
      // In natural language mode, no syntax validation needed
      setValidationError(null);
      setValidationWarnings([]);
    }
  }, [query, mode]);

  // Clear validation errors and translation preview when switching modes
  React.useEffect(() => {
    setValidationError(null);
    setValidationWarnings([]);
    setTranslatedQuery(null);
    setTranslationExplanation(null);
  }, [mode]);

  // Clear translation preview when query changes
  React.useEffect(() => {
    setTranslatedQuery(null);
    setTranslationExplanation(null);
  }, [query]);

  // Handle translation (NL mode step 1: translate and show preview)
  const handleTranslate = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslatedQuery(null);
    setTranslationExplanation(null);

    try {
      const translateResponse = await fetch("/api/iql/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      if (!translateResponse.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          errorData = await translateResponse.json();
        } catch {
          errorData = {
            error: `Translation failed (HTTP ${translateResponse.status})`,
          };
        }

        const errorMessage =
          (errorData.message as string) ||
          (errorData.error as string) ||
          "Could not translate query. Please try rephrasing or use IQL syntax directly.";

        setError(errorMessage);
        return;
      }

      const translationResult = await translateResponse.json();
      const translatedIQL = translationResult.iql;

      // Validate translated IQL
      const validation = validateIQLQuery(translatedIQL);
      if (!validation.valid) {
        setError(
          `Translation produced invalid IQL: ${validation.error}. Please try rephrasing or use IQL mode directly.`,
        );
        return;
      }

      // Show translation preview
      setTranslatedQuery(translatedIQL);
      setTranslationExplanation(translationResult.explanation || null);
    } catch (translateError) {
      console.error("[IQL Query Builder] Translation error:", translateError);
      setError(
        translateError instanceof Error
          ? translateError.message
          : "Translation failed. Please try rephrasing or use IQL syntax directly.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  // Execute IQL query (directly or after translation)
  const handleExecute = async (iqlToExecute?: string) => {
    const finalQuery = iqlToExecute || query.trim();

    if (!finalQuery) {
      setError("Please enter a search query");
      return;
    }

    // Validate IQL syntax
    const validation = validateIQLQuery(finalQuery);
    if (!validation.valid) {
      setError(validation.error || "Invalid query syntax");
      return;
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Execute IQL query
      const response = await fetch("/api/iql/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          query: finalQuery,
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
      // Include translated IQL in results if executing from translation preview
      if (translatedQuery && mode === "natural-language") {
        results.translatedIQL = translatedQuery;
      }
      onResults?.(results);
      // Clear translation preview after successful execution
      setTranslatedQuery(null);
      setTranslationExplanation(null);
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
      if (mode === "natural-language") {
        if (translatedQuery) {
          // If already translated, execute
          handleExecute(translatedQuery);
        } else {
          // Otherwise, translate first
          handleTranslate();
        }
      } else {
        // IQL mode: execute directly
        handleExecute();
      }
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
              In <strong>Natural Language</strong> mode, describe what you're
              looking for in plain English (e.g., "one-sided confidentiality
              clauses"). In <strong>IQL</strong> mode, use built-in clause types
              like{" "}
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
        <div className="flex items-center justify-between">
          <label
            htmlFor="clause-finder-query"
            className="text-sm font-medium"
          >
            Clause Finder
          </label>
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 rounded-md border p-1">
            <button
              type="button"
              onClick={() => setMode("natural-language")}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition-colors",
                mode === "natural-language"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              Natural Language
            </button>
            <button
              type="button"
              onClick={() => setMode("iql")}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition-colors",
                mode === "iql"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              IQL
            </button>
          </div>
        </div>
        <Textarea
          id="clause-finder-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "natural-language"
              ? "Describe what you're looking for, e.g., one-sided confidentiality clauses"
              : "Find clauses, e.g., {IS confidentiality clause}"
          }
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

      {/* Translation Preview (NL mode only) */}
      {mode === "natural-language" && translatedQuery && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Translated to IQL:
              </p>
              <code className="mt-1 block rounded bg-blue-100 px-3 py-2 font-mono text-sm text-blue-900 dark:bg-blue-900/50 dark:text-blue-100">
                {translatedQuery}
              </code>
              {translationExplanation && (
                <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  {translationExplanation}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExecute(translatedQuery)}
                disabled={isExecuting}
                size="sm"
                className="flex-1"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Run This Query
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMode("iql");
                  setQuery(translatedQuery);
                  setTranslatedQuery(null);
                  setTranslationExplanation(null);
                }}
                disabled={isExecuting}
              >
                Edit IQL
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTranslatedQuery(null);
                  setTranslationExplanation(null);
                }}
                disabled={isExecuting}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

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
        {/* In NL mode without translation: show Translate button */}
        {/* In NL mode with translation: hide main button (use preview buttons) */}
        {/* In IQL mode: show Find Clauses button */}
        {mode === "natural-language" && !translatedQuery ? (
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !query.trim()}
            className="flex-1"
            aria-label="Translate to IQL"
          >
            {isTranslating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Translate & Preview
              </>
            )}
          </Button>
        ) : mode === "iql" ? (
          <Button
            onClick={() => handleExecute()}
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
        ) : null}
        {onSaveQuery && query.trim() && !validationError && mode === "iql" && (
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
