# Research: Matters & Document Management Foundation

**Feature Branch**: `004-matters-documents`  
**Date**: 2025-12-23  
**Status**: Complete

## Research Questions

### 1. Document Text Extraction

**Question**: What libraries should be used to extract text from PDF, DOCX, and TXT files?

**Decision**: Use `pypdf` for PDF and `python-docx` for DOCX extraction in Python.

**Rationale**:

- Both libraries are pure Python, no external dependencies
- Well-maintained with active communities
- Sufficient quality for text-based legal documents
- No per-document costs (vs. AWS Textract, Google Document AI)
- Can run in Supabase Edge Functions or agent backend

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| AWS Textract | Per-page costs, requires AWS account |
| Google Document AI | Per-page costs, requires GCP account |
| pdf-parse (Node.js) | Would require separate processing service |
| Apache Tika | Heavy JVM dependency, overkill for text extraction |

**Implementation Notes**:

```python
# PDF extraction
from pypdf import PdfReader
reader = PdfReader(file_path)
text = "\n".join([page.extract_text() for page in reader.pages])

# DOCX extraction
from docx import Document
doc = Document(file_path)
text = "\n".join([para.text for para in doc.paragraphs])

# TXT - direct read
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()
```

---

### 2. Document Processing Pipeline

**Question**: Where and how should document processing (extraction + embedding) be triggered?

**Decision**: Use Supabase Edge Function triggered by database insert/webhook.

**Rationale**:

- Decouples upload from processing (better UX)
- Edge Functions can call Isaacus API directly
- Scales independently of frontend/agent
- Retry logic built into Edge Functions
- Can update document status in database directly

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Synchronous in upload handler | Blocks user, poor UX for large files |
| Agent-triggered processing | Requires agent to poll for new documents |
| Client-side extraction | Security concern, inconsistent results |
| Background job (Celery) | Additional infrastructure, overkill for MVP |

**Implementation Notes**:

1. Frontend uploads file to Supabase Storage
2. Frontend creates document record with status "processing"
3. Database trigger or webhook invokes Edge Function
4. Edge Function downloads file, extracts text, calls Isaacus for embedding
5. Edge Function updates document status to "ready" or "error"

---

### 3. Isaacus API Integration

**Question**: How should the agent integrate with Isaacus API capabilities?

**Decision**: Create a Python `IsaacusClient` service class that wraps all API calls with retry logic.

**Rationale**:

- Centralized API handling with consistent error handling
- Retry logic for transient failures (3 attempts)
- Easy to mock for testing
- Clear separation of concerns

