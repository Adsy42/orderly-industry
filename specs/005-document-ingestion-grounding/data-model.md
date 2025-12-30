# Data Model: Document Ingestion & Legal Grounding

**Feature**: 005-document-ingestion-grounding
**Date**: 2024-12-25

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA MODEL                                      │
│                                                                              │
│  ┌─────────────┐       ┌─────────────────┐       ┌─────────────────────┐    │
│  │  documents  │───────│document_sections│───────│  document_chunks    │    │
│  │  (existing) │  1:N  │    (NEW)        │  1:N  │    (ENHANCED)       │    │
│  └─────────────┘       └─────────────────┘       └─────────────────────┘    │
│        │                       │                          │                  │
│        │                       │ self-reference           │ self-reference   │
│        │                       │ (parent_section_id)      │ (parent_chunk_id)│
│        │                       ▼                          ▼                  │
│        │               ┌─────────────────┐       ┌─────────────────────┐    │
│        │               │ child sections  │       │   child chunks      │    │
│        │               └─────────────────┘       └─────────────────────┘    │
│        │                                                                     │
│        │  Extended fields:                                                   │
│        │  + normalized_markdown (text)                                       │
│        │  + structure_extracted (boolean)                                    │
│        │  + extraction_quality (float)                                       │
└────────┴─────────────────────────────────────────────────────────────────────┘
```

## Entity Definitions

### documents (EXTENDED)

Existing table with new fields for normalized content and structure tracking.

| Column                | Type        | Constraints                   | Description                  |
| --------------------- | ----------- | ----------------------------- | ---------------------------- |
| `id`                  | uuid        | PK, DEFAULT gen_random_uuid() | Document identifier          |
| `matter_id`           | uuid        | FK → matters(id), NOT NULL    | Parent matter                |
| `storage_path`        | text        | NOT NULL                      | Supabase Storage path        |
| `filename`            | text        | NOT NULL                      | Original filename            |
| `file_type`           | text        | NOT NULL                      | pdf, docx, txt               |
| `file_size`           | bigint      | NOT NULL                      | Size in bytes                |
| `mime_type`           | text        |                               | MIME type                    |
| `extracted_text`      | text        |                               | Raw extracted text           |
| `normalized_markdown` | text        | **NEW**                       | Clean markdown for LLM       |
| `structure_extracted` | boolean     | **NEW**, DEFAULT false        | Structure detection complete |
| `extraction_quality`  | float       | **NEW**                       | 0-1 confidence score         |
| `processing_status`   | text        | NOT NULL, DEFAULT 'pending'   | Processing state             |
| `error_message`       | text        |                               | Error details                |
| `uploaded_by`         | uuid        | FK → profiles(id), NOT NULL   | Uploader                     |
| `uploaded_at`         | timestamptz | NOT NULL, DEFAULT now()       | Upload timestamp             |
| `processed_at`        | timestamptz |                               | Processing completion        |

**Updated Constraints**:

```sql
-- Extended processing status enum
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_processing_status_valid;
ALTER TABLE documents ADD CONSTRAINT documents_processing_status_valid CHECK (
  processing_status IN ('pending', 'extracting', 'structuring', 'embedding', 'ready', 'error')
);
```

---

### document_sections (NEW)

Hierarchical sections within a document (tree structure).

| Column              | Type        | Constraints                                    | Description                  |
| ------------------- | ----------- | ---------------------------------------------- | ---------------------------- |
| `id`                | uuid        | PK, DEFAULT gen_random_uuid()                  | Section identifier           |
| `document_id`       | uuid        | FK → documents(id) ON DELETE CASCADE, NOT NULL | Parent document              |
| `parent_section_id` | uuid        | FK → document_sections(id) ON DELETE CASCADE   | Parent section (null = root) |
| `section_number`    | text        |                                                | "7.2", "§ 512(c)", etc.      |
| `title`             | text        |                                                | Section heading text         |
| `level`             | int         | NOT NULL                                       | Hierarchy depth (1 = top)    |
| `sequence`          | int         | NOT NULL                                       | Order within parent          |
| `path`              | text[]      | NOT NULL                                       | Full path as array           |
| `start_page`        | int         |                                                | First page of section        |
| `end_page`          | int         |                                                | Last page of section         |
| `created_at`        | timestamptz | NOT NULL, DEFAULT now()                        | Creation timestamp           |

**Indexes**:

```sql
CREATE INDEX idx_sections_document ON document_sections(document_id);
CREATE INDEX idx_sections_parent ON document_sections(parent_section_id);
CREATE INDEX idx_sections_path ON document_sections USING gin(path);
```

**RLS Policies**:

```sql
-- Users can view sections for documents in accessible matters
CREATE POLICY "Users can view sections for accessible documents"
ON document_sections FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND public.user_can_access_matter(d.matter_id)
  )
);
```

---

### document_chunks (ENHANCED)

Extended from `document_embeddings` with hierarchical structure and citations.

| Column            | Type         | Constraints                                    | Description                           |
| ----------------- | ------------ | ---------------------------------------------- | ------------------------------------- |
| `id`              | uuid         | PK, DEFAULT gen_random_uuid()                  | Chunk identifier                      |
| `document_id`     | uuid         | FK → documents(id) ON DELETE CASCADE, NOT NULL | Parent document                       |
| `section_id`      | uuid         | FK → document_sections(id) ON DELETE CASCADE   | **NEW**: Associated section           |
| `parent_chunk_id` | uuid         | FK → document_chunks(id) ON DELETE CASCADE     | **NEW**: Parent chunk (for expansion) |
| `chunk_level`     | text         | NOT NULL, DEFAULT 'paragraph'                  | **NEW**: 'section' or 'paragraph'     |
| `chunk_index`     | int          | NOT NULL                                       | Order within document                 |
| `content`         | text         | NOT NULL                                       | Chunk text content                    |
| `content_hash`    | text         | NOT NULL                                       | **NEW**: SHA-256 for verification     |
| `embedding`       | vector(1792) | NOT NULL                                       | Isaacus Kanon 2 embedding             |
| `embedding_model` | text         | NOT NULL, DEFAULT 'kanon-2'                    | **NEW**: Model version                |
| `citation`        | jsonb        | NOT NULL                                       | **NEW**: Structural citation data     |
| `created_at`      | timestamptz  | NOT NULL, DEFAULT now()                        | Creation timestamp                    |

**Citation JSONB Schema**:

```json
{
  "page": 12,
  "section_path": ["7. Miscellaneous", "7.2 Governing Law"],
  "paragraph_index": 2,
  "heading": "### 7.2 Governing Law",
  "context_before": "...preceding 50 chars...",
  "context_after": "...following 50 chars..."
}
```

**Indexes**:

```sql
-- Vector similarity (HNSW for better performance)
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Keyword search (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_chunks_content_trgm ON document_chunks
  USING gin (content gin_trgm_ops);

-- Standard lookups
CREATE INDEX idx_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_chunks_section ON document_chunks(section_id);
CREATE INDEX idx_chunks_parent ON document_chunks(parent_chunk_id);
CREATE INDEX idx_chunks_level ON document_chunks(chunk_level);
```

**Constraints**:

```sql
ALTER TABLE document_chunks ADD CONSTRAINT chunks_level_valid
  CHECK (chunk_level IN ('section', 'paragraph'));

ALTER TABLE document_chunks ADD CONSTRAINT chunks_unique
  UNIQUE (document_id, chunk_index);
```

**RLS Policies**:

```sql
-- Users can view chunks for documents in accessible matters
CREATE POLICY "Users can view chunks for accessible documents"
ON document_chunks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_id
    AND public.user_can_access_matter(d.matter_id)
  )
);
```

---

## Database Functions

### hybrid_search_chunks

Combines vector similarity and keyword matching for search.

```sql
CREATE OR REPLACE FUNCTION public.hybrid_search_chunks(
  query_embedding vector(1792),
  query_text text,
  matter_uuid uuid,
  semantic_weight float DEFAULT 0.7,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  include_context boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  section_id uuid,
  parent_chunk_id uuid,
  content text,
  citation jsonb,
  filename text,
  score float,
  parent_content text
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_scores AS (
    SELECT
      dc.id,
      (1 - (dc.embedding <=> query_embedding)) as semantic_score
    FROM public.document_chunks dc
    JOIN public.documents d ON dc.document_id = d.id
    WHERE d.matter_id = matter_uuid
      AND d.processing_status = 'ready'
      AND dc.chunk_level = 'paragraph'
  ),
  keyword_scores AS (
    SELECT
      dc.id,
      similarity(dc.content, query_text) as keyword_score
    FROM public.document_chunks dc
    JOIN public.documents d ON dc.document_id = d.id
    WHERE d.matter_id = matter_uuid
      AND d.processing_status = 'ready'
      AND dc.chunk_level = 'paragraph'
      AND dc.content % query_text
  ),
  scored_chunks AS (
    SELECT
      dc.id,
      dc.document_id,
      dc.section_id,
      dc.parent_chunk_id,
      dc.content,
      dc.citation,
      d.filename,
      (
        COALESCE(ss.semantic_score, 0) * semantic_weight +
        COALESCE(ks.keyword_score, 0) * (1 - semantic_weight)
      ) as combined_score
    FROM public.document_chunks dc
    JOIN public.documents d ON dc.document_id = d.id
    LEFT JOIN semantic_scores ss ON dc.id = ss.id
    LEFT JOIN keyword_scores ks ON dc.id = ks.id
    WHERE d.matter_id = matter_uuid
      AND d.processing_status = 'ready'
      AND dc.chunk_level = 'paragraph'
      AND (ss.semantic_score IS NOT NULL OR ks.keyword_score IS NOT NULL)
  )
  SELECT
    sc.id,
    sc.document_id,
    sc.section_id,
    sc.parent_chunk_id,
    sc.content,
    sc.citation,
    sc.filename,
    sc.combined_score as score,
    CASE
      WHEN include_context AND sc.parent_chunk_id IS NOT NULL
      THEN parent.content
      ELSE NULL
    END as parent_content
  FROM scored_chunks sc
  LEFT JOIN public.document_chunks parent ON sc.parent_chunk_id = parent.id
  WHERE sc.combined_score > match_threshold
  ORDER BY sc.combined_score DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.hybrid_search_chunks IS
  'Hybrid semantic + keyword search for document chunks within a matter. Returns ranked results with optional parent context.';
```

### get_section_tree

Retrieves document sections as a hierarchical tree.

```sql
CREATE OR REPLACE FUNCTION public.get_section_tree(
  doc_uuid uuid
)
RETURNS TABLE (
  id uuid,
  parent_section_id uuid,
  section_number text,
  title text,
  level int,
  sequence int,
  path text[],
  start_page int,
  end_page int
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.id,
    ds.parent_section_id,
    ds.section_number,
    ds.title,
    ds.level,
    ds.sequence,
    ds.path,
    ds.start_page,
    ds.end_page
  FROM public.document_sections ds
  WHERE ds.document_id = doc_uuid
  ORDER BY ds.path;
END;
$$;
```

### get_chunk_with_context

Retrieves a chunk with its parent and sibling context.

```sql
CREATE OR REPLACE FUNCTION public.get_chunk_with_context(
  chunk_uuid uuid
)
RETURNS TABLE (
  chunk_id uuid,
  content text,
  citation jsonb,
  parent_content text,
  sibling_chunks jsonb
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id as chunk_id,
    dc.content,
    dc.citation,
    parent.content as parent_content,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', sib.id,
        'content', sib.content,
        'citation', sib.citation,
        'chunk_index', sib.chunk_index
      ) ORDER BY sib.chunk_index)
      FROM public.document_chunks sib
      WHERE sib.section_id = dc.section_id
        AND sib.chunk_level = 'paragraph'
        AND ABS(sib.chunk_index - dc.chunk_index) <= 2
        AND sib.id != dc.id
    ) as sibling_chunks
  FROM public.document_chunks dc
  LEFT JOIN public.document_chunks parent ON dc.parent_chunk_id = parent.id
  WHERE dc.id = chunk_uuid;
