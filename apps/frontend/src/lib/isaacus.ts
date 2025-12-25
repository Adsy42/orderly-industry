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
  /** Start position relative to the input text */
  startIndex?: number;
  /** End position relative to the input text */
  endIndex?: number;
}

/**
 * A sentence with its position in the source text.
 */
export interface SentenceWithPosition {
  text: string;
  start: number;
  end: number;
  index: number;
}

/**
 * Split text into sentences with their character positions.
 *
 * Handles common abbreviations to avoid false sentence breaks.
 * Each sentence includes its start/end position relative to the input text.
 *
 * @param text - Text to segment into sentences
 * @returns Array of sentences with positions
 */
export function segmentSentences(text: string): SentenceWithPosition[] {
  const sentences: SentenceWithPosition[] = [];

  // Common legal/business abbreviations that shouldn't trigger sentence breaks
  const abbreviationPattern =
    /\b(?:Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Corp|Jr|Sr|etc|vs|e\.g|i\.e|No|Art|Sec|Vol|Rev|Ed|al|cf|approx|est|min|max)\./gi;

  // Create a working copy with abbreviation periods replaced by placeholders
  let workingText = text;
  const replacements: Array<{ start: number; length: number }> = [];

  let match;
  while ((match = abbreviationPattern.exec(text)) !== null) {
    replacements.push({ start: match.index, length: match[0].length });
  }

  // Replace abbreviation periods with a placeholder character (¶) that won't match sentence end
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, length } = replacements[i];
    const abbrev = workingText.slice(start, start + length);
    // Replace the period at the end with placeholder
    workingText =
      workingText.slice(0, start) +
      abbrev.slice(0, -1) +
      "¶" +
      workingText.slice(start + length);
  }

  // Split on sentence-ending punctuation followed by whitespace or end of string
  // This regex captures the sentence including its ending punctuation
  const sentenceEndPattern = /[^.!?]*[.!?]+(?:\s+|$)|[^.!?]+$/g;

  let sentenceMatch;
  while ((sentenceMatch = sentenceEndPattern.exec(workingText)) !== null) {
    let sentenceText = sentenceMatch[0];
    const start = sentenceMatch.index;
    const end = start + sentenceText.length;

    // Restore placeholder back to periods
    sentenceText = sentenceText.replace(/¶/g, ".");

    // Get the actual text from the original (not the working copy)
    const originalText = text.slice(start, end).trim();

    if (originalText.length > 0) {
      // Find the actual start position (skip leading whitespace)
      const leadingWhitespace = text.slice(start).match(/^\s*/)?.[0].length || 0;
      const actualStart = start + leadingWhitespace;
      const actualEnd = actualStart + originalText.length;

      sentences.push({
        text: originalText,
        start: actualStart,
        end: actualEnd,
        index: sentences.length,
      });
    }
  }

  return sentences;
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
 * Extract the precise clause/sentence from a chunk using LLM with sentence-based selection.
 *
 * Uses GPT-4o-mini to identify which sentence(s) from a pre-segmented list
 * are MOST RELEVANT to the IQL query. The key insight is that IQL has already
 * determined this chunk is semantically relevant - the LLM's job is to find
 * the BEST sentences, not to re-validate relevance.
 *
 * @param chunkText - The text chunk from IQL classification (already semantically matched)
 * @param queryType - What we're looking for (e.g., "termination clause", "confidentiality provision")
 * @param chunkStartOffset - Start position of the chunk in the original document (for position mapping)
 * @returns Extracted clause with confidence, reasoning, and positions
 */
