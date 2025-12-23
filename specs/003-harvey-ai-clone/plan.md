# Harvey AI Clone - Implementation Plan

**Created**: 2025-01-12  
**Status**: Planning  
**Goal**: Build a legal AI platform similar to Harvey AI with "counsel" and "matters" terminology

## Overview

Transform the current Deep Research Agent into a comprehensive legal AI platform inspired by Harvey AI, with features for document management, legal research, workflows, and collaboration.

## Harvey AI Feature Mapping

### Core Features to Implement

| Harvey Feature             | Our Implementation                                                    | Priority | Status                   |
| -------------------------- | --------------------------------------------------------------------- | -------- | ------------------------ |
| **Assistant**              | Legal-focused AI assistant for questions, document analysis, drafting | P1       | Foundation exists        |
| **Vault**                  | Document storage, organization, and bulk analysis                     | P1       | New                      |
| **Knowledge**              | Legal research with domain-specific knowledge base                    | P1       | Extends current research |
| **Workflows**              | Custom legal workflows (contract review, due diligence, etc.)         | P2       | New                      |
| **Collaboration**          | Shared spaces, team collaboration, matter sharing                     | P2       | New                      |
| **Microsoft Integrations** | Word, Outlook, SharePoint integration                                 | P3       | Future                   |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Legal AI Platform Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │   Frontend       │         │   Agent Layer     │                 │
│  │   (Next.js)      │         │   (LangGraph)     │                 │
│  │                  │         │                  │                 │
│  │  • Assistant UI  │◄────────│  • Legal Agent   │                 │
│  │  • Vault UI      │         │  • Document AI   │                 │
│  │  • Knowledge UI  │         │  • Workflow Exec │                 │
│  │  • Workflows UI  │         │  • Research Agent│                 │
│  │  • Matters UI    │         │                  │                 │
│  └──────────────────┘         └──────────────────┘                 │
│           │                              │                          │
│           └──────────────┬───────────────┘                          │
│                          ▼                                          │
│              ┌──────────────────────────┐                           │
│              │      Supabase            │                           │
│              │  • Auth (existing)      │                           │
│              │  • Documents (Vault)     │                           │
│              │  • Matters               │                           │
│              │  • Workflows             │                           │
│              │  • Knowledge Base        │                           │
│              │  • Conversations         │                           │
│              └──────────────────────────┘                           │
│                          │                                          │
│                          ▼                                          │
│              ┌──────────────────────────┐                           │
│              │   Supabase Storage       │                           │
│              │  • Document files        │                           │
│              │  • Attachments           │                           │
│              └──────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

#### 1. Matters (replaces "cases")

```sql
create table public.matters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  matter_number text unique, -- e.g., "M-2025-001"
  status text default 'active', -- active, closed, archived
  created_by uuid not null references public.profiles (id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Matter participants (counsel, clients, etc.)
create table public.matter_participants (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null, -- 'counsel', 'client', 'observer'
  added_at timestamptz default now() not null,
  unique(matter_id, user_id)
);
```

#### 2. Vault (Document Storage)

```sql
-- Vaults are collections of documents
create table public.vaults (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  matter_id uuid references public.matters (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  is_shared boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Documents stored in vaults
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.vaults (id) on delete cascade,
  storage_path text not null, -- Supabase Storage path
  filename text not null,
  file_type text, -- pdf, docx, txt, etc.
  file_size bigint, -- bytes
  mime_type text,
  extracted_text text, -- Full text extracted for search
  metadata jsonb default '{}'::jsonb, -- Custom metadata
  uploaded_by uuid not null references public.profiles (id),
  uploaded_at timestamptz default now() not null,
  processed_at timestamptz, -- When AI processing completed
  vector_embedding vector(1536) -- For semantic search (if using pgvector)
);

-- Document annotations/notes
create table public.document_annotations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  content text not null,
  page_number int,
  position jsonb, -- {x, y, width, height} for PDF annotations
  created_at timestamptz default now() not null
);
```

#### 3. Knowledge Base

```sql
-- Legal knowledge articles/entries
create table public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text, -- 'case_law', 'regulation', 'practice_note', 'template'
  tags text[],
  source_url text,
  matter_id uuid references public.matters (id) on delete set null,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  vector_embedding vector(1536) -- For semantic search
);
```

#### 4. Workflows

