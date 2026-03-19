import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Legal Classify Edge Function
 *
 * Clause finding pipeline: Embed → Vector Search → IQL Classification
 * Returns exact character positions for precise document highlighting.
 *
 * Ported from apps/agent/src/tools/legal_classify.py
 */

interface LegalClassifyRequest {
  matter_id: string;
  clause_type: string;
  document_ids?: string[];
}

interface ClauseMatch {
  text: string;
  score: number;
  citation: {
    formatted: string;
    permalink: string;
    markdown: string;
    document_id: string;
    start: number;
    end: number;
  };
}

interface LegalClassifyResponse {
  clause_type: string;
  matches: ClauseMatch[];
  total_found: number;
  searched_documents: number;
  matches_by_document?: Record<
    string,
    { filename: string; count: number }
  >;
  _usage_hint?: string;
  _instruction?: string;
  error?: string;
  message?: string;
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

const ISAACUS_BASE_URL =
  Deno.env.get("ISAACUS_BASE_URL") || "https://api.isaacus.com";

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

async function classifyIql(
  query: string,
  text: string,
): Promise<{
  score: number;
  matches: {
    text: string;
    start_index: number;
    end_index: number;
    score: number;
  }[];
}> {
  const res = await isaacusFetch("/classifications/universal", {
    query,
    texts: [text],
    model: "kanon-universal-classifier",
  });
  if (!res.ok) {
    throw new Error(`IQL classify failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  const result: {
    score: number;
    matches: {
      text: string;
      start_index: number;
      end_index: number;
      score: number;
    }[];
  } = { score: 0, matches: [] };

  if (data.classifications?.length) {
    const classification = data.classifications[0];
    result.score = classification.score || 0;

    if (classification.chunks?.length) {
      result.matches = classification.chunks.map(
        (chunk: Record<string, unknown>) => ({
          text: chunk.text || "",
          start_index: chunk.start ?? chunk.start_index ?? chunk.startIndex ?? 0,
          end_index: chunk.end ?? chunk.end_index ?? chunk.endIndex ?? 0,
          score: chunk.score ?? result.score,
        }),
      );
    }
  }

  result.matches.sort(
    (a: { score: number }, b: { score: number }) => b.score - a.score,
  );
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { matter_id, clause_type, document_ids } =
      (await req.json()) as LegalClassifyRequest;

    if (!matter_id || !clause_type) {
      return jsonResponse(
        { error: "matter_id and clause_type are required" },
        400,
      );
    }

    const isaacusApiKey = Deno.env.get("ISAACUS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!isaacusApiKey) {
      return jsonResponse({
        clause_type,
        matches: [],
        total_found: 0,
        searched_documents: 0,
        error: "Missing ISAACUS_API_KEY",
      } satisfies LegalClassifyResponse);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get documents to search
    let documents: { id: string; filename: string; extracted_text: string }[];

    if (document_ids?.length) {
      // Specific documents requested
      const { data, error } = await supabase
        .from("documents")
        .select("id, filename, extracted_text")
        .in("id", document_ids)
        .eq("processing_status", "ready");

      if (error) throw error;
      documents = data || [];
    } else {
      // Find relevant documents via embedding search
      let docIds: string[] = [];

      try {
        const embeddings = await embedTexts([clause_type], "retrieval/query");
        if (embeddings?.length) {
          const embeddingStr =
            "[" + embeddings[0].map(String).join(",") + "]";

          const { data: chunks } = await supabase.rpc(
            "hybrid_search_chunks",
            {
              query_embedding: embeddingStr,
              query_text: clause_type,
              matter_uuid: matter_id,
              semantic_weight: 0.7,
              match_threshold: 0.3,
              match_count: 20,
              include_context: false,
            },
          );

          if (chunks?.length) {
            docIds = [
              ...new Set(
                chunks
                  .map((c: Record<string, string>) => c.document_id)
                  .filter(Boolean),
              ),
            ] as string[];
          }
        }
      } catch {
        // Fall through to all-documents query
      }

      if (docIds.length) {
        const { data, error } = await supabase
          .from("documents")
          .select("id, filename, extracted_text")
          .in("id", docIds.slice(0, 5))
          .eq("processing_status", "ready");

        if (error) throw error;
        documents = data || [];
      } else {
        const { data, error } = await supabase
          .from("documents")
          .select("id, filename, extracted_text")
          .eq("matter_id", matter_id)
          .eq("processing_status", "ready");

        if (error) throw error;
        documents = data || [];
      }
    }

    if (!documents.length) {
      return jsonResponse({
        clause_type,
        matches: [],
        total_found: 0,
        searched_documents: 0,
        message: "No documents found in matter",
      } satisfies LegalClassifyResponse);
    }

    // Step 2: Run IQL on each document
    const allMatches: ClauseMatch[] = [];
    const iqlQuery = `{IS ${clause_type}}`;

    for (const doc of documents) {
      if (!doc.extracted_text?.trim()) continue;

      try {
        const result = await classifyIql(iqlQuery, doc.extracted_text);

        for (const match of result.matches) {
          const startIdx = match.start_index;
          const endIdx = match.end_index;
          const permalink = `cite:${doc.id}@${startIdx}-${endIdx}`;

          allMatches.push({
            text: match.text,
            score: match.score,
            citation: {
              formatted: doc.filename,
              permalink,
              markdown: `[${doc.filename}](${permalink})`,
              document_id: doc.id,
              start: startIdx,
              end: endIdx,
            },
          });
        }
      } catch (err) {
        console.error(`IQL error on ${doc.filename}:`, err);
      }
    }

    // Sort by score descending
    allMatches.sort((a, b) => b.score - a.score);

    // Group by document
    const matchesByDoc: Record<
      string,
      { filename: string; count: number }
    > = {};
    for (const match of allMatches) {
      const docId = match.citation.document_id;
      if (!matchesByDoc[docId]) {
        matchesByDoc[docId] = {
          filename: match.citation.formatted,
          count: 0,
        };
      }
      matchesByDoc[docId].count++;
    }

    // Build usage hint
    let usageHint = "";
    if (allMatches.length) {
      if (Object.keys(matchesByDoc).length > 1) {
        const docSummary = Object.values(matchesByDoc)
          .map((info) => `${info.filename} (${info.count})`)
          .join(", ");
        usageHint = `Found ${allMatches.length} total matches across ${Object.keys(matchesByDoc).length} documents: ${docSummary}. List ALL matches grouped by document.`;
      } else {
        const firstDoc = Object.values(matchesByDoc)[0];
        usageHint = `Found ${allMatches.length} matches in ${firstDoc.filename}. List ALL ${allMatches.length} matches with citations.`;
      }
    }

    return jsonResponse({
      clause_type,
      matches: allMatches,
      total_found: allMatches.length,
      searched_documents: documents.length,
      matches_by_document: matchesByDoc,
      _usage_hint: usageHint,
      _instruction: `List ALL ${allMatches.length} matches found. If multiple documents, group by document name.`,
    } satisfies LegalClassifyResponse);
  } catch (error) {
    console.error("Legal classify error:", error);
    return jsonResponse(
      {
        clause_type: "",
        matches: [],
        total_found: 0,
        searched_documents: 0,
        error: String(error),
      } satisfies LegalClassifyResponse,
      500,
    );
  }
});