END;
$$;
```

---

## Migration Strategy

### Migration 1: Add document_sections table

```sql
-- 20251225000000_create_document_sections.sql
CREATE TABLE public.document_sections (...);
-- Indexes
-- RLS policies
```

### Migration 2: Enhance document_chunks (rename from document_embeddings)

```sql
-- 20251225000100_enhance_document_chunks.sql
-- Rename table
ALTER TABLE public.document_embeddings RENAME TO document_chunks;

-- Add new columns
ALTER TABLE public.document_chunks
  ADD COLUMN section_id uuid REFERENCES public.document_sections(id),
  ADD COLUMN parent_chunk_id uuid REFERENCES public.document_chunks(id),
  ADD COLUMN chunk_level text NOT NULL DEFAULT 'paragraph',
  ADD COLUMN content_hash text,
  ADD COLUMN embedding_model text NOT NULL DEFAULT 'kanon-2',
  ADD COLUMN citation jsonb NOT NULL DEFAULT '{}';

-- Rename chunk_text to content
ALTER TABLE public.document_chunks RENAME COLUMN chunk_text TO content;

-- Add indexes
-- Update RLS policies
```

### Migration 3: Extend documents table

```sql
-- 20251225000200_extend_documents.sql
ALTER TABLE public.documents
  ADD COLUMN normalized_markdown text,
  ADD COLUMN structure_extracted boolean NOT NULL DEFAULT false,
  ADD COLUMN extraction_quality float;

