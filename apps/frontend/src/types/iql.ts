/**
 * TypeScript types for IQL (Isaacus Query Language) feature.
 */

export interface IQLQueryResult {
  query: string;
  documentId: string;
  documentName: string;
  matterId: string;
  score: number;
  matches: IQLMatch[];
  executedAt: string;
  model: string;
  /** Translated IQL query if query was translated from natural language */
  translatedIQL?: string;
}

export interface IQLMatchCitation {
  /** Display name (usually filename) */
  formatted: string;
  /** cite:documentId@start-end */
  permalink: string;
  /** Markdown link: [filename](cite:documentId@start-end) */
  markdown: string;
  documentId: string;
  start: number;
  end: number;
}

export interface IQLMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
  chunkIndex?: number;
  /** Full chunk text for context (when QA extraction is used) */
  chunkText?: string;
  /** Start position of the chunk in the document */
  chunkStart?: number;
  /** End position of the chunk in the document */
  chunkEnd?: number;
  citation?: IQLMatchCitation;
}

export interface SavedIQLQuery {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  query_string: string;
  matter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface IQLTemplate {
  name: string;
  displayName: string;
  description: string;
  requiresParameter: boolean;
  parameterName?: string;
  example: string;
  modelTokens: {
    "kanon-universal-classifier": number;
    "kanon-universal-classifier-mini": number;
  };
  category: string;
}

export interface IQLValidationResult {
  valid: boolean;
  error?: string;
  suggestions?: string[];
  warnings?: string[];
}

export interface NlToIqlTranslation {
  iql: string;
  explanation: string;
  templatesUsed: string[];
  confidence: number;
}
