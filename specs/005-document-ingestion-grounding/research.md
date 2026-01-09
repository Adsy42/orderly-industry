# Research: Document Ingestion & Legal Grounding

**Feature**: 005-document-ingestion-grounding
**Date**: 2024-12-25

## Research Questions Resolved

### 1. Isaacus Embedding Dimension

**Decision**: 1792 dimensions (Kanon 2 Embedder)

**Rationale**:

- Confirmed in existing migration `20251223150000_fix_embedding_dimension.sql`
- Already updated from 1536 to 1792 in the `document_embeddings` table
- Frontend and agent code reference 1792 dimensions

**Alternatives Considered**:

- 1536 (original schema) - incorrect for Kanon 2

---

### 2. How to Call Python `unstructured` from Next.js

**Decision**: Call Python agent via LangGraph SDK (existing pattern)

**Rationale**:

- Agent already deployed to LangSmith and callable from Next.js
- `unstructured` library is Python-only, requires Python runtime
- Follows existing architecture where Next.js → LangGraph SDK → Python agent
- Avoids subprocess complexity in Vercel serverless environment
- Maintains single deployment of Python dependencies

**Alternatives Considered**:

- Subprocess call (`child_process.spawn`) - Not viable on Vercel serverless
- Separate microservice - Over-engineering, adds infrastructure complexity
- Supabase Edge Function calling Python - Edge Functions are Deno, same limitation

**Implementation**:

```typescript
// Next.js API route calls agent tool via LangGraph SDK
import { Client } from "@langchain/langgraph-sdk";

const client = new Client({ apiUrl: process.env.LANGGRAPH_API_URL });
const result = await client.runs.create(
  null, // thread_id
  "deep_research",
  {
    input: {
      messages: [
        {
          role: "user",
          content: `Extract document structure for document_id: ${documentId}`,
        },
      ],
    },
  },
);
```

---

### 3. Document Structure Extraction Library

**Decision**: `unstructured` Python library

**Rationale**:

- Best-in-class for PDF/DOCX structure extraction
- Detects headings, paragraphs, tables, lists
- Preserves page numbers and hierarchical relationships
- Already used in enterprise document processing pipelines
- Open source with active development

**Alternatives Considered**:

- `mammoth` (Python) - DOCX only, no PDF support
- `PyMuPDF` - Good for PDF but no DOCX, less structure awareness
- `pdfminer.six` - Low-level PDF, no structure detection
- `docx2txt` - Too basic, loses structure

**Key Configuration**:

```python
from unstructured.partition.auto import partition

elements = partition(
    file_path,
    strategy="hi_res",  # Best structure detection
    include_page_breaks=True,
    include_metadata=True,
)
```

---

### 4. Hybrid Search Implementation

**Decision**: pgvector + pg_trgm in PostgreSQL function

**Rationale**:

- Both extensions available in Supabase
- Native PostgreSQL, no additional services
- Single query combines vector similarity and keyword matching
- Configurable weighting (default 70% semantic, 30% keyword)

**Alternatives Considered**:

- Elasticsearch - Adds infrastructure complexity
- Pinecone hybrid search - External service, cost
- Separate vector and keyword queries merged in app - More round trips

**Implementation Pattern**:

```sql
CREATE OR REPLACE FUNCTION search_documents_hybrid(
  query_embedding vector(1792),
  query_text text,
  matter_uuid uuid,
  semantic_weight float DEFAULT 0.7,
  match_count int DEFAULT 20
)
RETURNS TABLE (...) AS $$
  WITH semantic_scores AS (
    SELECT id, 1 - (embedding <=> query_embedding) as semantic_score
    FROM document_chunks
    WHERE matter_id = matter_uuid
  ),
  keyword_scores AS (
    SELECT id, similarity(content, query_text) as keyword_score
    FROM document_chunks
    WHERE matter_id = matter_uuid AND content % query_text
  )
  SELECT
    dc.*,
    (COALESCE(ss.semantic_score, 0) * semantic_weight +
     COALESCE(ks.keyword_score, 0) * (1 - semantic_weight)) as score
  FROM document_chunks dc
  LEFT JOIN semantic_scores ss ON dc.id = ss.id
  LEFT JOIN keyword_scores ks ON dc.id = ks.id
  ORDER BY score DESC
  LIMIT match_count;
$$;
```