**API Endpoints** (from [Isaacus docs](https://docs.isaacus.com/capabilities/introduction)):
| Capability | Endpoint | Use Case |
|------------|----------|----------|
| Embedding | `/embed` | Document vectorization, query embedding |
| Reranking | `/rerank` | Sort search results by relevance |
| Extractive QA | `/extract` | Pull precise answers with citations |
| Classification | `/classify` | Identify contract clauses |

**Implementation Notes**:

```python
class IsaacusClient:
    def __init__(self, api_key: str, base_url: str = "https://api.isaacus.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.client = httpx.AsyncClient()

    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for texts."""
        ...

    async def rerank(self, query: str, documents: list[str]) -> list[dict]:
        """Rerank documents by relevance to query."""
        ...

    async def extract(self, question: str, context: str) -> dict:
        """Extract answer from context with citation."""
        ...

    async def classify(self, text: str, labels: list[str]) -> list[dict]:
        """Classify text into provided labels."""
        ...
```

---

### 4. Embedding Storage Strategy

**Question**: Where should document embeddings be stored?

**Decision**: Store embeddings in Supabase PostgreSQL with pgvector extension for local similarity search, with Isaacus API for embedding generation.

**Rationale**:

- Embeddings stored locally = no per-query Isaacus costs for search
- pgvector provides efficient similarity search
- Single database for all data (matters, documents, embeddings)
- Isaacus API only called for embedding generation and reranking

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Isaacus-only storage | Higher per-query costs, vendor lock-in |
| Pinecone/Weaviate | Additional service to manage, costs |
| Store in document record | No efficient similarity search |

**Implementation Notes**:

- Enable `pgvector` extension in Supabase
- Store embeddings in `document_embeddings` table with `vector(1536)` column
- Chunk documents into ~500 token segments for better retrieval
- Use cosine similarity for search: `1 - (embedding <=> query_embedding)`

---

### 5. File Upload Component

**Question**: What component should be used for document upload UI?

**Decision**: Use [Supabase UI Library Dropzone](https://supabase.com/ui/docs/nextjs/dropzone) component.

**Rationale**:

- Native Supabase Storage integration
- Drag-and-drop support out of the box
- File type validation
- Progress indicators
- Production-ready, minimal custom code

**Files to Copy**:

- `components/dropzone.tsx`
- `hooks/use-supabase-upload.ts`

**Configuration**:

```typescript
const props = useSupabaseUpload({
  bucketName: "documents",
  path: `matters/${matterId}`,
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  maxFiles: 10,
  maxFileSize: 50 * 1000 * 1000, // 50MB
});
```

---

### 6. Matter Number Generation

**Question**: How should unique matter numbers be generated?

**Decision**: Use database sequence with format "M-YYYY-NNN" generated via trigger function.

**Rationale**:

- Guaranteed uniqueness at database level
- No race conditions
- Human-readable format familiar to legal professionals
- Automatically increments per year

**Implementation Notes**:

```sql
-- Sequence for matter numbers (resets yearly in practice, or use global sequence)
create sequence if not exists matter_number_seq;

-- Function to generate matter number
create or replace function generate_matter_number()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return 'M-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.matter_number_seq')::text, 3, '0');
end;
$$;
```

---

### 7. Access Control Model

**Question**: How should matter access control be implemented?

**Decision**: Owner-based with explicit participant roles, enforced via RLS policies.

**Roles**:
| Role | Permissions |
|------|-------------|
| **counsel** (owner) | Full access: CRUD matters, documents, participants |
| **counsel** (participant) | Full access to matter documents, cannot delete matter |
| **client** | View + upload documents, cannot manage participants |
| **observer** | View only, cannot modify anything |

**RLS Strategy**:

```sql
-- User can access matter if:
-- 1. They are the owner (created_by = auth.uid())
-- 2. They are a participant (exists in matter_participants)

create policy "Users can view their matters"
on public.matters
for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.matter_participants
    where matter_id = id
    and user_id = (select auth.uid())
  )
);
```

---

### 8. Document Agent Subagent Design

**Question**: How should the Document Agent subagent be configured?

**Decision**: Single subagent with access to all three Isaacus tools, spawned by orchestrator for document-heavy tasks.

**Rationale**:

- Follows constitution principle V (simplicity)
- Single subagent keeps architecture clean
- Can access all document tools as needed
- Orchestrator delegates via `task` tool

**Configuration**:

```python
document_agent = {
    "name": "document-agent",
    "description": "Analyze documents within a matter. Use for document search, answer extraction, and clause classification.",
    "system_prompt": DOCUMENT_AGENT_INSTRUCTIONS,
    "tools": [isaacus_search, isaacus_extract, isaacus_classify, think_tool],
}
```

---

## Environment Variables (New)

### Agent (.env)

```
ISAACUS_API_KEY=           # Isaacus API key
ISAACUS_BASE_URL=https://api.isaacus.com
```

### Edge Function (Supabase secrets)

```
ISAACUS_API_KEY=           # Same key for document processing
```

---

## Dependencies to Add

### Agent (pyproject.toml)

```toml
[project.dependencies]
pypdf = "^4.0"
python-docx = "^1.1"
# Note: Isaacus SDK or use httpx directly
```

### Frontend (package.json)

No new dependencies needed - Supabase UI Dropzone is copied, not installed.

---

## Open Questions Resolved

| Question             | Resolution                                                 |
| -------------------- | ---------------------------------------------------------- |
| Vector DB choice     | Supabase pgvector - single database, no additional service |
| OCR for scanned docs | Out of scope for MVP - documents assumed text-based        |
| Isaacus rate limits  | Assume provisioned with sufficient limits                  |
| Embedding dimensions | 1536 (standard for legal models)                           |
| Chunk size           | ~500 tokens per chunk for optimal retrieval                |
