"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaybookCard } from "./playbook-card";
import { CheckItem } from "./check-item";
import { AddCheckDialog } from "./add-check-dialog";
import type { Playbook, PlaybookCheck } from "@/types/playbook";
import type { DocumentType } from "@/types/contract-analysis";
import { getPlaybooksForDocumentType } from "@/data/playbooks";

interface PlaybookStepProps {
  documentType: DocumentType;
  onBack: () => void;
  onContinue: (playbook: Playbook) => void;
}

export function PlaybookStep({
  documentType,
  onBack,
  onContinue,
}: PlaybookStepProps) {
  const availablePlaybooks = React.useMemo(
    () => getPlaybooksForDocumentType(documentType),
    [documentType],
  );

  const [selectedPlaybook, setSelectedPlaybook] =
    React.useState<Playbook | null>(
      availablePlaybooks.length > 0 ? availablePlaybooks[0] : null,
    );
  const [customChecks, setCustomChecks] = React.useState<PlaybookCheck[]>([]);
  const [expandedIql, setExpandedIql] = React.useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  // Combine preset checks with custom checks
  const allChecks = React.useMemo(() => {
    if (!selectedPlaybook) return [];
    return [...selectedPlaybook.checks, ...customChecks];
  }, [selectedPlaybook, customChecks]);

  const toggleIql = (checkId: string) => {
    setExpandedIql((prev) => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  const removeCustomCheck = (checkId: string) => {
    setCustomChecks((prev) => prev.filter((c) => c.id !== checkId));
  };

  const handleAddCheck = (check: PlaybookCheck) => {
    setCustomChecks((prev) => [...prev, check]);
    // Auto-expand the IQL for the new check
    setExpandedIql((prev) => new Set([...prev, check.id]));
  };

  const handleContinue = () => {
    if (!selectedPlaybook) return;
    // Create a modified playbook with custom checks included
    const finalPlaybook: Playbook = {
      ...selectedPlaybook,
      checks: allChecks,
    };
    onContinue(finalPlaybook);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Select a Review Playbook
        </h2>
        <p className="text-muted-foreground mt-2">
          Choose a curated set of checks or customize your own analysis
        </p>
      </div>

      {/* Playbook Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availablePlaybooks.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            playbook={playbook}
            isSelected={selectedPlaybook?.id === playbook.id}
            onSelect={() => setSelectedPlaybook(playbook)}
          />
        ))}
      </div>

      {/* Selected Playbook Preview */}
      {selectedPlaybook && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-700 dark:bg-stone-800/50">
          {/* Playbook header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {selectedPlaybook.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {allChecks.length} checks
                {customChecks.length > 0 && (
                  <span className="ml-1 text-stone-700 dark:text-stone-300">
                    (+{customChecks.length} custom)
                  </span>
                )}
              </p>
            </div>

            {/* Add custom check button */}
            <button
              onClick={() => setShowAddDialog(true)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                "bg-stone-100 text-stone-700 hover:bg-stone-200",
                "dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600",
                "focus:ring-2 focus:ring-stone-400/50 focus:outline-none",
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Check</span>
            </button>
          </div>

          {/* Checks list */}
          <div className="space-y-3">
            {allChecks.map((check) => (
              <CheckItem
                key={check.id}
                check={check}
                showIql={expandedIql.has(check.id)}
                onToggleIql={() => toggleIql(check.id)}
                onRemove={
                  check.source === "custom"
                    ? () => removeCustomCheck(check.id)
                    : undefined
                }
              />
            ))}
          </div>

          {/* Empty custom checks hint */}
          {customChecks.length === 0 && (
            <div className="mt-4 rounded-xl border-2 border-dashed border-stone-200 p-4 text-center dark:border-stone-700">
              <Sparkles className="text-muted-foreground/50 mx-auto h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                Want to check for something specific? Add a custom check using
                natural language.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
            "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            "dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white",
            "focus:ring-2 focus:ring-stone-500/50 focus:outline-none",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!selectedPlaybook}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-stone-800 px-6 py-2.5 text-sm font-medium text-white transition-colors",
            "hover:bg-stone-700",
            "dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300",
            "focus:ring-2 focus:ring-stone-500/50 focus:ring-offset-2 focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span>Run Analysis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Add Custom Check Dialog */}
      <AddCheckDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddCheck={handleAddCheck}
      />
    </div>
  );
}