-- Update processing_status constraint
ALTER TABLE public.documents DROP CONSTRAINT documents_processing_status_valid;
ALTER TABLE public.documents ADD CONSTRAINT documents_processing_status_valid
  CHECK (processing_status IN ('pending', 'extracting', 'structuring', 'embedding', 'ready', 'error'));
```

### Migration 4: Create hybrid search function

```sql
-- 20251225000300_create_hybrid_search.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Create indexes
-- Create functions
```

---

## TypeScript Types

```typescript
// types/documents.ts

interface DocumentSection {
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
  children?: DocumentSection[];
}

interface Citation {
  page: number;
  section_path: string[];
  paragraph_index: number | null;
  heading: string | null;
  context_before: string | null;
  context_after: string | null;
}

interface DocumentChunk {
  id: string;
  document_id: string;
  section_id: string | null;
  parent_chunk_id: string | null;
  chunk_level: "section" | "paragraph";
  chunk_index: number;
  content: string;
  content_hash: string;
  citation: Citation;
  embedding?: number[];
}

interface SearchResult {
  id: string;
  document_id: string;
  content: string;
  citation: Citation;
  filename: string;
  score: number;
  parent_content?: string;
}

interface FormattedCitation {
  short: string; // "Contract.pdf, p.12, § 7.2"
  full: string; // "Master Services Agreement (Contract.pdf), Page 12, Section 7.2 Governing Law"
  link: string; // "/documents/{id}?page=12&section=7.2"
}
```



