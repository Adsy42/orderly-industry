"use client";

import * as React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Circle,
  RotateCcw,
  Download,
  Share2,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RiskGauge } from "./risk-gauge";
import { RedFlagCard } from "./red-flag-card";
import { SeverityBadge } from "./severity-badge";
import { openAnnotatedPdfInNewTab } from "@/lib/pdf-annotator";
import type {
  AnalysisResults,
  Severity,
  DetectedFlag,
} from "@/types/contract-analysis";
import { SEVERITY_ORDER } from "@/types/contract-analysis";

interface ResultsStepProps {
  results: AnalysisResults;
  onReset: () => void;
  documentFile?: File | null;
}

export function ResultsStep({
  results,
  onReset,
  documentFile,
}: ResultsStepProps) {
  const [expandedFlagId, setExpandedFlagId] = React.useState<string | null>(
    null,
  );
  const [isOpeningPdf, setIsOpeningPdf] = React.useState(false);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  // Handle opening annotated PDF in new tab
  const handleViewPdf = async () => {
    if (!documentFile) return;

    setIsOpeningPdf(true);
    setPdfError(null);

    try {
      let pdfFile = documentFile;

      // If DOCX, convert to PDF first
      const isDocx =
        documentFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        documentFile.name.toLowerCase().endsWith(".docx");

      if (isDocx) {
        const formData = new FormData();
        formData.append("file", documentFile);

        const response = await fetch("/api/documents/convert-to-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Conversion failed");
        }

        const data = await response.json();

        // Convert data URL to File object
        const base64 = data.pdf_url.split(",")[1];
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const pdfBlob = new Blob([bytes], { type: "application/pdf" });
        pdfFile = new File(
          [pdfBlob],
          documentFile.name.replace(/\.docx$/i, ".pdf"),
          { type: "application/pdf" },
        );
      }

      // Open annotated PDF in new tab
      await openAnnotatedPdfInNewTab(pdfFile, results.flags);
    } catch (error) {
      console.error("Failed to open PDF:", error);
      setPdfError(
        error instanceof Error ? error.message : "Failed to open PDF",
      );
    } finally {
      setIsOpeningPdf(false);
    }
  };

  // Group flags by severity
  const flagsBySeverity = React.useMemo(() => {
    const grouped: Record<Severity, typeof results.flags> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    results.flags.forEach((flag) => {
      grouped[flag.severity].push(flag);
    });
    return grouped;
  }, [results]);

  // Count by severity
  const counts = {
    CRITICAL: flagsBySeverity.CRITICAL.length,
    HIGH: flagsBySeverity.HIGH.length,
    MEDIUM: flagsBySeverity.MEDIUM.length,
    LOW: flagsBySeverity.LOW.length,
  };

  const handleFlagClick = (flag: DetectedFlag) => {
    setExpandedFlagId(expandedFlagId === flag.id ? null : flag.id);
  };

  return (
    <div>
      {/* Risk Score Card */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-between">
          {/* Gauge */}
          <div className="mb-6 lg:mb-0">
            <RiskGauge
              score={results.risk_score}
              size="lg"
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={AlertTriangle}
              value={counts.CRITICAL}
              label="Critical"
              colorClass="text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
            />
            <StatCard
              icon={AlertCircle}
              value={counts.HIGH}
              label="High"
              colorClass="text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
            />
            <StatCard
              icon={Info}
              value={counts.MEDIUM}
              label="Medium"
              colorClass="text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400"
            />
            <StatCard
              icon={Circle}
              value={counts.LOW}
              label="Low"
              colorClass="text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400"
            />
          </div>
        </div>

        {/* Document info */}
        <div className="text-muted-foreground mt-6 flex items-center justify-center gap-2 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-slate-800">
          <FileText className="h-4 w-4" />
          <span>{results.document_name}</span>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Red Flags Column */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">
            Detected Red Flags
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({results.flags.length})
            </span>
          </h2>

          <div className="max-h-[600px] space-y-6 overflow-y-auto pr-2">
            {SEVERITY_ORDER.map((severity) => {
              const flags = flagsBySeverity[severity];
              if (flags.length === 0) return null;

              return (
                <div key={severity}>
                  <div className="mb-3 flex items-center gap-2">
                    <SeverityBadge
                      severity={severity}
                      size="sm"
                    />
                    <span className="text-muted-foreground text-sm">
                      {flags.length} issue{flags.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {flags.map((flag) => (
                      <RedFlagCard
                        key={flag.id}
                        flag={flag}
                        isExpanded={expandedFlagId === flag.id}
                        onToggle={() => handleFlagClick(flag)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Preview Column */}
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Document Preview
            </h2>
          </div>

          <div className="text-muted-foreground flex min-h-[400px] flex-col items-center justify-center p-12">
            {documentFile ? (
              <>
                <FileText className="mb-6 h-16 w-16 opacity-50" />
                <p className="mb-2 text-base font-medium text-zinc-900 dark:text-white">
                  {documentFile.name}
                </p>
                <p className="mb-6 max-w-xs text-center text-sm">
                  View the document with all {results.flags.length} detected
                  issues highlighted
                </p>
                <Button
                  onClick={handleViewPdf}
                  disabled={isOpeningPdf}
                  className="rounded-xl"
                  size="lg"
                >
                  {isOpeningPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {documentFile.name.toLowerCase().endsWith(".docx")
                        ? "Converting..."
                        : "Opening..."}
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View PDF with Highlights
                    </>
                  )}
                </Button>
                {pdfError && (
                  <p className="text-destructive mt-4 text-sm">{pdfError}</p>
                )}
              </>
            ) : (
              <>
                <FileText className="mb-6 h-16 w-16 opacity-50" />
                <p className="mb-2 text-base font-medium">Sample Analysis</p>
                <p className="max-w-xs text-center text-sm">
                  This is a demo analysis. Upload your own PDF or DOCX to view
                  it with highlighted issues.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button
          onClick={onReset}
          variant="outline"
          className="rounded-xl"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Analyze Another
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => alert("Report download coming soon!")}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => alert("Share feature coming soon!")}
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Results
        </Button>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  colorClass: string;
}

function StatCard({ icon: Icon, value, label, colorClass }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl p-4 text-center",
        colorClass,
      )}
    >
      <Icon className="mb-2 h-6 w-6" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}
