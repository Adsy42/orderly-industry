/**
 * Shared Isaacus client for frontend API routes.
 *
 * Provides a consistent interface for all Isaacus services:
 * - Embedding (vectorization)
 * - Reranking (search result quality improvement)
 * - Extractive QA (precise answer extraction)
 * - Universal Classification (IQL queries)
 *
 * @see https://docs.isaacus.com
 */

import { Isaacus, APIError } from "isaacus";

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
  const client = getIsaacusClient();

  try {
    // TypeScript SDK may not have proper types for embeddings
    // Using type assertion as the runtime API should work
    const response = await (client as any).embeddings.create({
      model,
      texts,
      task,
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error("No embeddings returned from Isaacus API");
    }

    return response.embeddings.map((e: any) => e.embedding);
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(
        `Isaacus embedding error (${error.status}): ${error.message}`,
      );
    }
    throw error;
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
  const client = getIsaacusClient();

  try {
    // TypeScript SDK may not have proper types for rerankings
    const response = await (client as any).rerankings.create({
      model,
      query,
      texts,
    });

    const results = response.results.map((r: any) => ({
      index: r.index,
      score: r.score,
      text: texts[r.index],
    }));

    return topK ? results.slice(0, topK) : results;
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(
        `Isaacus reranking error (${error.status}): ${error.message}`,
      );
    }
    throw error;
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
 * @param question - Question to answer
 * @param context - Text context to search for answer
 * @param model - Extraction model to use
 * @returns Extracted answer with confidence score
 */
export async function extract(
  question: string,
  context: string,
  model: ExtractModel = "kanon-answer-extractor",
): Promise<ExtractionResult> {
  const client = getIsaacusClient();

  try {
    // TypeScript SDK may not have proper types for extractions
    const response = await (client as any).extractions.qa.create({
      model,
      question,
      context,
    });

    return {
      answer: response.answer || "",
      confidence: (response as any).confidence || 1.0,
      start: (response as any).start,
      end: (response as any).end,
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(
        `Isaacus extraction error (${error.status}): ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Re-export APIError for error handling in API routes.
 */
export { APIError };
