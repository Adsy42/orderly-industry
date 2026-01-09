"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { IqlDisplay } from "./iql-display";
import type { DocumentType, AnalysisResults } from "@/types/contract-analysis";
import type { Playbook, PlaybookCheckProgress } from "@/types/playbook";
import { DEMO_TIMING } from "@/data/demo-results";

interface AnalyzingStepProps {
  documentType: DocumentType;
  documentName: string;
  playbook?: Playbook;
  onComplete: (results: AnalysisResults) => void;
}

// Demo detected check IDs - a random subset will be detected
// Lower probability since playbooks now have 50+ checks each
const DEMO_DETECTION_PROBABILITY = 0.12;

export function AnalyzingStep({
  documentType,
  documentName,
  playbook,
  onComplete,
}: AnalyzingStepProps) {
  // Memoize checks to avoid unnecessary re-renders
  const checks = React.useMemo(
    () => playbook?.checks ?? [],
    [playbook?.checks],
  );

  const [progress, setProgress] = React.useState<PlaybookCheckProgress[]>(
    checks.map((check) => ({
      checkId: check.id,
      title: check.title,
      iql: check.iql,
      status: "pending" as const,
    })),
  );
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [_scanningPage, _setScanningPage] = React.useState(1);

  // Determine which checks are "detected" for the demo
  const detectedCheckIds = React.useMemo(() => {
    const detected = new Set<string>();
    checks.forEach((check) => {
      // Higher severity checks have higher chance of detection in demo
      const severityBonus =
        check.severity === "CRITICAL"
          ? 0.2
          : check.severity === "HIGH"
            ? 0.1
            : 0;
      if (Math.random() < DEMO_DETECTION_PROBABILITY + severityBonus) {
        detected.add(check.id);
      }
    });
    // Ensure at least one detection for demo purposes
    if (detected.size === 0 && checks.length > 0) {
      const highSeverityCheck = checks.find(
        (c) => c.severity === "CRITICAL" || c.severity === "HIGH",
      );
      detected.add(highSeverityCheck?.id ?? checks[0].id);
    }
    return detected;
  }, [checks]);

  // Run the analysis simulation
  React.useEffect(() => {
    if (checks.length === 0) return;

    if (currentIndex >= checks.length) {
      // All queries complete, show results after a brief delay
      const timer = setTimeout(() => {
        // Build results from progress
        const detectedFlags = progress
          .filter((p) => p.detected)
          .map((p) => {
            const check = checks.find((c) => c.id === p.checkId)!;
            return {
              id: check.id,
              name: check.title,
              query: check.iql,
              severity: check.severity,
              category: check.category,
              description: check.description,
              action: check.action,
              financial_impact: check.financialImpact,
              confidence: p.confidence ?? 0.85,
              start_char: 0,
              end_char: 100,
              matched_text: "Sample matched text from contract...",
            };
          });

        // Calculate risk score based on detected flags
        // Scale weights based on total checks to avoid always hitting 100
        const totalChecks = checks.length;
        const scaleFactor = Math.max(1, totalChecks / 15); // Normalize to ~15 checks
        const riskScore = Math.min(
          100,
          Math.round(
            detectedFlags.reduce((sum, flag) => {
              const baseWeight =
                flag.severity === "CRITICAL"
                  ? 30
                  : flag.severity === "HIGH"
                    ? 20
                    : flag.severity === "MEDIUM"
                      ? 10
                      : 5;
              return sum + baseWeight / scaleFactor;
            }, 0),
          ),
        );

        const results: AnalysisResults = {
          document_type: documentType,
          document_name: documentName,
          risk_score: riskScore,
          flags: detectedFlags,
          analyzed_at: new Date().toISOString(),
        };

        onComplete(results);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Start checking the current query
    const checkTimer = setTimeout(() => {
      setProgress((prev) =>
        prev.map((p, i) =>
          i === currentIndex ? { ...p, status: "checking" as const } : p,
        ),
      );

      // Complete the check after a delay
      const completeTimer = setTimeout(() => {
        const isDetected = detectedCheckIds.has(checks[currentIndex].id);
        const confidence = isDetected ? 0.7 + Math.random() * 0.25 : undefined;

        setProgress((prev) =>
          prev.map((p, i) =>
            i === currentIndex
              ? {
                  ...p,
                  status: "complete" as const,
                  detected: isDetected,
                  confidence,
                }
              : p,
          ),
        );
        setCurrentIndex((prev) => prev + 1);

        // Update scanning page
        const newPage =
          Math.floor(((currentIndex + 1) / checks.length) * 8) + 1;
        _setScanningPage(Math.min(newPage, 8));
      }, DEMO_TIMING.checkingDuration);

      return () => clearTimeout(completeTimer);
    }, DEMO_TIMING.queryDelay);

    return () => clearTimeout(checkTimer);
  }, [
    currentIndex,
    checks,
    detectedCheckIds,
    documentType,
    documentName,
    onComplete,
    progress,
  ]);

  const progressPercent =
    checks.length > 0 ? Math.round((currentIndex / checks.length) * 100) : 0;
  const detectedCount = progress.filter((p) => p.detected).length;

  return (
    <div className="mx-auto max-w-3xl px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-stone-700 dark:text-stone-300" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
          {playbook ? `Running: ${playbook.name}` : "Analyzing Contract..."}
        </h2>
        <p className="text-muted-foreground">{documentName}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentIndex} of {checks.length} checks
          </span>
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {progressPercent}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
          <div
            className="h-full rounded-full bg-stone-800 transition-all duration-300 ease-out dark:bg-stone-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats summary */}
      {detectedCount > 0 && (
        <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">
            {detectedCount} issue{detectedCount !== 1 ? "s" : ""} detected
          </span>
        </div>
      )}

      {/* Query checklist with IQL */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800/50">
        <h3 className="text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase">
          Running Checks
        </h3>
        <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
          {progress.map((item) => (
            <AnalyzingCheckItem
              key={item.checkId}
              item={item}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface AnalyzingCheckItemProps {
  item: PlaybookCheckProgress;
}

function AnalyzingCheckItem({ item }: AnalyzingCheckItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200 p-4 transition-all duration-300",
        "dark:border-stone-700",
        item.status === "pending" && "bg-stone-50 dark:bg-stone-800/30",
        item.status === "checking" &&
          "bg-stone-100 ring-2 ring-stone-300 dark:bg-stone-700 dark:ring-stone-500",
        item.status === "complete" &&
          item.detected &&
          "bg-red-50 dark:bg-red-950/20",
        item.status === "complete" &&
          !item.detected &&
          "bg-stone-50 dark:bg-stone-800/30",
      )}
    >
      {/* Title and status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Status icon */}
          {item.status === "pending" && (
            <div className="h-5 w-5 rounded-full border-2 border-stone-300 dark:border-stone-600" />
          )}
          {item.status === "checking" && (
            <Loader2 className="h-5 w-5 animate-spin text-stone-700 dark:text-stone-300" />
          )}
          {item.status === "complete" && item.detected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {item.status === "complete" && !item.detected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-800">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {/* Check title */}
          <span
            className={cn(
              "font-medium transition-colors",
              item.status === "pending" && "text-muted-foreground",
              item.status === "checking" && "text-foreground",
              item.status === "complete" &&
                item.detected &&
                "text-red-700 dark:text-red-400",
              item.status === "complete" && !item.detected && "text-foreground",
            )}
          >
            {item.title}
          </span>
        </div>

        {/* Status text */}
        <div className="text-right">
          {item.status === "checking" && (
            <span className="text-xs text-stone-700 dark:text-stone-300">
              Checking...
            </span>
          )}
          {item.status === "complete" && item.detected && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              DETECTED {Math.round((item.confidence ?? 0.85) * 100)}%
            </span>
          )}
          {item.status === "complete" && !item.detected && (
            <span className="text-muted-foreground text-xs">No match</span>
          )}
        </div>
      </div>

      {/* IQL display */}
      <div className="mt-2">
        <IqlDisplay
          iql={item.iql}
          variant="inline"
        />
      </div>
    </div>
  );
}
