"use client";

import * as React from "react";
import {
  Search,
  Loader2,
  X,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  document_id: string;
  chunk_text: string;
  filename: string;
  similarity: number;
  rerank_score?: number;
}

interface DocumentSearchProps {
  matterId: string;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
}

export function DocumentSearch({
  matterId,
  onResultClick,
  className,
}: DocumentSearchProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [wasReranked, setWasReranked] = React.useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    setWasReranked(false);

    try {
      // Use new search API with vector search + reranking
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterId,
          query: query.trim(),
          limit: 10,
          threshold: 0.3,
          useReranking: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Search API error:", errorData);
        // Fallback to full-text search if API fails
        await fallbackSearch(query);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);
      setWasReranked(data.reranked || false);
    } catch (err) {
      console.error("Search error:", err);
      await fallbackSearch(query);
    } finally {
      setIsSearching(false);
    }
  };

  // Fallback to full-text search
  const fallbackSearch = async (searchQuery: string) => {
    try {
      const supabase = createClient();
      const { data, error: ftError } = await supabase
        .from("documents")
        .select("id, filename, extracted_text")
        .eq("matter_id", matterId)
        .eq("processing_status", "ready")
        .textSearch("extracted_text", searchQuery, {
          type: "websearch",
          config: "english",
        })
        .limit(10);

      if (ftError) {
        setError("Search failed. Please try again.");
        return;
      }

      // Convert to SearchResult format with excerpts
      const searchResults: SearchResult[] = (data || []).map((doc) => ({
        id: doc.id,
        document_id: doc.id,
        filename: doc.filename,
        chunk_text: extractExcerpt(doc.extracted_text || "", searchQuery),
        similarity: 0.5, // Placeholder for full-text search
      }));

      setResults(searchResults);
    } catch {
      setError("Search failed. Please try again.");
    }
  };

  // Extract a relevant excerpt around the search terms
  const extractExcerpt = (text: string, searchQuery: string): string => {
    const lowerText = text.toLowerCase();
    const terms = searchQuery.toLowerCase().split(/\s+/);

    for (const term of terms) {
      const index = lowerText.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + term.length + 200);
        return (
          (start > 0 ? "..." : "") +
          text.slice(start, end).trim() +
          (end < text.length ? "..." : "")
        );
      }
    }

    return text.slice(0, 200) + (text.length > 200 ? "..." : "");
  };

  // Highlight search terms in text
  const highlightText = (text: string): React.ReactNode => {
    if (!query.trim()) return text;

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const regex = new RegExp(
      `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, i) => {
      const isMatch = terms.some(
        (term) => part.toLowerCase() === term.toLowerCase(),
      );
      return isMatch ? (
        <mark
          key={i}
          className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800"
        >
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  // Get the display score (prefer rerank_score if available)
  const getDisplayScore = (result: SearchResult): number => {
    return result.rerank_score ?? result.similarity;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setHasSearched(false);
    setWasReranked(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search documents semantically..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-9 pl-9"
            disabled={isSearching}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {hasSearched && !isSearching && (
        <div>
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <Search className="text-muted-foreground/50 mx-auto mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Found {results.length} relevant excerpt
                  {results.length === 1 ? "" : "s"}
                </p>
                {wasReranked && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-3 w-3" />
                    AI-reranked
                  </span>
                )}
              </div>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="group bg-card hover:border-primary/50 cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm"
                  onClick={() => onResultClick?.(result)}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <span className="font-medium">{result.filename}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          result.rerank_score !== undefined
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {Math.round(getDisplayScore(result) * 100)}% match
                      </span>
                      <ExternalLink className="text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {highlightText(result.chunk_text)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { DocumentSearchProps, SearchResult };
