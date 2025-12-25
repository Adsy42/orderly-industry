/**
 * Shared Isaacus client for frontend API routes.
 *
 * Provides a consistent interface for all Isaacus services:
 * - Embedding (vectorization)
 * - Reranking (search result quality improvement)
 * - Extractive QA (precise answer extraction)
 * - Universal Classification (IQL queries)
 * - LLM-based clause extraction (via OpenAI)
 *
 * @see https://docs.isaacus.com
 */

import { Isaacus, APIError } from "isaacus";
import OpenAI from "openai";

// Get configuration from environment
const ISAACUS_API_KEY = process.env.ISAACUS_API_KEY;

/**
 * Isaacus embedding task types.
 * - retrieval/query: For search queries
 * - retrieval/document: For document indexing
 */
export type EmbeddingTask = "retrieval/query" | "retrieval/document";

/**
 * Isaacus model types.
 */
export type EmbeddingModel = "kanon-2-embedder";
export type ClassificationModel =
  | "kanon-universal-classifier"
  | "kanon-universal-classifier-mini";
export type ExtractModel =
  | "kanon-answer-extractor"
  | "kanon-answer-extractor-mini";

/**
 * Result from embedding operation.
 */
export interface EmbeddingResult {
  embeddings: number[][];
}

/**
 * Single reranking result.
 */
export interface RerankResult {
  index: number;
  score: number;
  text?: string;
}

/**
 * Result from reranking operation.
 */
export interface RerankingResult {
  results: RerankResult[];
}

/**
 * Single match from IQL/classification query.
 */
export interface ClassificationMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

/**
 * Result from IQL/classification query.
 */
export interface ClassificationResult {
  score: number;
  matches: ClassificationMatch[];
}

/**
 * Result from extractive QA.
 */
export interface ExtractionResult {
  answer: string;
  confidence: number;
  start?: number;
  end?: number;
}

/**
 * Get or create an Isaacus client instance.
 * Throws if API key is not configured.
 */
export function getIsaacusClient(): Isaacus {
  if (!ISAACUS_API_KEY) {
    throw new Error("ISAACUS_API_KEY environment variable is not configured");
  }
  return new Isaacus({ apiKey: ISAACUS_API_KEY });
}

/**
 * Generate embeddings for texts.
 *
 * @param texts - Array of text strings to embed
 * @param task - Embedding task type (retrieval/query or retrieval/document)
 * @param model - Embedding model to use
 * @returns Array of embedding vectors (1792 dimensions each for kanon-2-embedder)
 */
