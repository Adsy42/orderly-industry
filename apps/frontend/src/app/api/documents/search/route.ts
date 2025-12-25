import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed, rerank } from "@/lib/isaacus";
import { formatCitation } from "@/lib/citation-formatter";
import type {
  Citation,
  SearchResponse,
  SearchResult,
  FormattedCitation,
} from "@/types/documents";

/**
 * Document Search API Route
 *
 * Hybrid search (semantic + keyword) with Isaacus reranking
 * and legal-style citation formatting.
 *
 * POST /api/documents/search
 * Body: {
 *   query: string,
 *   matter_id: string,
 *   semantic_weight?: number (0-1, default 0.7),
 *   match_count?: number (default 20),
 *   match_threshold?: number (default 0.5),
 *   include_context?: boolean (default true),
 *   document_id?: string (optional - filter to single document)
 * }
 */

interface SearchRequest {
  query: string;
  matter_id: string;
  semantic_weight?: number;
  match_count?: number;
  match_threshold?: number;
  include_context?: boolean;
  document_id?: string;
}

interface HybridSearchResult {
  id: string;
  document_id: string;
  section_id: string | null;
  parent_chunk_id: string | null;
  content: string;
  citation: Citation;
  filename: string;
  score: number;
  parent_content: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const {
      query,
      matter_id,
      semantic_weight = 0.7,
      match_count = 20,
      match_threshold = 0.5,
      include_context = true,
      document_id,
    } = body;

    // Validate required fields
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!matter_id || typeof matter_id !== "string") {
      return NextResponse.json(
        { error: "matter_id is required" },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to matter
    const { data: matter, error: matterError } = await supabase
      .from("matters")
      .select("id")
      .eq("id", matter_id)
      .single();

    if (matterError || !matter) {
      return NextResponse.json(
        { error: "Matter not found or access denied" },
        { status: 404 },
      );
    }

    // Generate query embedding
    const queryEmbeddings = await embed([query], "retrieval/query");
    const queryEmbedding = queryEmbeddings[0];

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 },
      );
    }

    // Format embedding as string for pgvector - required for proper type casting
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Call hybrid search RPC function
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "hybrid_search_chunks",
      {
        query_embedding: embeddingStr,
        query_text: query,
        matter_uuid: matter_id,
        semantic_weight,
        match_threshold,
        match_count: match_count * 2, // Get more for reranking
        include_context,
      },
    );

    if (searchError) {
      console.error("Hybrid search error:", searchError);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    const hybridResults = (searchResults || []) as HybridSearchResult[];

    if (hybridResults.length === 0) {
      const response: SearchResponse = {
        query,
        matter_id,
        results: [],
        total_count: 0,
        search_type: "hybrid",
      };
      return NextResponse.json(response);
    }

    // Filter by document if specified
    let filteredResults = hybridResults;
    if (document_id) {
      filteredResults = hybridResults.filter(
        (r) => r.document_id === document_id,
      );
    }

    // Rerank results using Isaacus
    const contents = filteredResults.map((r) => r.content);
    const rerankedResults = await rerank(query, contents, match_count);

    // Map reranked indices back to results and format citations
    const formattedResults: Array<
      SearchResult & { formatted_citation: FormattedCitation }
    > = [];

    for (const reranked of rerankedResults) {
      const original = filteredResults[reranked.index];
      if (!original) continue;

      const formatted = formatCitation(
        original.filename,
        original.citation,
        matter_id,
        original.document_id,
        original.section_id,
      );

      formattedResults.push({
        id: original.id,
        document_id: original.document_id,
        section_id: original.section_id,
        parent_chunk_id: original.parent_chunk_id,
        content: original.content,
        citation: original.citation,
        filename: original.filename,
        score: reranked.score,
        parent_content: original.parent_content,
        formatted_citation: formatted,
      });
    }

    const response: SearchResponse = {
      query,
      matter_id,
      results: formattedResults,
      total_count: formattedResults.length,
      search_type: "hybrid",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Search API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
