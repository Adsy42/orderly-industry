"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IQLQueryBuilder } from "@/components/documents/iql-query-builder";
import type { IQLQueryResult } from "@/types/iql";
import { IQLResults } from "@/components/documents/iql-results";
import { IQLTemplateSelector } from "@/components/documents/iql-template-selector";
import { SavedQueries } from "@/components/documents/saved-queries";
import { IQLExampleQueries } from "@/components/documents/iql-example-queries";
import { IQLOperatorsGuide } from "@/components/documents/iql-operators-guide";
import { IQLUnderstandingResults } from "@/components/documents/iql-understanding-results";
import { useSavedIQLQueries } from "@/hooks/use-saved-iql-queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  id: string;
  filename: string;
  processing_status: string;
}

export default function IQLQueryPage() {
  const params = useParams();
  const matterId = params.matterId as string;
  const documentId = params.documentId as string;

  const [document, setDocument] = React.useState<Document | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<IQLQueryResult | null>(null);
  const [currentQuery, setCurrentQuery] = React.useState("");
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showSavedQueries, setShowSavedQueries] = React.useState(false);
  const [showExamples, setShowExamples] = React.useState(false);
  const [showOperators, setShowOperators] = React.useState(false);
  const [showUnderstanding, setShowUnderstanding] = React.useState(false);
  const { createQuery } = useSavedIQLQueries({ matterId });

  // Fetch document info
  React.useEffect(() => {
    async function fetchDocument() {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: docError } = await supabase
          .from("documents")
          .select("id, filename, processing_status")
          .eq("id", documentId)
          .single();

        if (docError || !data) {
          setError("Document not found");
        } else {
          setDocument(data);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }

    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const handleResults = (queryResults: IQLQueryResult) => {
    setResults(queryResults);
  };

  const handleMatchClick = (match: IQLQueryResult["matches"][0]) => {
    // TODO: Navigate to document viewer at match position
    console.log("Navigate to match:", match);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-8 h-5 w-32" />
        <Skeleton className="mb-6 h-10 w-64" />
        <Skeleton className="mb-4 h-64" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href={`/protected/matters/${matterId}`}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matter
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <h2 className="mb-2 text-xl font-semibold">Document not found</h2>
          <p className="text-muted-foreground">
            {error || "This document does not exist or you don't have access."}
          </p>
        </div>
      </div>
    );
  }

  if (document.processing_status !== "ready") {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href={`/protected/matters/${matterId}`}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matter
        </Link>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Document not ready</h2>
          <p className="text-muted-foreground">
            This document is still processing. Please wait for text extraction
            to complete.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Status: {document.processing_status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Link */}
      <Link
        href={`/protected/matters/${matterId}`}
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center text-sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matter
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Clause Finder</h1>
        <p className="text-muted-foreground mt-2">
          Find clauses in <strong>{document.filename}</strong>
        </p>
      </div>

      {/* Help Section Toggles */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowTemplates(!showTemplates);
            if (!showTemplates) {
              setShowSavedQueries(false);
              setShowExamples(false);
              setShowOperators(false);
              setShowUnderstanding(false);
            }
          }}
        >
          {showTemplates ? "Hide" : "Show"} Clause Types
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowSavedQueries(!showSavedQueries);
            if (!showSavedQueries) {
              setShowTemplates(false);
              setShowExamples(false);
              setShowOperators(false);
              setShowUnderstanding(false);
            }
          }}
        >
          {showSavedQueries ? "Hide" : "Show"} Saved Searches
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowExamples(!showExamples);
            if (!showExamples) {
              setShowTemplates(false);
              setShowSavedQueries(false);
              setShowOperators(false);
              setShowUnderstanding(false);
            }
          }}
        >
          {showExamples ? "Hide" : "Show"} Example Queries
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowOperators(!showOperators);
            if (!showOperators) {
              setShowTemplates(false);
              setShowSavedQueries(false);
              setShowExamples(false);
              setShowUnderstanding(false);
            }
          }}
        >
          {showOperators ? "Hide" : "Show"} Operators Guide
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowUnderstanding(!showUnderstanding);
            if (!showUnderstanding) {
              setShowTemplates(false);
              setShowSavedQueries(false);
              setShowExamples(false);
              setShowOperators(false);
            }
          }}
        >
          {showUnderstanding ? "Hide" : "Show"} Understanding Results
        </Button>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="mb-8">
          <IQLTemplateSelector
            onSelectTemplate={(query) => {
              setCurrentQuery(query);
              setShowTemplates(false);
            }}
          />
        </div>
      )}

      {/* Saved Searches */}
      {showSavedQueries && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Saved Searches</h2>
          <SavedQueries
            onSelectQuery={(query) => {
              setCurrentQuery(query);
              setShowSavedQueries(false);
            }}
            matterId={matterId}
          />
        </div>
      )}

      {/* Example Queries */}
      {showExamples && (
        <div className="mb-8">
          <IQLExampleQueries
            onInsertQuery={(insertedQuery) => setCurrentQuery(insertedQuery)}
          />
        </div>
      )}

      {/* Operators Guide */}
      {showOperators && (
        <div className="mb-8">
          <IQLOperatorsGuide />
        </div>
      )}

      {/* Understanding Results */}
      {showUnderstanding && (
        <div className="mb-8">
          <IQLUnderstandingResults />
        </div>
      )}

      {/* Clause Finder */}
      <div className="mb-8">
        <IQLQueryBuilder
          documentId={documentId}
          onResults={handleResults}
          initialQuery={currentQuery}
          onQueryChange={setCurrentQuery}
          onSaveQuery={async (name, query, description) => {
            await createQuery(name, query, description, matterId);
          }}
          hideInlineHelp={true}
          onSwitchToIQLMode={() => {
            // This prop registers the switch function
          }}
        />
      </div>

      {/* Results */}
      {results && (
        <div>
          <IQLResults
            results={results}
            onMatchClick={handleMatchClick}
            matterId={matterId}
            onSwitchToIQLMode={(query) => {
              setCurrentQuery(query);
              // Trigger mode switch via the exposed function
              const switchFn = (
                window as unknown as {
                  _switchToIQLMode?: (query: string) => void;
                }
              )._switchToIQLMode;
              if (switchFn) {
                switchFn(query);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
