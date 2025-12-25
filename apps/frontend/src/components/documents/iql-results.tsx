"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IQLQueryResult } from "@/types/iql";

// Maximum characters to show before truncating
const MAX_EXCERPT_LENGTH = 200;

interface IQLResultsProps {
  results: IQLQueryResult | null;
  onMatchClick?: (match: IQLQueryResult["matches"][0]) => void;
  className?: string;
  matterId?: string;
}

export function IQLResults({
  results,
  onMatchClick,
  className,
  matterId,
}: IQLResultsProps) {
  if (!results) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) {
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    }
    if (score >= 0.5) {
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.7) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (score >= 0.5) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <XCircle className="h-4 w-4" />;
  };

  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };

  const handleExport = () => {
    if (!results) return;

    const exportData = {
      query: results.query,
      documentId: results.documentId,
      documentName: results.documentName,
      executedAt: results.executedAt,
      model: results.model,
      overallScore: results.score,
      matchCount: results.matches.length,
      matches: results.matches.map((match) => ({
        text: match.text,
        startIndex: match.startIndex,
        endIndex: match.endIndex,
        score: match.score,
        confidence: `${(match.score * 100).toFixed(1)}%`,
        chunkIndex: match.chunkIndex,
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: "Clause Finder",
        version: "1.0",
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clause-finder-results-${results.documentName.replace(/\.[^/.]+$/, "")}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMatchClick = (match: IQLQueryResult["matches"][0]) => {
    if (onMatchClick) {
      onMatchClick(match);
    } else {
      // Default behavior: scroll to match position if possible
      // This is a placeholder - actual navigation would require document viewer integration
      console.log("Navigate to match:", match);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Results Summary */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Query Results</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              {results.matches.length} match
              {results.matches.length !== 1 ? "es" : ""} found
            </p>
          </div>
          <div
            className={cn(
              "ml-4 flex items-center gap-2 rounded-md border px-3 py-1.5",
              getScoreColor(results.score),
            )}
          >
            {getScoreIcon(results.score)}
            <span className="font-medium">{formatScore(results.score)}</span>
          </div>
        </div>
        <div className="text-muted-foreground mt-2 text-xs">
          <p>
            Query:{" "}
            <code className="bg-muted rounded px-1">{results.query}</code>
          </p>
          <p>Document: {results.documentName}</p>
          <p>Executed: {new Date(results.executedAt).toLocaleString()}</p>
        </div>
      </Card>

      {/* Matches */}
      {results.matches.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-2 font-medium">No matches found</h3>
          <p className="text-muted-foreground text-sm">
            The query did not find any matching clauses in this document. Try a
            different query or check the document content.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.matches.map((match, index) => (
            <MatchCard
              key={index}
              match={match}
              index={index}
              getScoreColor={getScoreColor}
              getScoreIcon={getScoreIcon}
              formatScore={formatScore}
              onMatchClick={onMatchClick}
              matterId={matterId ?? results.matterId}
              documentId={results.documentId}
              documentName={results.documentName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual match card with expand/collapse functionality
function MatchCard({
  match,
  index,
  getScoreColor,
  getScoreIcon,
  formatScore,
  onMatchClick,
  matterId,
  documentId,
  documentName,
}: {
  match: IQLQueryResult["matches"][0];
  index: number;
  getScoreColor: (score: number) => string;
  getScoreIcon: (score: number) => React.ReactNode;
  formatScore: (score: number) => string;
  onMatchClick?: (match: IQLQueryResult["matches"][0]) => void;
  matterId?: string;
  documentId: string;
  documentName: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const needsTruncation = match.text.length > MAX_EXCERPT_LENGTH;
  const displayText =
    isExpanded || !needsTruncation
      ? match.text
      : match.text.slice(0, MAX_EXCERPT_LENGTH) + "...";

  const documentHref = matterId
    ? `/protected/matters/${matterId}/documents/${documentId}?start=${match.startIndex}&end=${match.endIndex}`
    : `/protected/documents/${documentId}?start=${match.startIndex}&end=${match.endIndex}`;

  const citationMarkdown =
    match.citation?.markdown ??
    `[${documentName}](cite:${documentId}@${match.startIndex}-${match.endIndex})`;

  const handleCopyText = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(match.text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyCitation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(citationMarkdown);
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } catch (err) {
      console.error("Failed to copy citation:", err);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                  getScoreColor(match.score),
                )}
              >
                {getScoreIcon(match.score)}
                {formatScore(match.score)}
              </span>
              {match.chunkIndex !== undefined && (
                <span className="text-muted-foreground text-xs">
                  Chunk {match.chunkIndex + 1}
                </span>
              )}
              <span className="text-muted-foreground text-xs">
                {match.text.length} chars
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={handleCopyText}
            >
              {copiedText ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>

          <p className="bg-muted/50 rounded border p-2 text-sm leading-relaxed whitespace-pre-wrap">
            {displayText}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              Position: {match.startIndex.toLocaleString()}-
              {match.endIndex.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={documentHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open in document
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleCopyCitation}
              >
                {copiedCitation ? "Copied citation" : "Copy citation"}
              </Button>
              {needsTruncation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleToggleExpand}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-1 h-3 w-3" />
                      Show more
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export type { IQLResultsProps };
