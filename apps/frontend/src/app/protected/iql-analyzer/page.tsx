"use client";

import * as React from "react";
import { FileSearch, FileText, Briefcase, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  IQLQueryBuilder,
  type IQLQueryBuilderProps,
} from "@/components/documents/iql-query-builder";
import { IQLResults } from "@/components/documents/iql-results";
import { IQLTemplateSelector } from "@/components/documents/iql-template-selector";
import { SavedQueries } from "@/components/documents/saved-queries";
import { useSavedIQLQueries } from "@/hooks/use-saved-iql-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IQLQueryResult } from "@/types/iql";

interface Matter {
  id: string;
  title: string;
  matter_number: string;
  status: string;
}

interface Document {
  id: string;
  filename: string;
  file_type: string;
  processing_status: string;
  uploaded_at: string;
}

export default function IQLAnalyzerPage() {
  // State for matter and document selection
  const [matters, setMatters] = React.useState<Matter[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [selectedMatterId, setSelectedMatterId] = React.useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] =
    React.useState<string>("");

  // Loading states
  const [isLoadingMatters, setIsLoadingMatters] = React.useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false);

  // Query state
  const [results, setResults] = React.useState<IQLQueryResult | null>(null);
  const [currentQuery, setCurrentQuery] = React.useState("");
  const [showTemplates, setShowTemplates] = React.useState(false);
  const [showSavedQueries, setShowSavedQueries] = React.useState(false);

  // Saved queries hook
  const { createQuery } = useSavedIQLQueries({
    matterId: selectedMatterId || undefined,
  });

  // Fetch matters on mount
  React.useEffect(() => {
    async function fetchMatters() {
      setIsLoadingMatters(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("matters")
          .select("id, title, matter_number, status")
          .eq("status", "active")
          .order("updated_at", { ascending: false });

        if (error) throw error;
        setMatters(data || []);
      } catch (err) {
        console.error("Error fetching matters:", err);
      } finally {
        setIsLoadingMatters(false);
      }
    }

    fetchMatters();
  }, []);

  // Fetch documents when matter is selected
  React.useEffect(() => {
    if (!selectedMatterId) {
      setDocuments([]);
      setSelectedDocumentId("");
      return;
    }

    async function fetchDocuments() {
      setIsLoadingDocuments(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("documents")
          .select("id, filename, file_type, processing_status, uploaded_at")
          .eq("matter_id", selectedMatterId)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
        setSelectedDocumentId(""); // Reset document selection
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    fetchDocuments();
  }, [selectedMatterId]);

  // Reset results when document changes
  React.useEffect(() => {
    setResults(null);
  }, [selectedDocumentId]);

  const handleResults = (queryResults: IQLQueryResult) => {
    setResults(queryResults);
  };

  const handleMatchClick = (match: IQLQueryResult["matches"][0]) => {
    // TODO: Navigate to document viewer at match position
    console.log("Navigate to match:", match);
  };

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);
  const isDocumentReady = selectedDocument?.processing_status === "ready";
  const readyDocuments = documents.filter(
    (d) => d.processing_status === "ready",
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <FileSearch className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">
            IQL Query Analyzer
          </h1>
        </div>
        <p className="text-muted-foreground">
          Analyze legal documents using Isaacus Query Language. Select a matter
          and document to begin.
        </p>
      </div>

      {/* Selection Card */}
      <Card className="mb-8 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Matter Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Briefcase className="h-4 w-4" />
              Select Matter
            </label>
            <Select
              value={selectedMatterId}
              onValueChange={setSelectedMatterId}
              disabled={isLoadingMatters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingMatters ? "Loading matters..." : "Choose a matter"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {matters.length === 0 && !isLoadingMatters ? (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    No active matters found
                  </div>
                ) : (
                  matters.map((matter) => (
                    <SelectItem
                      key={matter.id}
                      value={matter.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{matter.title}</span>
                        <span className="text-muted-foreground text-xs">
                          #{matter.matter_number}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {matters.length === 0 && !isLoadingMatters && (
              <p className="text-muted-foreground text-xs">
                Create a matter first to analyze documents
              </p>
            )}
          </div>

          {/* Document Selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Select Document
            </label>
            <Select
              value={selectedDocumentId}
              onValueChange={setSelectedDocumentId}
              disabled={!selectedMatterId || isLoadingDocuments}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedMatterId
                      ? "Select a matter first"
                      : isLoadingDocuments
                        ? "Loading documents..."
                        : "Choose a document"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {documents.length === 0 && !isLoadingDocuments ? (
                  <div className="text-muted-foreground py-6 text-center text-sm">
                    No documents in this matter
                  </div>
                ) : (
                  documents.map((doc) => {
                    const isReady = doc.processing_status === "ready";
                    return (
                      <SelectItem
                        key={doc.id}
                        value={doc.id}
                        disabled={!isReady}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={!isReady ? "text-muted-foreground" : ""}
                          >
                            {doc.filename}
                          </span>
                          {!isReady && (
                            <span className="text-xs text-amber-500">
                              ({doc.processing_status})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {selectedMatterId && documents.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {readyDocuments.length} of {documents.length} document
                {documents.length !== 1 ? "s" : ""} ready for analysis
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Document Not Ready Warning */}
      {selectedDocumentId && !isDocumentReady && selectedDocument && (
        <Card className="mb-8 border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-amber-600" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Document Processing
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This document is still being processed (
                {selectedDocument.processing_status}). Please wait for text
                extraction to complete before running IQL queries.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* IQL Query Interface - Only show when document is selected and ready */}
      {selectedDocumentId && isDocumentReady && (
        <>
          {/* Template and Saved Queries Toggles */}
          <div className="mb-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowTemplates(!showTemplates);
                if (!showTemplates) setShowSavedQueries(false);
              }}
            >
              {showTemplates ? "Hide" : "Show"} Templates
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSavedQueries(!showSavedQueries);
                if (!showSavedQueries) setShowTemplates(false);
              }}
            >
              {showSavedQueries ? "Hide" : "Show"} Saved Queries
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

          {/* Saved Queries */}
          {showSavedQueries && (
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">Saved Queries</h2>
              <SavedQueries
                onSelectQuery={(query) => {
                  setCurrentQuery(query);
                  setShowSavedQueries(false);
                }}
                matterId={selectedMatterId}
              />
            </div>
          )}

          {/* Query Builder */}
          <div className="mb-8">
            <Card className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Query Builder</h2>
                <p className="text-muted-foreground text-sm">
                  Analyzing: <strong>{selectedDocument?.filename}</strong>
                </p>
              </div>
              <IQLQueryBuilder
                documentId={selectedDocumentId}
                onResults={handleResults}
                initialQuery={currentQuery}
                onQueryChange={setCurrentQuery}
                onSaveQuery={async (name, query, description) => {
                  await createQuery(name, query, description, selectedMatterId);
                }}
              />
            </Card>
          </div>

          {/* Results */}
          {results && (
            <div>
              <IQLResults
                results={results}
                onMatchClick={handleMatchClick}
              />
            </div>
          )}
        </>
      )}

      {/* Empty State - No document selected */}
      {!selectedDocumentId && selectedMatterId && documents.length > 0 && (
        <Card className="p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Select a Document</h2>
          <p className="text-muted-foreground">
            Choose a document from the dropdown above to start analyzing with
            IQL queries.
          </p>
        </Card>
      )}

      {/* Empty State - No documents in matter */}
      {selectedMatterId && documents.length === 0 && !isLoadingDocuments && (
        <Card className="p-12 text-center">
          <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">No Documents Found</h2>
          <p className="text-muted-foreground mb-4">
            This matter doesn&apos;t have any documents yet. Upload documents to
            the matter first.
          </p>
          <Button
            variant="outline"
            onClick={() =>
              (window.location.href = `/protected/matters/${selectedMatterId}`)
            }
          >
            Go to Matter
          </Button>
        </Card>
      )}

      {/* Empty State - No matter selected */}
      {!selectedMatterId && !isLoadingMatters && matters.length > 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Select a Matter</h2>
          <p className="text-muted-foreground">
            Choose a matter from the dropdown above to see its documents.
          </p>
        </Card>
      )}

      {/* Empty State - No matters */}
      {!isLoadingMatters && matters.length === 0 && (
        <Card className="p-12 text-center">
          <Briefcase className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">No Matters Found</h2>
          <p className="text-muted-foreground mb-4">
            Create a matter and upload documents to start using IQL analysis.
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/protected/matters")}
          >
            Go to Matters
          </Button>
        </Card>
      )}
    </div>
  );
}