```sql
-- Workflow definitions
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  workflow_type text not null, -- 'contract_review', 'due_diligence', 'custom'
  definition jsonb not null, -- Workflow steps, conditions, actions
  is_template boolean default false, -- Can be reused
  created_by uuid not null references public.profiles (id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Workflow executions
create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id),
  matter_id uuid references public.matters (id) on delete set null,
  status text default 'pending', -- pending, running, completed, failed
  input_data jsonb, -- Input parameters
  output_data jsonb, -- Results
  started_by uuid not null references public.profiles (id),
  started_at timestamptz default now() not null,
  completed_at timestamptz
);
```

#### 5. Conversations (Extended)

```sql
-- Extend existing conversations table
alter table public.conversations add column matter_id uuid references public.matters (id) on delete set null;
alter table public.conversations add column conversation_type text default 'assistant'; -- 'assistant', 'vault_analysis', 'workflow'
```

## Feature Implementation Plan

### Phase 1: Foundation & Core Entities (P1)

**Goal**: Set up data model and basic infrastructure

#### 1.1 Database Schema

- [ ] Create `matters` table with RLS policies
- [ ] Create `matter_participants` table
- [ ] Create `vaults` table
- [ ] Create `documents` table with storage integration
- [ ] Create `knowledge_entries` table
- [ ] Create `workflows` and `workflow_executions` tables
- [ ] Extend `conversations` table for matter linkage
- [ ] Set up Supabase Storage buckets for documents
- [ ] Enable pgvector extension for semantic search (optional)

#### 1.2 Authentication & Authorization

- [ ] Extend RLS policies for all new tables
- [ ] Implement matter-level access control
- [ ] Add role-based permissions (counsel, client, observer)
- [ ] Create helper functions for permission checks

### Phase 2: Vault - Document Management (P1)

**Goal**: Enable document upload, storage, and basic analysis

#### 2.1 Document Upload

- [ ] Create document upload API endpoint
- [ ] Integrate with Supabase Storage
- [ ] Support multiple file types (PDF, DOCX, TXT, etc.)
- [ ] Extract text from documents (PDF parsing, DOCX parsing)
- [ ] Store extracted text in `documents.extracted_text`
- [ ] Generate document metadata (page count, word count, etc.)

#### 2.2 Vault UI

- [ ] Create vault list view
- [ ] Create vault detail view with document list
- [ ] Implement document upload UI (drag & drop)
- [ ] Document preview component
- [ ] Document search within vault

#### 2.3 Document Analysis (Basic)

- [ ] Agent tool: `analyze_document(document_id)`
- [ ] Extract key terms, dates, parties
- [ ] Generate document summary
- [ ] Store analysis results in document metadata

### Phase 3: Assistant - Legal AI (P1)

**Goal**: Transform research agent into legal-focused assistant

#### 3.1 Legal Domain Prompting

- [ ] Create legal system prompts
- [ ] Add legal terminology and context
- [ ] Integrate with knowledge base for context
- [ ] Support matter-specific context

#### 3.2 Assistant Tools

- [ ] `search_knowledge_base(query)` - Search internal knowledge
- [ ] `analyze_document(document_id)` - Analyze vault documents
- [ ] `search_matter_documents(matter_id, query)` - Search within matter
- [ ] `draft_legal_document(template, context)` - Draft documents
- [ ] `extract_clauses(document_id)` - Extract contract clauses
- [ ] `compare_documents(doc1_id, doc2_id)` - Compare documents

#### 3.3 Assistant UI

- [ ] Matter-aware chat interface
- [ ] Context selector (matter, vault, knowledge base)
- [ ] Document reference in conversations
- [ ] Citation to knowledge base entries

### Phase 4: Knowledge Base (P1)

**Goal**: Build searchable legal knowledge repository

#### 4.1 Knowledge Management

- [ ] Create knowledge entry form
- [ ] Support markdown content
- [ ] Categorization and tagging
- [ ] Link to matters and documents
- [ ] Import from external sources (optional)

#### 4.2 Knowledge Search

- [ ] Full-text search across knowledge base
- [ ] Semantic search (if pgvector enabled)
- [ ] Filter by category, tags, matter
- [ ] Agent integration for research

#### 4.3 Knowledge UI

- [ ] Knowledge base browser
- [ ] Entry editor/viewer
- [ ] Search interface
- [ ] Category/tag navigation

### Phase 5: Workflows (P2)

**Goal**: Customizable legal workflows

#### 5.1 Workflow Builder

- [ ] Workflow definition schema
- [ ] Visual workflow builder (or JSON editor)
- [ ] Workflow templates (contract review, due diligence)
- [ ] Save and reuse workflows