---

### 5. Citation Storage Format

**Decision**: JSONB column with structured schema

**Rationale**:

- Flexible for different document types (contracts, case law, statutes)
- Queryable with PostgreSQL JSON operators
- Can evolve without schema migrations
- Supports nested structures (section path as array)

**Alternatives Considered**:

- Separate columns for each field - Rigid, requires migrations for changes
- Separate citation table - Over-normalized, adds joins

**Schema**:

```json
{
  "page": 12,
  "section_path": ["7. Miscellaneous", "7.2 Governing Law"],
  "paragraph_index": 2,
  "content_hash": "sha256:abc123...",
  "context_before": "...preceding text...",
  "context_after": "...following text..."
}
```

---

### 6. Parent-Child Chunk Relationship

**Decision**: Self-referencing foreign key in `document_chunks` table

**Rationale**:

- Simple, standard tree pattern in PostgreSQL
- Single table query with recursive CTE for full tree
- `chunk_level` field distinguishes section vs paragraph
- Parent chunks store full section content for context expansion

**Alternatives Considered**:

- Separate section and paragraph tables - More joins, complex queries
- Materialized path (ltree) - Overkill for 2-3 level hierarchy
- Nested set model - Complex updates on insertion

**Implementation**:

```sql
CREATE TABLE document_chunks (
  id uuid PRIMARY KEY,
  document_id uuid REFERENCES documents(id),
  parent_chunk_id uuid REFERENCES document_chunks(id), -- Self-reference
  chunk_level text NOT NULL, -- 'section' or 'paragraph'
  content text NOT NULL,
  embedding vector(1792),
  citation jsonb NOT NULL,
  ...
);
```

---

### 7. Processing Status Management

**Decision**: Extend existing `processing_status` enum with new states

**Rationale**:

- Existing pattern in `documents` table
- Real-time status via Supabase Realtime (already enabled)
- Compatible with existing UI components

**New States**:

```
pending → extracting → structuring → embedding → ready
                    ↘ error (at any step)
```

---

### 8. pg_trgm Extension Availability

**Decision**: Enable via migration (confirmed available in Supabase)

**Rationale**:

- Part of PostgreSQL contrib modules
- Supabase allows enabling via SQL
- Required for `%` similarity operator and `similarity()` function

**Migration**:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_chunks_content_trgm ON document_chunks
  USING gin (content gin_trgm_ops);
```

---

## Best Practices Applied

### From Constitution

1. **RLS on all tables** - New `document_sections` and enhanced `document_chunks` have RLS enabled
2. **SECURITY INVOKER functions** - All new functions use SECURITY INVOKER
3. **snake_case naming** - All tables and columns follow convention
4. **Fully qualified names** - Functions use `public.` prefix

### From Existing Patterns

1. **Isaacus client wrapper** - Reuse existing `IsaacusClient` class
2. **Processing status flow** - Match existing document processing pattern
3. **API route structure** - Follow existing `/api/` patterns
4. **Tool decorator pattern** - Use `@tool` with docstrings for agent tools

---

## Risk Mitigation

| Risk                                     | Mitigation                                      |
| ---------------------------------------- | ----------------------------------------------- |
| `unstructured` extraction quality varies | Fallback to paragraph chunking, quality scoring |
| Agent timeout on large documents         | Batch processing, status updates per page       |
| Hybrid search performance                | Limit to matter scope, add indexes              |
| Migration breaks existing documents      | Parallel tables, gradual migration              |
| Isaacus API rate limits                  | Batch embedding calls, exponential backoff      |





