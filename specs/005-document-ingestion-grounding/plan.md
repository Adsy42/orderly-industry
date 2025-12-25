# Implementation Plan: Document Ingestion & Legal Grounding

**Branch**: `005-document-ingestion-grounding` | **Date**: 2024-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-document-ingestion-grounding/spec.md`

## Summary

Refactor document ingestion from Supabase Edge Functions to Next.js API routes, implementing hierarchical document structure with structural citations for precision legal grounding. The Python agent will handle structure extraction via the `unstructured` library, while Next.js coordinates processing and stores results in Supabase with enhanced pgvector schema.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js), Python 3.11+ (Agent)
**Primary Dependencies**: Next.js 15, LangGraph, Supabase JS, unstructured (Python), Isaacus SDK
**Storage**: Supabase PostgreSQL with pgvector extension
**Testing**: Jest (frontend), pytest (agent)
**Target Platform**: Vercel (Next.js), LangSmith (Python agent)
**Project Type**: Web application (monorepo: frontend + agent)
**Performance Goals**: Document processing < 90s for 100 pages, search < 3s
**Constraints**: Supabase function timeout limits, Isaacus API rate limits
**Scale/Scope**: Existing user base, ~100 documents per matter maximum

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                      | Status  | Notes                                                                    |
| ------------------------------ | ------- | ------------------------------------------------------------------------ |
| **Monorepo Architecture**      | ✅ PASS | Changes in `apps/frontend/` and `apps/agent/`, migrations in `supabase/` |
| **Authentication-First**       | ✅ PASS | All endpoints require auth, RLS on all tables                            |
| **Security by Default**        | ✅ PASS | RLS enabled, SECURITY INVOKER functions, no secrets in code              |
| **Research Agent Patterns**    | ✅ PASS | Extends existing Document Agent with new tools                           |
| **Simplicity Over Complexity** | ✅ PASS | Reuses existing patterns, minimal new abstractions                       |

**Post-Design Re-check**: ✅ All gates pass after Phase 1 design review.

## Project Structure

### Documentation (this feature)

```text
specs/005-document-ingestion-grounding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── documents-api.md # Next.js API route contracts
│   └── agent-tools.md   # Python agent tool contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── documents/
│   │           ├── process/
│   │           │   └── route.ts          # POST - trigger processing
│   │           ├── [id]/
│   │           │   ├── structure/
│   │           │   │   └── route.ts      # GET - document section tree
│   │           │   └── sections/
│   │           │       └── [sectionId]/
│   │           │           └── route.ts  # GET - section with context
│   │           └── search/
│   │               └── route.ts          # POST - hybrid search
│   ├── components/
│   │   └── documents/
│   │       ├── citation-link.tsx         # Clickable citation component
│   │       └── section-tree.tsx          # Hierarchical section viewer
│   └── lib/
│       ├── document-processor.ts         # Processing orchestration
│       └── citation-formatter.ts         # Citation formatting utilities

apps/agent/
├── src/
│   ├── services/
│   │   └── structure_extractor.py        # unstructured library wrapper
│   └── tools/
│       ├── extract_document_structure.py # New tool for structure extraction
│       └── isaacus_search.py             # Enhanced with hybrid search

supabase/
└── migrations/
    ├── 20251225000000_create_document_sections.sql
    ├── 20251225000100_enhance_document_chunks.sql
    └── 20251225000200_create_hybrid_search_function.sql
```

**Structure Decision**: Web application pattern with frontend API routes coordinating the Python agent for document processing. This leverages the existing monorepo architecture while moving processing logic from Supabase Edge Functions to the more capable Next.js/Python stack.

## Architecture Decision: Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENT PROCESSING FLOW                          │
│                                                                          │
│  1. Upload (existing)     2. Process Trigger      3. Structure Extract   │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Frontend Upload  │───▶│ Next.js API      │───▶│ Python Agent     │   │
│  │ → Supabase       │    │ /api/documents/  │    │ extract_document_│   │
│  │   Storage        │    │ process          │    │ structure tool   │   │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘   │
│                                                           │              │
│  4. Embed & Store         5. Update Status               │              │
│  ┌──────────────────┐    ┌──────────────────┐           │              │
│  │ Isaacus Kanon 2  │◀───│ Store sections,  │◀──────────┘              │
│  │ Embeddings       │───▶│ chunks, citations│                          │
│  └──────────────────┘    └──────────────────┘                          │
│                                   │                                      │
│                                   ▼                                      │
│                          ┌──────────────────┐                           │
│                          │ Supabase pgvector│                           │
│                          │ + RLS policies   │                           │
│                          └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

| Decision                 | Choice                         | Rationale                                                     |
| ------------------------ | ------------------------------ | ------------------------------------------------------------- |
| **Structure extraction** | Python agent via LangGraph SDK | `unstructured` library is Python-only, agent already deployed |
| **Processing trigger**   | Next.js API route              | Replaces Edge Function, better error handling                 |
| **Hybrid search**        | pgvector + pg_trgm             | Native PostgreSQL, no additional infrastructure               |
| **Citation storage**     | JSONB column                   | Flexible schema for different citation formats                |
| **Parent-child chunks**  | Self-referencing foreign key   | Simple tree structure in single table                         |

## Migration Strategy

1. **Phase 1**: Deploy new tables (sections, enhanced chunks) alongside existing
2. **Phase 2**: Deploy new API routes and agent tools
3. **Phase 3**: Migrate existing documents via background job
4. **Phase 4**: Deprecate Edge Function (keep for rollback)
5. **Phase 5**: Remove Edge Function after validation

## Complexity Tracking

No constitution violations requiring justification. The design follows existing patterns and adds minimal new abstractions.
