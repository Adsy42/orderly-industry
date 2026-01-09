"use client";

import * as React from "react";
import { Loader2, Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { IqlDisplay } from "./iql-display";
import { SeverityBadge } from "./severity-badge";
import { useIqlTranslate } from "@/hooks/use-iql-translate";
import type { PlaybookCheck } from "@/types/playbook";
import type { Severity } from "@/types/contract-analysis";

interface AddCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCheck: (check: PlaybookCheck) => void;
}

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export function AddCheckDialog({
  open,
  onOpenChange,
  onAddCheck,
}: AddCheckDialogProps) {
  const [query, setQuery] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("MEDIUM");
  const [showSeveritySelect, setShowSeveritySelect] = React.useState(false);

  const { translate, isTranslating, error, result, reset } = useIqlTranslate();

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setSeverity("MEDIUM");
      setShowSeveritySelect(false);
      reset();
    }
  }, [open, reset]);

  const handleTranslate = async () => {
    await translate(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!result) {
        handleTranslate();
      }
    }
  };

  const handleAddCheck = () => {
    if (!result) return;

    const newCheck: PlaybookCheck = {
      id: `custom-${Date.now()}`,
      title: query.length > 50 ? query.slice(0, 50) + "..." : query,
      description: query,
      iql: result.iql,
      severity,
      category: "Custom",
      action: "Review for potential issues",
      source: "custom",
      originalNlQuery: query,
      translationConfidence: result.confidence,
      templatesUsed: result.templatesUsed,
    };

    onAddCheck(newCheck);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-stone-700 dark:text-stone-300" />
            Add Custom Check
          </DialogTitle>
          <DialogDescription>
            Describe what you want to check for in natural language. We'll
            translate it to IQL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Natural language input */}
          <div className="space-y-2">
            <label
              htmlFor="nl-query"
              className="text-sm font-medium text-zinc-900 dark:text-white"
            >
              What should this check look for?
            </label>
            <textarea
              id="nl-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Check for clauses that limit vendor liability for defects"
              rows={3}
              className={cn(
                "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm",
                "placeholder:text-muted-foreground",
                "focus:border-stone-400 focus:ring-2 focus:ring-stone-200 focus:outline-none",
                "dark:border-stone-700 dark:bg-stone-800 dark:focus:ring-stone-700",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              disabled={isTranslating}
            />
            <p className="text-muted-foreground text-xs">
              Press Cmd/Ctrl + Enter to translate
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Translation result */}
          {result && (
            <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50">
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-white">
                  Generated IQL
                </p>
                <IqlDisplay
                  iql={result.iql}
                  variant="block"
                  showCopy
                />
              </div>

              {result.explanation && (
                <p className="text-muted-foreground text-sm">
                  {result.explanation}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Confidence:
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      result.confidence >= 0.8
                        ? "text-stone-800 dark:text-stone-200"
                        : result.confidence >= 0.6
                          ? "text-stone-600 dark:text-stone-400"
                          : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>

                {result.templatesUsed && result.templatesUsed.length > 0 && (
                  <span className="text-muted-foreground text-xs">
                    Templates: {result.templatesUsed.join(", ")}
                  </span>
                )}
              </div>

              {/* Severity selector */}
              <div className="border-t border-stone-200 pt-4 dark:border-stone-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    Severity
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowSeveritySelect(!showSeveritySelect)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                        "border border-stone-200 hover:bg-stone-100",
                        "dark:border-stone-600 dark:hover:bg-stone-700",
                      )}
                    >
                      <SeverityBadge
                        severity={severity}
                        size="sm"
                      />
                      <ChevronDown className="text-muted-foreground h-4 w-4" />
                    </button>

                    {showSeveritySelect && (
                      <div className="absolute top-full right-0 z-10 mt-1 w-32 rounded-lg border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-stone-800">
                        {SEVERITY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSeverity(option.value);
                              setShowSeveritySelect(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                              "hover:bg-stone-100 dark:hover:bg-stone-700",
                              severity === option.value &&
                                "bg-stone-50 dark:bg-stone-700/50",
                            )}
                          >
                            <SeverityBadge
                              severity={option.value}
                              size="sm"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "text-stone-600 hover:bg-stone-100",
              "dark:text-stone-400 dark:hover:bg-stone-800",
            )}
          >
            Cancel
          </button>

          {!result ? (
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !query.trim()}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors",
                "hover:bg-stone-700",
                "dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Translate to IQL
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleAddCheck}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors",
                "hover:bg-stone-700",
                "dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300",
              )}
            >
              Add to Playbook
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
