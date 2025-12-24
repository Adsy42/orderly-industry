/**
 * TypeScript types for IQL (Isaacus Query Language) feature.
 */

export interface IQLQueryResult {
  query: string;
  documentId: string;
  documentName: string;
  score: number;
  matches: IQLMatch[];
  executedAt: string;
  model: string;
}

export interface IQLMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
  chunkIndex?: number;
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