export async function extractClauseWithLLM(
  chunkText: string,
  queryType: string,
  chunkStartOffset: number = 0,
): Promise<LLMExtractionResult> {
  const openai = getOpenAIClient();

  // First, segment the text into sentences
  const sentences = segmentSentences(chunkText);

  if (sentences.length === 0) {
    return { clause: "", confidence: 0 };
  }

  // If only one sentence, return it directly with high confidence
  if (sentences.length === 1) {
    return {
      clause: sentences[0].text,
      confidence: 0.8,
      startIndex: chunkStartOffset + sentences[0].start,
      endIndex: chunkStartOffset + sentences[0].end,
    };
  }

  // For 2-3 sentences, just return all of them - they're likely all relevant
  if (sentences.length <= 3) {
    const combinedText = sentences.map((s) => s.text).join(" ");
    return {
      clause: combinedText,
      confidence: 0.7,
      reasoning: "Short chunk - all sentences included",
      startIndex: chunkStartOffset + sentences[0].start,
      endIndex: chunkStartOffset + sentences[sentences.length - 1].end,
    };
  }

  // Present numbered sentences to the LLM
  const numberedSentences = sentences
    .map((s, i) => `[${i}] ${s.text}`)
    .join("\n\n");

  // Key change: The prompt now emphasizes that this chunk was ALREADY identified
  // as semantically relevant by IQL - the LLM should find the CORE sentences,
  // not re-validate relevance
  const systemPrompt = `You are a legal document analyst specializing in clause extraction.

IMPORTANT CONTEXT: The text you're analyzing has ALREADY been identified by a semantic search system as containing or relating to the requested provision. Your job is NOT to determine if it's relevant - it already is. Your job is to find the 1-3 sentences that form the CORE of this provision.

Rules:
1. ALWAYS return at least one sentence index - the chunk is already known to be relevant
2. Pick the 1-3 most central sentences that capture the key legal meaning
3. If the provision clearly spans multiple consecutive sentences, include them all
4. Prefer fewer, more focused sentences over many sentences
5. Respond in JSON format`;

  const userPrompt = `This text chunk has been semantically matched to "${queryType}". 
Find the 1-3 sentences that are MOST CENTRAL to this concept.

Sentences:
${numberedSentences}

Return JSON: { "indices": [0], "confidence": 0.0-1.0, "reasoning": "brief explanation" }
- indices: array of sentence indices (0-based) - MUST include at least one
- confidence: how well these sentences capture the ${queryType} (0.0-1.0)
- reasoning: brief explanation of your choice`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      // Fallback: return first 2 sentences as reasonable default
      return createFallbackResult(sentences, chunkStartOffset, "LLM returned no content");
    }

    const parsed = JSON.parse(content);
    const indices: number[] = parsed.indices || [];
    const confidence: number = parsed.confidence || 0.5; // Default to 0.5, not 0

    // If LLM returned empty indices despite our instructions, use fallback
    if (indices.length === 0) {
      console.log(
        `[LLM Extraction] LLM returned empty indices despite instructions, using fallback. Reasoning: ${parsed.reasoning}`,
      );
      return createFallbackResult(
        sentences,
        chunkStartOffset,
        parsed.reasoning || "LLM found no match, using first sentences",
      );
    }

    // Filter valid indices and sort them
    const validIndices = indices
      .filter((i: number) => i >= 0 && i < sentences.length)
      .sort((a: number, b: number) => a - b);

    if (validIndices.length === 0) {
      return createFallbackResult(
        sentences,
        chunkStartOffset,
        "All indices were invalid",
      );
    }

    // Combine selected sentences
    const selectedSentences = validIndices.map((i: number) => sentences[i]);
    const combinedText = selectedSentences.map((s) => s.text).join(" ");

    // Calculate positions from first to last selected sentence
    const firstSentence = selectedSentences[0];
    const lastSentence = selectedSentences[selectedSentences.length - 1];

    return {
      clause: combinedText,
      confidence: Math.max(confidence, 0.4), // Ensure minimum confidence since chunk is known-relevant
      reasoning: parsed.reasoning,
      startIndex: chunkStartOffset + firstSentence.start,
      endIndex: chunkStartOffset + lastSentence.end,
    };
  } catch (error) {
    console.error("[LLM Extraction] Error:", error);
    return createFallbackResult(sentences, chunkStartOffset, `Error: ${error}`);
  }
}

/**
 * Create a fallback extraction result when LLM fails or returns empty.
 * Uses a heuristic to pick the first 1-2 sentences which are often
 * the most relevant in legal text.
 */
function createFallbackResult(
  sentences: SentenceWithPosition[],
  chunkStartOffset: number,
  reasoning: string,
): LLMExtractionResult {
  // Take up to first 2 sentences as a reasonable fallback
  const count = Math.min(2, sentences.length);
  const selectedSentences = sentences.slice(0, count);
  const combinedText = selectedSentences.map((s) => s.text).join(" ");

  return {
    clause: combinedText,
    confidence: 0.4, // Lower confidence for fallback, but still above threshold
    reasoning: `Fallback: ${reasoning}`,
    startIndex: chunkStartOffset + selectedSentences[0].start,
    endIndex:
      chunkStartOffset + selectedSentences[selectedSentences.length - 1].end,
  };
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