#### 5.2 Workflow Execution

- [ ] Workflow runner agent
- [ ] Step-by-step execution
- [ ] Conditional logic
- [ ] Integration with document analysis
- [ ] Progress tracking

#### 5.3 Workflow UI

- [ ] Workflow list view
- [ ] Workflow builder interface
- [ ] Execution status dashboard
- [ ] Results display

### Phase 6: Collaboration & Sharing (P2)

**Goal**: Enable team collaboration

#### 6.1 Matter Sharing

- [ ] Add participants to matters
- [ ] Role-based access (counsel, client, observer)
- [ ] Notification system for matter updates
- [ ] Activity feed per matter

#### 6.2 Vault Sharing

- [ ] Share vaults with matter participants
- [ ] Permission levels (view, edit, manage)
- [ ] Collaborative annotations

#### 6.3 Collaboration UI

- [ ] Matter participants management
- [ ] Shared vaults view
- [ ] Activity timeline
- [ ] Notification center

### Phase 7: Advanced Features (P3)

**Goal**: Enhanced capabilities

#### 7.1 Advanced Document Analysis

- [ ] Contract clause extraction
- [ ] Risk identification
- [ ] Compliance checking
- [ ] Bulk document analysis

#### 7.2 Reporting & Analytics

- [ ] Matter dashboard
- [ ] Document usage analytics
- [ ] Workflow performance metrics
- [ ] Export capabilities

#### 7.3 Microsoft Integrations (Future)

- [ ] Word add-in for document drafting
- [ ] Outlook integration for email analysis
- [ ] SharePoint sync

## Technical Decisions

### Document Processing

**Decision**: Use Python libraries for text extraction

- **PDF**: `pypdf` or `pdfplumber`
- **DOCX**: `python-docx`
- **Alternative**: Use external service (AWS Textract, Google Document AI)

**Rationale**: Keep processing in-house for privacy, control costs

### Semantic Search

**Decision**: Use pgvector with OpenAI embeddings (optional)

- Enable `pgvector` extension in Supabase
- Generate embeddings for documents and knowledge entries
- Use cosine similarity for semantic search

**Alternative**: Use external vector DB (Pinecone, Weaviate)

### Workflow Engine

**Decision**: Use LangGraph for workflow execution

- Leverage existing agent infrastructure
- Define workflows as graphs
- Each step can be an agent tool or sub-agent

**Alternative**: Use dedicated workflow engine (Temporal, Airflow)

### File Storage

**Decision**: Supabase Storage

- Integrated with existing Supabase setup
- RLS policies for access control
- Direct file serving via CDN

## Integration Points

### Agent → Database

- Agent tools call Supabase via Python client
- Use existing JWT validation
- All operations scoped to authenticated user

### Frontend → Storage

- Direct upload to Supabase Storage (signed URLs)
- Frontend handles file upload UI
- Agent processes files after upload

### Agent → Document Processing

- Agent receives document ID
- Downloads from Storage
- Processes and stores results
- Updates document metadata

## Security Considerations

1. **Document Access**: RLS ensures users only see documents in vaults they can access
2. **Matter Privacy**: Matter participants can only see their assigned matters
3. **File Upload**: Validate file types, scan for malware (future)
4. **Workflow Execution**: Validate user permissions before execution
5. **Knowledge Base**: Control who can create/edit entries

## Success Metrics

- **Vault**: 100+ documents per vault, <2s search time
- **Assistant**: <5s response time for legal questions
- **Knowledge Base**: 1000+ entries, <1s search time
- **Workflows**: 90%+ successful execution rate
- **Collaboration**: Support 10+ participants per matter

## Migration Path

1. **Phase 1-2**: Foundation + Vault (MVP)
2. **Phase 3**: Legal Assistant (Core feature)
3. **Phase 4**: Knowledge Base (Enhancement)
4. **Phase 5-6**: Workflows + Collaboration (Advanced)
5. **Phase 7**: Polish and integrations

## Open Questions

1. **Vector Search**: Should we implement pgvector now or later?
2. **Document Processing**: In-house vs. external service?
3. **Workflow Complexity**: How complex should workflows be initially?
4. **Microsoft Integration**: Priority and timeline?

## Next Steps

1. Review and approve this plan
2. Create detailed spec for Phase 1 (Foundation)
3. Set up development environment for document processing
4. Begin Phase 1 implementation
