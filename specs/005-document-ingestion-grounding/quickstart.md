# Quickstart: Document Ingestion & Legal Grounding

**Feature**: 005-document-ingestion-grounding
**Date**: 2024-12-25

## Prerequisites

- Existing deep research agent environment set up
- Supabase project with pgvector extension enabled
- Isaacus API key configured
- Python 3.11+ with `unstructured` library

## Setup Steps

### 1. Install Python Dependencies

```bash
cd apps/agent
uv add unstructured python-magic-bin markdownify
```

For PDF support with high-quality extraction:

```bash
uv add "unstructured[pdf]"
# Or for all document types:
uv add "unstructured[all-docs]"
```

### 2. Run Database Migrations

```bash
# From project root
supabase db push
```

Or apply individually:

```bash
supabase migration up 20251225000000_create_document_sections
supabase migration up 20251225000100_enhance_document_chunks
supabase migration up 20251225000200_extend_documents
supabase migration up 20251225000300_create_hybrid_search
```

### 3. Verify pg_trgm Extension

```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- If not, enable it
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 4. Deploy Agent Updates

```bash
cd apps/agent
langgraph build
langgraph deploy
```

### 5. Verify API Routes

The following routes should now be available:

```bash
# Test process endpoint
curl -X POST http://localhost:3000/api/documents/process \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"document_id": "your-document-uuid"}'

# Test search endpoint
curl -X POST http://localhost:3000/api/documents/search \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matter_id": "your-matter-uuid", "query": "governing law"}'
```

## Testing the Feature

### Test 1: Upload and Process Document

1. Upload a PDF or DOCX via the existing UI
2. Verify document status changes: `pending` → `extracting` → `structuring` → `embedding` → `ready`
3. Check document has sections in database:

```sql
SELECT ds.* FROM document_sections ds
JOIN documents d ON ds.document_id = d.id
WHERE d.filename = 'your-document.pdf'
ORDER BY ds.path;
```

### Test 2: Verify Hierarchical Structure

```sql
-- Get section tree for a document
SELECT
  repeat('  ', level - 1) || COALESCE(section_number, '') || ' ' || COALESCE(title, '[No Title]') as section,
  start_page,
  end_page
FROM document_sections
WHERE document_id = 'your-document-uuid'
ORDER BY path;
```

Expected output:

```
section                               | start_page | end_page
--------------------------------------|------------|----------
1. Definitions                        | 1          | 3
  1.1 Affiliate                       | 1          | 1
  1.2 Confidential Information        | 2          | 2
2. Services                           | 4          | 8
  2.1 Scope                           | 4          | 5
  2.2 Delivery                        | 6          | 8
```

### Test 3: Hybrid Search

```typescript
// In browser console or test file
const response = await fetch("/api/documents/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    matter_id: "your-matter-uuid",
    query: "§ 512(c)", // Exact legal reference
    options: { semantic_weight: 0.5 }, // Equal weight for keyword
  }),
});

const results = await response.json();
console.log(results);
// Should show exact matches for "§ 512(c)" at top
```

### Test 4: Citation Verification

```typescript
// Click a citation link
const chunkResponse = await fetch(`/api/documents/${docId}/chunks/${chunkId}`);
const chunk = await chunkResponse.json();

console.log("Citation:", chunk.chunk.citation);
console.log("Verified:", chunk.verified); // Should be true
console.log("Content hash matches:", chunk.chunk.content_hash);
```

### Test 5: Parent Context Expansion

```sql
-- Get chunk with parent context
SELECT * FROM get_chunk_with_context('your-chunk-uuid');
```

Should return:

- The chunk content
- Parent section content (if exists)
- Sibling chunks (±2 from current index)

## Common Issues

### Issue: `unstructured` extraction fails

**Symptom**: Error during document processing

**Solution**:

1. Check file format is supported (PDF, DOCX, TXT)
2. For PDFs, ensure poppler-utils is installed:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install poppler-utils

   # macOS
   brew install poppler
   ```

### Issue: Embeddings have wrong dimension

**Symptom**: Insert fails with dimension mismatch

**Solution**: Verify column is `vector(1792)`:

```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'document_chunks' AND column_name = 'embedding';
```

### Issue: Hybrid search returns no results

**Symptom**: Search returns empty despite documents existing

**Solution**:

1. Check documents have `processing_status = 'ready'`
2. Verify trigram index exists:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'document_chunks' AND indexname LIKE '%trgm%';
   ```
3. Check similarity threshold isn't too high

### Issue: Citations don't match source

**Symptom**: `verified: false` on chunk retrieval

**Solution**: Document may have been modified. Re-process:

```sql
UPDATE documents
SET processing_status = 'pending', structure_extracted = false
WHERE id = 'document-uuid';
```

Then trigger reprocessing.

## Performance Tuning

### Optimize Vector Search

For large document collections (>10k chunks):

```sql
-- Use HNSW index instead of IVFFlat
DROP INDEX IF EXISTS idx_chunks_embedding;
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Optimize Hybrid Search

```sql
-- Add composite index for matter + status filtering
CREATE INDEX idx_chunks_matter_status ON document_chunks(document_id)
  WHERE chunk_level = 'paragraph';

-- Analyze table statistics
ANALYZE document_chunks;
```

## Environment Variables

Ensure these are set:

```bash
# Frontend (.env.local)
LANGGRAPH_API_URL=https://your-deployment.langsmith.com
LANGSMITH_API_KEY=lsv2_...

# Agent (.env)
ISAACUS_API_KEY=isa_...
DEEPSEEK_API_KEY=sk-...  # For OCR fallback
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For processing
```

## Next Steps

1. **Migrate existing documents**: Create background job to reprocess documents with new pipeline
2. **Add citation UI**: Implement `<CitationLink>` component for clickable citations
3. **Enhance AI prompts**: Update agent prompts to always include citations
4. **Monitor quality**: Track extraction quality scores and flag low-quality documents



