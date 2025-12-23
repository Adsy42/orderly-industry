# Implementation Plan: Matters & Document Management Foundation

**Branch**: `004-matters-documents` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-matters-documents/spec.md`

## Summary

Implement the core data foundation for Orderly, enabling Australian counsel to organize work into matters (legal cases/projects) and manage documents with AI-powered analysis. This extends the existing deep agents architecture with Isaacus-powered tools for semantic search, extractive QA, and clause classification.

**Key Components**:

1. Database schema for matters, documents, participants, and embeddings
2. Supabase Storage bucket for document files
3. Document processing pipeline (text extraction + Isaacus embedding)
4. Three new agent tools: `isaacus_search`, `isaacus_extract`, `isaacus_classify`
5. Document Agent subagent for matter document analysis
6. Frontend UI for matters list, matter detail, and document upload (using Supabase Dropzone)

## Technical Context

**Language/Version**:

- Frontend: TypeScript 5.x (Next.js 15, React 19)
- Agent: Python 3.11+
- Database: PostgreSQL (Supabase)

**Primary Dependencies**:

- Frontend: Next.js 15, Supabase SSR, LangGraph SDK, Supabase UI Dropzone
- Agent: LangGraph, deepagents, Isaacus Python SDK, supabase-py, pypdf, python-docx

**Storage**:

- PostgreSQL (Supabase) for structured data
- Supabase Storage for document files (bucket: `documents`)
- Isaacus API for embedding storage (managed externally)

**Testing**:

- Frontend: Vitest + React Testing Library
- Agent: pytest
- Database: pgTAP or manual verification

**Target Platform**:

- Web application (modern browsers: Chrome, Firefox, Safari, Edge - latest 2 versions)
- Agent deployed to LangSmith

**Project Type**: Monorepo (apps/frontend + apps/agent)

**Performance Goals**:

- Matter list load: < 2 seconds
- Document upload: < 10 seconds for < 10MB
- Document processing: < 60 seconds for < 50 pages
- Semantic search: < 3 seconds for 100 documents

**Constraints**:

- Max file size: 50MB
- Max simultaneous uploads: 10 per session
- Supported formats: PDF, DOCX, TXT
- Isaacus API rate limits (TBD based on provisioning)

**Scale/Scope**:

- Initial: 100 users, 1000 matters, 10,000 documents
- Storage quota: 1GB per user

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                         | Status  | Notes                                                             |
| --------------------------------- | ------- | ----------------------------------------------------------------- |
| **I. Monorepo Architecture**      | ✅ PASS | Feature spans apps/frontend, apps/agent, and supabase/migrations  |
| **II. Authentication-First**      | ✅ PASS | All matters/documents scoped to authenticated users via RLS       |
| **III. Security by Default**      | ✅ PASS | RLS enabled on all new tables, participant-based access control   |
| **IV. Research Agent Patterns**   | ✅ PASS | Extends orchestrator with new tools, adds Document Agent subagent |
| **V. Simplicity Over Complexity** | ✅ PASS | Single Document Agent (not multiple), Isaacus handles complexity  |

### SQL Standards Compliance

| Standard               | Planned Approach                                   |
| ---------------------- | -------------------------------------------------- |
| snake_case naming      | ✅ All tables/columns use snake_case               |
| Plural table names     | ✅ `matters`, `documents`, `matter_participants`   |
| RLS on all tables      | ✅ Separate policies per operation and role        |
| Table comments         | ✅ All tables documented                           |
| `(select auth.uid())`  | ✅ Used in all RLS policies for performance        |
| Indexes on RLS columns | ✅ Indexes on `created_by`, `matter_id`, `user_id` |

### Python Standards Compliance

| Standard              | Planned Approach                        |
| --------------------- | --------------------------------------- |
| Type hints            | ✅ All function signatures typed        |
| `@tool` decorator     | ✅ New tools use `parse_docstring=True` |
| Prompts in prompts.py | ✅ Document Agent prompts in prompts.py |
| Async I/O             | ✅ Isaacus calls use async/await        |

## Project Structure

### Documentation (this feature)

```text
specs/004-matters-documents/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity schemas
├── quickstart.md        # Phase 1 output - setup guide
├── contracts/           # Phase 1 output - API specifications
│   ├── matters-api.md
│   ├── documents-api.md
│   └── agent-tools.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── app/
│   │   ├── protected/
│   │   │   ├── matters/
│   │   │   │   ├── page.tsx           # Matters list
│   │   │   │   └── [matterId]/
│   │   │   │       ├── page.tsx       # Matter detail
│   │   │   │       └── documents/
│   │   │   │           └── page.tsx   # Documents view
│   ├── components/
│   │   ├── matters/
│   │   │   ├── matter-card.tsx
│   │   │   ├── matter-form.tsx
│   │   │   ├── matter-list.tsx
│   │   │   └── participants-manager.tsx
│   │   ├── documents/
│   │   │   ├── document-list.tsx
│   │   │   ├── document-card.tsx
│   │   │   ├── document-upload.tsx    # Uses Supabase Dropzone
│   │   │   └── document-search.tsx
│   │   └── dropzone.tsx               # From Supabase UI
│   ├── hooks/
│   │   ├── use-supabase-upload.ts     # From Supabase UI
│   │   ├── use-matters.ts
│   │   └── use-documents.ts
│   └── lib/
│       └── supabase/
│           └── types.ts               # Generated types

apps/agent/
├── src/
│   ├── agent/
│   │   ├── graph.py                   # Extended with document tools
│   │   ├── prompts.py                 # Extended with Document Agent prompts
│   │   └── tools.py                   # Extended with Isaacus tools
│   ├── tools/
│   │   ├── isaacus_search.py          # NEW: Semantic search tool
│   │   ├── isaacus_extract.py         # NEW: Extractive QA tool
│   │   └── isaacus_classify.py        # NEW: Clause classification tool
│   └── services/
│       ├── isaacus_client.py          # NEW: Isaacus API wrapper
│       └── document_processor.py      # NEW: Text extraction service

supabase/
├── migrations/
│   ├── 20251223110000_create_profiles.sql        # Existing
│   ├── 20251223120000_create_matters.sql         # NEW
│   ├── 20251223120100_create_documents.sql       # NEW
│   ├── 20251223120200_create_matter_participants.sql  # NEW
│   └── 20251223120300_create_document_embeddings.sql  # NEW
└── config.toml
```

**Structure Decision**: Monorepo structure maintained per constitution. New features added to existing apps/frontend and apps/agent directories. Database migrations in supabase/migrations.

## Complexity Tracking

No constitution violations requiring justification.

## Phase 0: Research Summary

See [research.md](./research.md) for detailed findings.

### Key Decisions

| Topic               | Decision                   | Rationale                                                   |
| ------------------- | -------------------------- | ----------------------------------------------------------- |
| Text extraction     | pypdf + python-docx        | In-house, no external costs, sufficient for text-based docs |
| Embedding storage   | Supabase + Isaacus         | Embeddings stored locally, Isaacus for generation/search    |
| Document processing | Edge Function trigger      | Async processing, doesn't block upload                      |
| Semantic search     | Isaacus Embedding + Rerank | Legal-optimized, better than generic embeddings             |
| File upload         | Supabase UI Dropzone       | Production-ready, native Supabase integration               |

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) - Database schema and entity relationships
- [contracts/matters-api.md](./contracts/matters-api.md) - Matters REST API
- [contracts/documents-api.md](./contracts/documents-api.md) - Documents REST API
- [contracts/agent-tools.md](./contracts/agent-tools.md) - Agent tool specifications
- [quickstart.md](./quickstart.md) - Development setup guide
