/**
 * TypeScript types for Document Ingestion & Legal Grounding feature.
 */

/**
 * Represents a hierarchical section within a document.
 */
export interface DocumentSection {
  id: string;
  document_id: string;
  parent_section_id: string | null;
  section_number: string | null;
  title: string | null;
  level: number;
  sequence: number;
  path: string[];
  start_page: number | null;
  end_page: number | null;
  created_at: string;
  /** Nested children for tree rendering */
  children?: DocumentSection[];
}

/**
 * Structural citation data stored with each chunk.
 */
export interface Citation {
  page: number;
  section_path: string[];
  paragraph_index: number | null;
  heading: string | null;
  context_before: string | null;
  context_after: string | null;
}

/**
 * Represents an embedded document chunk with citations.
 */
export interface DocumentChunk {
  id: string;
  document_id: string;
  section_id: string | null;
  parent_chunk_id: string | null;
  chunk_level: "section" | "paragraph";
  chunk_index: number;
  content: string;
  content_hash: string;
  embedding_model: string;
  citation: Citation;
  created_at: string;
}

/**
 * Search result with score and optional parent context.
 */
export interface SearchResult {
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

/**
 * Formatted citation for display.
 */
export interface FormattedCitation {
  /** Short format: "Contract.pdf, p.12, § 7.2" */
  short: string;
  /** Full format: "Master Services Agreement (Contract.pdf), Page 12, Section 7.2 Governing Law" */
  full: string;
  /** Link to document viewer with section highlight */
  link: string;
}

/**
 * Search request options.
 */
export interface SearchOptions {
  semantic_weight?: number;
  match_count?: number;
  match_threshold?: number;
  include_context?: boolean;
  document_id?: string;
}

/**
 * Search API response.
 */
export interface SearchResponse {
  query: string;
  matter_id: string;
  results: Array<SearchResult & { formatted_citation: FormattedCitation }>;
  total_count: number;
  search_type: "hybrid" | "semantic" | "keyword";
}

/**
 * Document structure API response.
 */
export interface DocumentStructureResponse {
  document_id: string;
  filename: string;
  structure_extracted: boolean;
  sections: DocumentSection[];
}

/**
 * Chunk with context for citation verification.
 */
export interface ChunkWithContext {
  chunk: {
    id: string;
    content: string;
    citation: Citation;
    content_hash: string;
  };
  verified: boolean;
  document: {
    id: string;
    filename: string;
    storage_path: string;
  };
  context: {
    parent_content: string | null;
    siblings: Array<{
      id: string;
      content: string;
      chunk_index: number;
    }>;
  };
}

/**
 * Processing status for documents.
 */
export type ProcessingStatus =
  | "pending"
  | "extracting"
  | "structuring"
  | "embedding"
  | "ready"
  | "error";

/**
 * Extended document type with new fields.
 */
export interface DocumentWithStructure {
  id: string;
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  extracted_text: string | null;
  normalized_markdown: string | null;
  structure_extracted: boolean;
  extraction_quality: number | null;
  processing_status: ProcessingStatus;
  error_message: string | null;
  uploaded_by: string;
  uploaded_at: string;
  processed_at: string | null;
}
