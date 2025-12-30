import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { embed, rerank } from "@/lib/isaacus";

interface SearchResult {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string; // Changed from chunk_text to content
  filename: string;
  similarity: number;
  rerank_score?: number;
}

/**
 * Search API with vector similarity + Isaacus reranking.
 *
 * Flow:
 * 1. Embed query using Isaacus (retrieval/query task)
 * 2. Vector similarity search via Supabase RPC (get 20 candidates)
 * 3. Rerank candidates using Isaacus reranking API
 * 4. Return top 10 results sorted by rerank score
 *
 * @see https://docs.isaacus.com/capabilities/reranking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      matterId,
      query,
      limit = 10,
      threshold = 0.3,
      useReranking = true,
    } = body;

    if (!matterId || !query) {
      return NextResponse.json(
        { error: "matterId and query are required" },
        { status: 400 },
      );
    }

    // Step 1: Embed query using retrieval/query task
    console.log(`[Search] Embedding query: "${query}"`);
    const embeddings = await embed([query], "retrieval/query");
    const queryEmbedding = embeddings[0];

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: "Failed to generate query embedding" },
        { status: 500 },
      );
    }

    // Step 2: Vector similarity search - get more candidates for reranking
    const candidateCount = useReranking ? Math.min(limit * 2, 20) : limit;
    console.log(`[Search] Vector search for ${candidateCount} candidates`);

    // Format embedding as string for pgvector - required for proper type casting
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const supabase = await createServerSupabaseClient();
    const { data: candidates, error: searchError } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding: embeddingStr,
        matter_uuid: matterId,
        match_threshold: threshold,
        match_count: candidateCount,
      },
    );

    if (searchError) {
      console.error("[Search] Vector search error:", searchError);
      return NextResponse.json(
        { error: "Search failed", details: searchError.message },
        { status: 500 },
      );
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({
        results: [],
        query,
        matterId,
        message: "No matching documents found",
      });
    }

    console.log(`[Search] Found ${candidates.length} vector candidates`);

    // Step 3: Rerank if enabled and we have candidates
    let results: SearchResult[] = candidates;
    let reranked = false;

    if (useReranking && candidates.length > 1) {
      console.log(`[Search] Reranking ${candidates.length} candidates`);

      try {
        const rerankResults = await rerank(
          query,
          candidates.map(
            (c: SearchResult) => c.content || (c as any).chunk_text,
          ), // Support both old and new schema
          limit,
        );

        // Map rerank scores back to candidates
        const rerankedResults = rerankResults.map((r) => ({
          ...candidates[r.index],
          rerank_score: r.score,
        }));

        results = rerankedResults;
        reranked = true;
        console.log(
          `[Search] Reranking complete, top score: ${results[0]?.rerank_score?.toFixed(3)}`,
        );
      } catch (rerankError) {
        console.error(
          "[Search] Reranking failed, using vector scores:",
          rerankError,
        );
        // Fall back to vector similarity scores
      }
    }

    // Step 4: Return top N results
    const topResults = results.slice(0, limit);

    return NextResponse.json({
      results: topResults,
      query,
      matterId,
      totalCandidates: candidates.length,
      reranked,
    });
  } catch (error) {
    console.error("[Search] API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
