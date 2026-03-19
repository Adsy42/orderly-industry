import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Legal Answer Edge Function
 *
 * Extractive QA pipeline: Embed → Hybrid Search → Rerank → Extract
 * Returns exact character positions for precise document highlighting.
 *
 * Ported from apps/agent/src/tools/legal_answer.py
 */

interface LegalAnswerRequest {
  matter_id: string;
  question: string;
  document_ids?: string[];
}

interface Citation {
  formatted: string;
  permalink: string;
  markdown: string;
  document_id: string;
  chunk_id: string;
  start: number;
  end: number;
}

interface LegalAnswerResponse {
  answer: string;
  confidence: number;
  citation: Citation | null;
  found: boolean;
  question?: string;
  error?: string;
  _usage_hint?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Isaacus API helpers
const ISAACUS_BASE_URL = Deno.env.get("ISAACUS_BASE_URL") || "https://api.isaacus.com";

function isaacusUrl(path: string): string {
  const base = ISAACUS_BASE_URL.endsWith("/v1")
    ? ISAACUS_BASE_URL
    : `${ISAACUS_BASE_URL}/v1`;
  return `${base}${path}`;
}

async function isaacusFetch(path: string, body: unknown): Promise<Response> {
  const apiKey = Deno.env.get("ISAACUS_API_KEY")!;
  return fetch(isaacusUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function embedTexts(
  texts: string[],
  task = "retrieval/query",
): Promise<number[][]> {
  const res = await isaacusFetch("/embeddings", {
    texts,
    model: "kanon-2-embedder",
    task,
  });
  if (!res.ok) {
    throw new Error(`Embedding failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  if (data.embeddings?.[0]?.embedding) {
    return data.embeddings.map(
      (item: { embedding: number[] }) => item.embedding,
    );
  }
  return data.embeddings;
}

async function rerank(
  query: string,
  documents: string[],
  topK = 5,
): Promise<{ index: number; score: number }[]> {
  const res = await isaacusFetch("/rerankings", {
    query,
    texts: documents,
    model: "kanon-universal-classifier",
  });
  if (!res.ok) {
    throw new Error(`Rerank failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const results = data.results || [];
  return results.slice(0, topK);
}

async function extractAnswer(
  query: string,
  texts: string[],
): Promise<{
  answer: string;
  score: number;
  start: number;
  end: number;
  text_index: number;
} | null> {
  const res = await isaacusFetch("/extractions/qa", {
    model: "kanon-answer-extractor",
    query,
    texts,
    top_k: 1,
    ignore_inextractability: true,
  });
  if (!res.ok) {
    throw new Error(`Extract failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  if (!data.extractions?.length) return null;

  let bestAnswer: any = null;
  let bestScore = -1;
  let bestTextIndex = 0;

  for (const extraction of data.extractions) {
    if (extraction.answers) {
      for (const answer of extraction.answers) {
        if (answer.score > bestScore) {
          bestScore = answer.score;
          bestAnswer = answer;
          bestTextIndex = extraction.index;
        }
      }
    }
  }

  if (!bestAnswer) return null;

  return {
    answer: bestAnswer.text,
    score: bestAnswer.score,
    start: bestAnswer.start,
    end: bestAnswer.end,
    text_index: bestTextIndex,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { matter_id, question, document_ids } =
      (await req.json()) as LegalAnswerRequest;

    if (!matter_id || !question) {
      return jsonResponse(
        { error: "matter_id and question are required" },
        400,
      );
    }

    const isaacusApiKey = Deno.env.get("ISAACUS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!isaacusApiKey) {
      return jsonResponse({
        answer: "Configuration error: Missing ISAACUS_API_KEY",
        confidence: 0,
        citation: null,
        found: false,
        error: "Missing ISAACUS_API_KEY",
      } satisfies LegalAnswerResponse);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Generate query embedding
    const embeddings = await embedTexts([question], "retrieval/query");
    if (!embeddings?.length) {
      return jsonResponse({
        answer: "Failed to process question",
        confidence: 0,
        citation: null,
        found: false,
      } satisfies LegalAnswerResponse);
    }

    const embeddingStr =
      "[" + embeddings[0].map(String).join(",") + "]";

    // Step 2: Hybrid search for relevant chunks
    const searchParams: Record<string, unknown> = {
      query_embedding: embeddingStr,
      query_text: question,
      matter_uuid: matter_id,
      semantic_weight: 0.7,
      match_threshold: 0.3,
      match_count: 15,
      include_context: true,
    };

    if (document_ids?.length) {
      searchParams.document_uuids = document_ids;
    }

    const { data: chunks, error: searchError } = await supabase.rpc(
      "hybrid_search_chunks",
      searchParams,
    );

    if (searchError || !chunks?.length) {
      return jsonResponse({
        answer: "No relevant content found in documents",
        confidence: 0,
        citation: null,
        found: false,
      } satisfies LegalAnswerResponse);
    }

    // Step 3: Rerank chunks
    const chunkTexts = chunks.map(
      (c: Record<string, string>) => c.content || "",
    );

    let rerankedChunks = chunks.slice(0, 5);
    try {
      const ranked = await rerank(question, chunkTexts, 5);
      const ordered = ranked
        .map((r) => ({ ...chunks[r.index], rerank_score: r.score }))
        .filter(Boolean);
      if (ordered.length) rerankedChunks = ordered;
    } catch {
      // Use search order if rerank fails
    }

    // Step 4: Extract answer
    const validChunks: typeof rerankedChunks = [];
    const validTexts: string[] = [];
    for (const chunk of rerankedChunks.slice(0, 3)) {
      const content = chunk.content || "";
      if (content.trim()) {
        validChunks.push(chunk);
        validTexts.push(content);
      }
    }

    if (!validTexts.length) {
      return jsonResponse({
        answer: "No readable content found in relevant documents",
        confidence: 0,
        citation: null,
        found: false,
      } satisfies LegalAnswerResponse);
    }

    const extracted = await extractAnswer(question, validTexts);
    if (!extracted) {
      return jsonResponse({
        answer: "Could not extract a specific answer from the documents",
        confidence: 0,
        citation: null,
        found: false,
      } satisfies LegalAnswerResponse);
    }

    // Step 5: Build citation
    const bestChunk =
      extracted.text_index < validChunks.length
        ? validChunks[extracted.text_index]
        : validChunks[0];

    const documentId = bestChunk.document_id || "";
    const chunkId = bestChunk.chunk_id || "";
    const filename = bestChunk.filename || "Document";
    const citationData = bestChunk.citation || {};

    const formattedParts = [filename];
    if (citationData.page) formattedParts.push(`p.${citationData.page}`);
    if (citationData.section_path?.length) {
      formattedParts.push(
        `§ ${citationData.section_path.slice(-1)[0]?.slice(0, 20)}`,
      );
    }
    const formatted = formattedParts.join(", ");

    const startPos = extracted.start;
    const endPos = extracted.end;
    const permalink = `cite:${documentId}#${chunkId}@${startPos}-${endPos}`;
    const markdownCitation = `[${formatted}](${permalink})`;

    return jsonResponse({
      answer: extracted.answer,
      confidence: extracted.score,
      citation: {
        formatted,
        permalink,
        markdown: markdownCitation,
        document_id: documentId,
        chunk_id: chunkId,
        start: startPos,
        end: endPos,
      },
      found: true,
      question,
      _usage_hint: `Use this citation in your response: ${markdownCitation}`,
    } satisfies LegalAnswerResponse);
  } catch (error) {
    console.error("Legal answer error:", error);
    return jsonResponse(
      {
        answer: `Error: ${error instanceof Error ? error.message : String(error)}`,
        confidence: 0,
        citation: null,
        found: false,
        error: String(error),
      } satisfies LegalAnswerResponse,
      500,
    );
  }
});
