"use client";

import * as React from "react";
import {
  FileSearch,
  FileText,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Save,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { IQLQueryBuilder } from "@/components/documents/iql-query-builder";
import { IQLResults } from "@/components/documents/iql-results";
import { IQLTemplateSelector } from "@/components/documents/iql-template-selector";
import { SavedQueries } from "@/components/documents/saved-queries";
import { IQLExampleQueries } from "@/components/documents/iql-example-queries";
import { IQLOperatorsGuide } from "@/components/documents/iql-operators-guide";
import { IQLUnderstandingResults } from "@/components/documents/iql-understanding-results";
import { useSavedIQLQueries } from "@/hooks/use-saved-iql-queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

type HelpSection = "templates" | "saved" | "examples" | "operators" | "results";

export default function IQLAnalyzerPage() {
  const [matters, setMatters] = React.useState<Matter[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [selectedMatterId, setSelectedMatterId] = React.useState<string>("");
  const [selectedDocumentId, setSelectedDocumentId] =
    React.useState<string>("");

  const [isLoadingMatters, setIsLoadingMatters] = React.useState(true);
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false);

  const [results, setResults] = React.useState<IQLQueryResult | null>(null);
  const [currentQuery, setCurrentQuery] = React.useState("");
  const [expandedSection, setExpandedSection] =
    React.useState<HelpSection | null>("templates");

  const { createQuery } = useSavedIQLQueries({
    matterId: selectedMatterId || undefined,
  });

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
        setSelectedDocumentId("");
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    fetchDocuments();
  }, [selectedMatterId]);

  React.useEffect(() => {
    setResults(null);
  }, [selectedDocumentId]);

  const handleResults = (queryResults: IQLQueryResult) => {
    setResults(queryResults);
  };

  const handleMatchClick = (match: IQLQueryResult["matches"][0]) => {
    console.log("Navigate to match:", match);
  };

  const toggleSection = (section: HelpSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);
  const isDocumentReady = selectedDocument?.processing_status === "ready";
  const readyDocuments = documents.filter(
    (d) => d.processing_status === "ready",
  );

  const helpSections: {
    id: HelpSection;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "templates", label: "Clause Types", icon: BookOpen },
    { id: "saved", label: "Saved Searches", icon: Save },
    { id: "examples", label: "Example Queries", icon: Lightbulb },
    { id: "operators", label: "Operators Guide", icon: HelpCircle },
    { id: "results", label: "Understanding Results", icon: FileText },
  ];

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Clause Finder"
        subtitle="Find and analyze clauses in your legal documents"
        icon={FileSearch}
      />

      {/* Two Column Layout */}
      <div className="flex gap-8">
        {/* Main Column */}
        <div className="min-w-0 flex-1">
          {/* Selection Card */}
          <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800/50">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Matter Selector */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                  <Briefcase className="text-muted-foreground h-4 w-4" />
                  Select Matter
                </label>
                <Select
                  value={selectedMatterId}
                  onValueChange={setSelectedMatterId}
                  disabled={isLoadingMatters}
                >
                  <SelectTrigger className="rounded-xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
                    <SelectValue
                      placeholder={
                        isLoadingMatters
                          ? "Loading matters..."
                          : "Choose a matter"
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
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  Select Document
                </label>
                <Select
                  value={selectedDocumentId}
                  onValueChange={setSelectedDocumentId}
                  disabled={!selectedMatterId || isLoadingDocuments}
                >
                  <SelectTrigger className="rounded-xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800">
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
                                className={
                                  !isReady ? "text-muted-foreground" : ""
                                }
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
          </div>

          {/* Document Processing Warning */}
          {selectedDocumentId && !isDocumentReady && selectedDocument && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    Document Processing
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This document is still being processed (
                    {selectedDocument.processing_status}). Please wait for text
                    extraction to complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Query Builder - Only show when document is ready */}
          {selectedDocumentId && isDocumentReady && (
            <>
              <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800/50">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Find Clauses
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Searching in:{" "}
                    <strong className="text-foreground">
                      {selectedDocument?.filename}
                    </strong>
                  </p>
                </div>
                <IQLQueryBuilder
                  documentId={selectedDocumentId}
                  onResults={handleResults}
                  initialQuery={currentQuery}
                  onQueryChange={setCurrentQuery}
                  onSaveQuery={async (name, query, description) => {
                    await createQuery(
                      name,
                      query,
                      description,
                      selectedMatterId,
                    );
                  }}
                  hideInlineHelp={true}
                />
              </div>

              {/* Results */}
              {results && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800/50">
                  <IQLResults
                    results={results}
                    onMatchClick={handleMatchClick}
                  />
                </div>
              )}
            </>
          )}

          {/* Empty States */}
          {!selectedDocumentId && selectedMatterId && documents.length > 0 && (
            <EmptyState
              icon={FileText}
              title="Select a Document"
              description="Choose a document from the dropdown above to start finding clauses."
            />
          )}

          {selectedMatterId &&
            documents.length === 0 &&
            !isLoadingDocuments && (
              <EmptyState
                icon={FileText}
                title="No Documents Found"
                description="This matter doesn't have any documents yet. Upload documents to the matter first."
                action={{
                  label: "Go to Matter",
                  onClick: () =>
                    (window.location.href = `/protected/matters/${selectedMatterId}`),
                }}
              />
            )}

          {!selectedMatterId && !isLoadingMatters && matters.length > 0 && (
            <EmptyState
              icon={Briefcase}
              title="Select a Matter"
              description="Choose a matter from the dropdown above to see its documents."
            />
          )}

          {!isLoadingMatters && matters.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title="No Matters Found"
              description="Create a matter and upload documents to start finding clauses."
              action={{
                label: "Go to Matters",
                onClick: () => (window.location.href = "/protected/matters"),
              }}
            />
          )}
        </div>

        {/* Help Sidebar - Only show when document is ready */}
        {selectedDocumentId && isDocumentReady && (
          <div className="hidden w-80 shrink-0 space-y-4 lg:block">
            {helpSections.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.id;

              return (
                <div
                  key={section.id}
                  className="rounded-2xl border border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-800/50"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "flex w-full items-center justify-between p-4",
                      "text-sm font-semibold text-zinc-900 dark:text-white",
                      "transition-colors hover:bg-stone-50 dark:hover:bg-stone-700/50",
                      isExpanded &&
                        "border-b border-stone-100 dark:border-stone-700",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="text-muted-foreground h-4 w-4" />
                      {section.label}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="text-muted-foreground h-4 w-4" />
                    ) : (
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="max-h-96 overflow-y-auto p-4">
                      {section.id === "templates" && (
                        <IQLTemplateSelector
                          onSelectTemplate={(query) => {
                            setCurrentQuery(query);
                          }}
                        />
                      )}
                      {section.id === "saved" && (
                        <SavedQueries
                          onSelectQuery={(query) => {
                            setCurrentQuery(query);
                          }}
                          matterId={selectedMatterId}
                        />
                      )}
                      {section.id === "examples" && (
                        <IQLExampleQueries
                          onInsertQuery={(insertedQuery) =>
                            setCurrentQuery(insertedQuery)
                          }
                        />
                      )}
                      {section.id === "operators" && <IQLOperatorsGuide />}
                      {section.id === "results" && <IQLUnderstandingResults />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
