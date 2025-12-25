# Quickstart: Matters & Document Management Foundation

**Feature Branch**: `004-matters-documents`  
**Date**: 2025-12-24  
**Status**: ✅ Feature Complete

## Prerequisites

- Supabase project configured (existing)
- Supabase CLI installed
- Node.js 18+ and pnpm installed
- Python 3.11+ and uv installed
- Isaacus API key (obtain from [isaacus.com](https://isaacus.com))

## 1. Database Setup

### Apply Migrations

```bash
# Navigate to project root
cd /path/to/testv4

# Apply all migrations to local Supabase
supabase db reset

# Or apply only new migrations
supabase migration up
```

### Enable pgvector Extension

```bash
# Connect to Supabase and enable pgvector
supabase db execute "create extension if not exists vector;"
```

### Verify Tables Created

```bash
supabase db execute "select table_name from information_schema.tables where table_schema = 'public';"
```

Expected output:

- `profiles` (existing)
- `matters`
- `documents`
- `matter_participants`
- `document_embeddings`

---

## 2. Storage Setup

### Create Documents Bucket

```bash
# Via Supabase Dashboard or CLI
supabase storage create documents --public false
```

Or via SQL:

```sql
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);
```

---

## 3. Environment Variables

### Frontend (`apps/frontend/.env.local`)

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ASSISTANT_ID=deep_research

# Server-side
LANGGRAPH_API_URL=https://your-langgraph-url
LANGSMITH_API_KEY=your_langsmith_key
```

### Agent (`apps/agent/.env`)

```bash
# Existing variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key

# NEW: Isaacus API
ISAACUS_API_KEY=your_isaacus_key
ISAACUS_BASE_URL=https://api.isaacus.com
```

### Supabase Edge Functions

Set via dashboard or CLI:

```bash
supabase secrets set ISAACUS_API_KEY=your_isaacus_key
```

---

## 4. Frontend Setup

### Copy Supabase UI Dropzone Component

```bash
cd apps/frontend

# Create component file
mkdir -p src/components

# Copy from Supabase UI (or create manually)
# See: https://supabase.com/ui/docs/nextjs/dropzone
```

Create `src/components/dropzone.tsx` and `src/hooks/use-supabase-upload.ts` from [Supabase UI docs](https://supabase.com/ui/docs/nextjs/dropzone).

### Install Dependencies (if needed)

```bash
cd apps/frontend
pnpm install
```

### Generate TypeScript Types

```bash
supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

---

## 5. Agent Setup

### Install Dependencies

```bash
cd apps/agent
uv sync  # All dependencies are in pyproject.toml
```

### Agent Tools (Implemented)

The following tools are implemented in `src/tools/`:

| Tool                    | File                       | Description                         |
| ----------------------- | -------------------------- | ----------------------------------- |
| `isaacus_search`        | `isaacus_search.py`        | Semantic search + reranking         |
| `isaacus_extract`       | `isaacus_extract.py`       | Extractive QA with citations        |
| `isaacus_classify`      | `isaacus_classify.py`      | Legal clause classification         |
| `get_document_text`     | `get_document_text.py`     | Retrieve document text from storage |
| `list_matter_documents` | `list_matter_documents.py` | List documents in a matter          |

### Agent Services (Implemented)

| Service             | File                    | Description                           |
| ------------------- | ----------------------- | ------------------------------------- |
| `IsaacusClient`     | `isaacus_client.py`     | Isaacus API wrapper                   |
| `DocumentProcessor` | `document_processor.py` | PDF/DOCX/TXT text extraction with OCR |
| `DeepSeekOCR`       | `deepseek_ocr.py`       | OCR for scanned documents             |

### OCR Support (Optional)

For scanned PDF support, add DeepSeek API key:

```bash
# In apps/agent/.env
DEEPSEEK_API_KEY=your_deepseek_key
```

The DocumentProcessor automatically uses OCR when PyMuPDF detects low text content.

---

## 6. Edge Function Setup

### Create Document Processor Function

```bash
supabase functions new process-document
```

Edit `supabase/functions/process-document/index.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  const payload = await req.json();
  const { record } = payload;

  // Process document...

  return new Response(JSON.stringify({ success: true }));
});
```

### Deploy Function

```bash
supabase functions deploy process-document
```

### Create Database Webhook

```sql
-- Create webhook trigger for document processing
create trigger on_document_insert
  after insert on public.documents
  for each row
  execute function supabase_functions.http_request(
    'https://your-project.supabase.co/functions/v1/process-document',
    'POST',
    '{"Content-Type": "application/json"}',
    '{}',
    '5000'
  );
```

---

## 7. Verify Setup

### Test Matter Creation

```typescript
// In browser console or test file
const { data, error } = await supabase
  .from("matters")
  .insert({ title: "Test Matter" })
  .select()
  .single();

console.log(data); // Should show matter with auto-generated matter_number
```

### Test Document Upload

```typescript
// Upload test file
const file = new File(["test content"], "test.txt", { type: "text/plain" });
const { data, error } = await supabase.storage
  .from("documents")
  .upload(`matters/${matterId}/test.txt`, file);
```

### Test Isaacus API

```bash
# Test from agent directory
cd apps/agent
python -c "
import asyncio
from src.services.isaacus_client import IsaacusClient
import os

async def test():
    client = IsaacusClient(os.environ['ISAACUS_API_KEY'])
    result = await client.embed(['test query'])
    print(f'Embedding dimension: {len(result[0])}')

asyncio.run(test())
"
```

---

## 8. Development Workflow

### Start Local Supabase

```bash
supabase start
```

### Start Frontend

```bash
cd apps/frontend
pnpm dev
```

### Start Agent (for local testing)

```bash
cd apps/agent
uv run python -m src.agent.graph
```

### View Logs

```bash
# Supabase logs
supabase logs

# Edge function logs
supabase functions logs process-document
```

---

## Common Issues

### RLS Policy Errors

If you get "permission denied" errors:

1. Check user is authenticated
2. Verify RLS policies are applied correctly
3. Check matter ownership or participant membership

### Document Processing Stuck

If documents stay in "pending" or "extracting":

1. Check Edge Function logs
2. Verify webhook is triggered
3. Check Isaacus API key is valid

### Embedding Search Returns No Results

1. Verify documents have `processing_status = 'ready'`
2. Check embeddings exist in `document_embeddings`
3. Try lowering `match_threshold` in search

---

## Implementation Complete

All 89 tasks have been implemented. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for details.

### Remaining Configuration

1. **Isaacus API Key** - Required for semantic search and document embeddings
2. **DeepSeek API Key** - Optional, for OCR on scanned PDFs

### Test the Implementation

```bash
# Start frontend
cd apps/frontend && pnpm dev

# Start agent
cd apps/agent && uv run langgraph dev

# Visit http://localhost:3000/protected/matters
```