export async function embed(
  texts: string[],
  task: EmbeddingTask = "retrieval/document",
  model: EmbeddingModel = "kanon-2-embedder",
): Promise<number[][]> {
  if (!ISAACUS_API_KEY) {
    throw new Error("ISAACUS_API_KEY environment variable is not configured");
  }

  try {
    // Direct HTTP call since TypeScript SDK v0.1.3 doesn't support embeddings yet
    // SDK only has classifications.universal.create
    const response = await fetch("https://api.isaacus.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ISAACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        texts,
        task,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Isaacus API error (${response.status}): ${errorData.message || response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.embeddings || data.embeddings.length === 0) {
      throw new Error("No embeddings returned from Isaacus API");
    }

    return data.embeddings.map((e: any) => e.embedding);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Isaacus embedding error: ${error}`);
  }
}

/**
 * Rerank texts by relevance to a query.
 *
 * @param query - Search query
 * @param texts - Array of texts to rerank
 * @param topK - Optional limit on returned results
 * @param model - Classification model to use for reranking
 * @returns Sorted array of results with index, score, and original text
 */
export async function rerank(
  query: string,
  texts: string[],
  topK?: number,
  model: ClassificationModel = "kanon-universal-classifier",
): Promise<RerankResult[]> {
  if (!ISAACUS_API_KEY) {
    throw new Error("ISAACUS_API_KEY environment variable is not configured");
  }

  try {
    // Direct HTTP call since TypeScript SDK v0.1.3 doesn't support reranking yet
    const response = await fetch("https://api.isaacus.com/v1/rerankings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ISAACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        query,
        texts,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Isaacus API error (${response.status}): ${errorData.message || response.statusText}`,
      );
    }

    const data = await response.json();
    const results = data.results.map((r: any) => ({
      index: r.index,
      score: r.score,
      text: texts[r.index],
    }));

    return topK ? results.slice(0, topK) : results;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Isaacus reranking error: ${error}`);
  }
}

/**
 * Helper to extract start index from various API response formats.
 * Isaacus API may return 'start', 'start_index', or 'startIndex'.
 */
function extractStartIndex(obj: Record<string, unknown>): number {
  return (
    (obj.start as number) ??
    (obj.start_index as number) ??
    (obj.startIndex as number) ??
    0
  );
}

/**
 * Helper to extract end index from various API response formats.
 * Isaacus API may return 'end', 'end_index', or 'endIndex'.
 */
function extractEndIndex(obj: Record<string, unknown>): number {
  return (
    (obj.end as number) ??
    (obj.end_index as number) ??
    (obj.endIndex as number) ??
    0
  );
}

/**
 * Execute IQL query against document text using Universal Classification.
 *
 * Isaacus automatically handles chunking for long documents and returns
 * character positions relative to the original document.
 *
 * @param query - IQL query string (e.g., "{IS confidentiality clause}")
 * @param text - Full document text to analyze
 * @param model - Classification model to use
 * @returns Score and array of matches with positions (using camelCase: startIndex, endIndex)
 *
 * @see https://docs.isaacus.com/iql/introduction
 */
export async function classifyIQL(
  query: string,
  text: string,
  model: ClassificationModel = "kanon-universal-classifier",
): Promise<ClassificationResult> {
  const client = getIsaacusClient();

  try {
    // Use type assertion since IQL response differs from standard classification
    // TypeScript SDK may not have proper types for classifications
    const response = (await (client as any).classifications.universal.create({
      model,
      query,
      texts: [text],
    } as Record<string, unknown>)) as Record<string, unknown>;

    let score = 0;
    let matches: ClassificationMatch[] = [];

    // Handle classifications array response format (primary format)
    const classifications = response.classifications as
      | Array<Record<string, unknown>>
      | undefined;
    if (classifications && Array.isArray(classifications)) {
      const classification = classifications[0];
      if (classification) {
        score = (classification.score as number) || 0;

        // Extract chunks as matches
        const chunks = classification.chunks as
          | Array<Record<string, unknown>>
          | undefined;
        if (chunks && Array.isArray(chunks)) {
          matches = chunks.map(
            (chunk: Record<string, unknown>): ClassificationMatch => ({
              text: (chunk.text as string) || "",
              startIndex: extractStartIndex(chunk),
              endIndex: extractEndIndex(chunk),
              score: (chunk.score as number) ?? score,
            }),
          );
        }
      }
    }
    // Fallback: direct score/matches format
    else if (response.score !== undefined) {
      score = (response.score as number) || 0;
      const responseMatches = response.matches as
        | Array<Record<string, unknown>>
        | undefined;
      if (responseMatches && Array.isArray(responseMatches)) {
        matches = responseMatches.map(
          (match: Record<string, unknown>): ClassificationMatch => ({
            text: (match.text as string) || "",
            startIndex: extractStartIndex(match),
            endIndex: extractEndIndex(match),
            score: (match.score as number) ?? score,
          }),
        );
      }
    }

    // Sort matches by score descending
    matches.sort((a, b) => b.score - a.score);

    return { score, matches };
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(
        `Isaacus classification error (${error.status}): ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Extract answer from context using Extractive QA.
 *
 * @param query - Question/query to answer
 * @param texts - Array of text passages to search for answers (or single string)
 * @param model - Extraction model to use
 * @returns Extracted answer with confidence score and positions
 */
export async function extract(
  query: string,
  texts: string | string[],
  model: ExtractModel = "kanon-answer-extractor",
): Promise<ExtractionResult> {
  if (!ISAACUS_API_KEY) {
    throw new Error("ISAACUS_API_KEY environment variable is not configured");
  }

  // Normalize to array
  const textsArray = Array.isArray(texts) ? texts : [texts];

  try {
    // Direct HTTP call since TypeScript SDK v0.1.3 doesn't support extractions yet
    // Use correct field names: "query" and "texts" (array)
    const response = await fetch("https://api.isaacus.com/v1/extractions/qa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ISAACUS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        query,
        texts: textsArray,
        ignore_inextractability: true,
        top_k: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Isaacus API error (${response.status}): ${errorData.message || response.statusText}`,
      );
    }

    const data = await response.json();

    // Parse response structure:
    // { extractions: [{ index, inextractability_score, answers: [{ text, start, end, score }] }] }
    if (!data.extractions || data.extractions.length === 0) {
      return { answer: "", confidence: 0 };
    }

    // Find best answer across all texts
    let bestAnswer: {
      text: string;
      start: number;
      end: number;
      score: number;
    } | null = null;
    let bestScore = -1;

    for (const extraction of data.extractions) {
      if (extraction.answers && extraction.answers.length > 0) {
        for (const answer of extraction.answers) {
          if (answer.score > bestScore) {
            bestScore = answer.score;
            bestAnswer = answer;
          }
        }
      }
    }

    if (!bestAnswer) {
      return { answer: "", confidence: 0 };
    }

    return {
      answer: bestAnswer.text,
      confidence: bestAnswer.score,
      start: bestAnswer.start,
      end: bestAnswer.end,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Isaacus extraction error: ${error}`);
  }
}

/**
 * Result from LLM-based clause extraction.
 */
export interface LLMExtractionResult {
  clause: string;
  confidence: number;
  reasoning?: string;
}

/**
 * Get or create an OpenAI client instance.
 * Throws if API key is not configured.
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured");
  }
  return new OpenAI({ apiKey });
}

/**
 * Extract the precise clause/sentence from a chunk using LLM.
 *
 * Uses GPT-4o-mini to identify and extract the most relevant sentence
 * that matches the IQL query from a larger text chunk.
 *
 * @param chunkText - The text chunk from IQL classification
 * @param queryType - What we're looking for (e.g., "termination clause", "confidentiality provision")
 * @returns Extracted clause with confidence and optional reasoning
 */
export async function extractClauseWithLLM(
  chunkText: string,
  queryType: string,
): Promise<LLMExtractionResult> {
  const openai = getOpenAIClient();

  const systemPrompt = `You are a legal document analyst. Your task is to extract the single most relevant sentence or clause from the provided text that best represents the requested legal provision.

Rules:
1. Return ONLY the exact text from the document - do not paraphrase or summarize
2. Extract the complete sentence or clause, not a fragment
3. If multiple sentences are relevant, choose the most specific one
4. If no relevant clause is found, return an empty string
5. Respond in JSON format with "clause" and "confidence" (0-1) fields`;

  const userPrompt = `Extract the ${queryType} from this text:

"""
${chunkText}
"""

Return JSON: { "clause": "exact extracted text", "confidence": 0.0-1.0 }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { clause: "", confidence: 0 };
    }

    const parsed = JSON.parse(content);
    return {
      clause: parsed.clause || "",
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("[LLM Extraction] Error:", error);
    return { clause: "", confidence: 0 };
  }
}

/**
 * Find the position of extracted clause within the original chunk.
 *
 * @param chunk - Original text chunk
 * @param clause - Extracted clause text
 * @param chunkStart - Start position of chunk in the full document
 * @returns Start and end positions relative to the full document
 */
export function findClausePosition(
  chunk: string,
  clause: string,
  chunkStart: number,
): { start: number; end: number } | null {
  if (!clause) return null;

  // Direct match
  const index = chunk.indexOf(clause);
  if (index !== -1) {
    return {
      start: chunkStart + index,
      end: chunkStart + index + clause.length,
    };
  }

  // Fuzzy match - try to find the clause with minor variations
  // (handles cases where LLM might have slight whitespace differences)
  const normalizedClause = clause.trim().replace(/\s+/g, " ");
  const normalizedChunk = chunk.replace(/\s+/g, " ");
  const normalizedIndex = normalizedChunk.indexOf(normalizedClause);

  if (normalizedIndex !== -1) {
    // Find the actual position in the original chunk
    // by counting characters up to the normalized position
    let originalPos = 0;
    let normalizedPos = 0;
    while (normalizedPos < normalizedIndex && originalPos < chunk.length) {
      if (/\s/.test(chunk[originalPos])) {
        // Skip multiple whitespace in original
        while (
          originalPos < chunk.length - 1 &&
          /\s/.test(chunk[originalPos + 1])
        ) {
          originalPos++;
        }
      }
      originalPos++;
      normalizedPos++;
    }

    return {
      start: chunkStart + originalPos,
      end: chunkStart + originalPos + clause.length,
    };
  }

  return null;
}

/**
 * Re-export APIError for error handling in API routes.
 */
export { APIError };
