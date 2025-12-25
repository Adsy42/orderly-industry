# Tasks: Document Ingestion & Legal Grounding

**Input**: Design documents from `/specs/005-document-ingestion-grounding/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/frontend/src/`
- **Agent**: `apps/agent/src/`
- **Migrations**: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Python dependencies, database migrations, and project structure

- [x] T001 Install `unstructured` library and dependencies in `apps/agent/pyproject.toml`
- [x] T002 [P] Install `python-magic-bin` for file type detection in `apps/agent/pyproject.toml`
- [x] T003 [P] Install `markdownify` for HTML to markdown conversion in `apps/agent/pyproject.toml`
- [x] T004 Run `uv sync` to update agent dependencies
- [x] T005 [P] Create migration file `supabase/migrations/20251225000000_create_document_sections.sql`
- [x] T006 [P] Create migration file `supabase/migrations/20251225000100_enhance_document_chunks.sql`
- [x] T007 [P] Create migration file `supabase/migrations/20251225000200_extend_documents.sql`
- [x] T008 Create migration file `supabase/migrations/20251225000300_create_hybrid_search.sql`
- [x] T009 Apply all migrations with `supabase db push`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create `document_sections` table with tree structure in `supabase/migrations/20251225000000_create_document_sections.sql`
- [x] T011 Add RLS policies for `document_sections` table
- [x] T012 Rename `document_embeddings` to `document_chunks` and add new columns in `supabase/migrations/20251225000100_enhance_document_chunks.sql`
- [x] T013 Add `section_id`, `parent_chunk_id`, `chunk_level`, `content_hash`, `citation` columns to `document_chunks`
- [x] T014 Update RLS policies for enhanced `document_chunks` table
- [x] T015 Add `normalized_markdown`, `structure_extracted`, `extraction_quality` to `documents` table in `supabase/migrations/20251225000200_extend_documents.sql`
- [x] T016 Update `processing_status` constraint to include `structuring` state
- [x] T017 Enable `pg_trgm` extension and create trigram index in `supabase/migrations/20251225000300_create_hybrid_search.sql`
- [x] T018 Create HNSW vector index for embeddings
- [x] T019 Create `hybrid_search_chunks` PostgreSQL function
- [x] T020 Create `get_section_tree` PostgreSQL function
- [x] T021 Create `get_chunk_with_context` PostgreSQL function
- [x] T022 [P] Create TypeScript types for new entities in `apps/frontend/src/types/documents.ts`
- [x] T023 [P] Create Citation type and FormattedCitation interface in `apps/frontend/src/types/documents.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Upload Documents with Structure Detection (Priority: P1) 🎯 MVP

**Goal**: Documents are automatically parsed into hierarchical sections with page numbers and structural metadata

**Independent Test**: Upload a PDF contract, verify sections table has hierarchical records matching document headings

### Implementation for User Story 1

- [x] T024 [P] [US1] Create `StructureExtractor` service class in `apps/agent/src/services/structure_extractor.py`
- [x] T025 [US1] Implement `partition_document()` method using `unstructured` library in `apps/agent/src/services/structure_extractor.py`
- [x] T026 [US1] Implement `build_section_tree()` method to detect heading hierarchy in `apps/agent/src/services/structure_extractor.py`
- [x] T027 [US1] Implement `create_chunks_with_citations()` method in `apps/agent/src/services/structure_extractor.py`
- [x] T028 [US1] Implement `generate_content_hash()` utility for chunk verification in `apps/agent/src/services/structure_extractor.py`
- [x] T029 [P] [US1] Create `extract_document_structure` tool in `apps/agent/src/tools/extract_structure.py`
- [x] T030 [US1] Implement tool function with proper docstring and type hints in `apps/agent/src/tools/extract_structure.py`
- [x] T031 [US1] Register new tool in Document Agent tools list in `apps/agent/src/tools/__init__.py`
- [x] T032 [P] [US1] Create Next.js API route `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T033 [US1] Implement POST handler to trigger processing via LangGraph SDK in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T034 [US1] Add processing status updates (extracting → structuring → embedding) in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T035 [US1] Implement Supabase storage download and agent tool call in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T036 [US1] Store extracted sections in `document_sections` table in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T037 [US1] Store chunks with citations in `document_chunks` table in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T038 [US1] Call Isaacus Kanon 2 embedder for chunk embeddings in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T039 [US1] Update document status to `ready` on completion in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T040 [US1] Add error handling and retry logic in `apps/frontend/src/app/api/documents/process/route.ts`
- [x] T041 [P] [US1] Create `apps/frontend/src/app/api/documents/structure/route.ts` GET endpoint
- [x] T042 [US1] Implement hierarchical section tree query using `get_section_tree` function in `apps/frontend/src/app/api/documents/structure/route.ts`
- [x] T043 [P] [US1] Create `SectionTree` component in `apps/frontend/src/components/documents/section-tree.tsx`
- [x] T044 [US1] Implement collapsible tree UI with section numbers and titles in `apps/frontend/src/components/documents/section-tree.tsx`
- [ ] T045 [US1] Connect to document detail page to show structure in `apps/frontend/src/app/protected/matters/[matterId]/documents/[documentId]/page.tsx`

**Checkpoint**: Document upload triggers structure extraction and stores hierarchical sections

---

## Phase 4: User Story 2 - Search with Precise Citations (Priority: P1)

**Goal**: Search results include document name, page number, and section path in legal citation format

**Independent Test**: Search for "governing law", verify results show "Contract.pdf, p.12, § 7.2 Governing Law" format

### Implementation for User Story 2

- [x] T046 [P] [US2] Create citation formatter utility in `apps/frontend/src/lib/citation-formatter.ts`
- [x] T047 [US2] Implement `formatCitation()` function for legal-style citations in `apps/frontend/src/lib/citation-formatter.ts`
- [x] T048 [US2] Implement `formatCitationShort()` for inline references in `apps/frontend/src/lib/citation-formatter.ts`
- [x] T049 [US2] Implement `buildCitationLink()` for clickable navigation in `apps/frontend/src/lib/citation-formatter.ts`
- [x] T050 [P] [US2] Create `apps/frontend/src/app/api/documents/search/route.ts` POST endpoint
- [x] T051 [US2] Implement query embedding via Isaacus client in `apps/frontend/src/app/api/documents/search/route.ts`
- [x] T052 [US2] Call `hybrid_search_chunks` RPC function with matter scope in `apps/frontend/src/app/api/documents/search/route.ts`
- [x] T053 [US2] Call Isaacus reranking API on results in `apps/frontend/src/app/api/documents/search/route.ts`
- [x] T054 [US2] Format citations for each result using citation formatter in `apps/frontend/src/app/api/documents/search/route.ts`
- [x] T055 [US2] Return results with formatted citations and parent context in `apps/frontend/src/app/api/documents/search/route.ts`
- [x] T056 [P] [US2] Create `CitationLink` component in `apps/frontend/src/components/documents/citation-link.tsx`
- [x] T057 [US2] Implement clickable citation with tooltip preview in `apps/frontend/src/components/documents/citation-link.tsx`
- [x] T058 [US2] Add navigation to document viewer with section highlight in `apps/frontend/src/components/documents/citation-link.tsx`
- [ ] T059 [US2] Update `DocumentSearch` component to use new search endpoint in `apps/frontend/src/components/documents/document-search.tsx`
- [ ] T060 [US2] Display search results with formatted citations in `apps/frontend/src/components/documents/document-search.tsx`
- [ ] T061 [P] [US2] Create `apps/frontend/src/app/api/documents/[id]/sections/[sectionId]/route.ts` GET endpoint
- [ ] T062 [US2] Implement section retrieval with sibling context in `apps/frontend/src/app/api/documents/[id]/sections/[sectionId]/route.ts`

**Checkpoint**: Search returns results with legal-style citations, clicking citations navigates to source

---

## Phase 5: User Story 3 - AI Grounded Responses with Citations (Priority: P1)

**Goal**: AI responses include inline citations for every claim about document contents

**Independent Test**: Ask AI "What is the notice period?", verify response includes citation like "[Contract.pdf, p.8, § 5.2]"

### Implementation for User Story 3

- [x] T063 [P] [US3] Enhance `isaacus_search` tool with citation formatting in `apps/agent/src/tools/isaacus_search.py`
- [x] T064 [US3] Update search output to include formatted citations for each result in `apps/agent/src/tools/isaacus_search.py`
- [x] T065 [US3] Add parent context expansion to search results in `apps/agent/src/tools/isaacus_search.py`
- [x] T066 [P] [US3] Enhance `isaacus_extract` tool with structural citation mapping in `apps/agent/src/tools/isaacus_extract.py`
- [x] T067 [US3] Implement `find_citation_for_answer()` to map extracted text to chunk citations in `apps/agent/src/tools/isaacus_extract.py`
- [x] T068 [US3] Format extraction output with citation in legal style in `apps/agent/src/tools/isaacus_extract.py`
- [ ] T069 [US3] Update Document Agent system prompt to always include citations in `apps/agent/src/agents/document_agent.py`
- [ ] T070 [US3] Add instruction for "information not found" responses in `apps/agent/src/agents/document_agent.py`
- [ ] T071 [US3] Update orchestrator prompts to delegate document queries to Document Agent in `apps/agent/src/agent/prompts.py`
- [ ] T072 [P] [US3] Create `apps/frontend/src/app/api/documents/[id]/chunks/[chunkId]/route.ts` GET endpoint
- [ ] T073 [US3] Implement chunk retrieval with content hash verification in `apps/frontend/src/app/api/documents/[id]/chunks/[chunkId]/route.ts`
- [ ] T074 [US3] Add context expansion (parent + siblings) to response in `apps/frontend/src/app/api/documents/[id]/chunks/[chunkId]/route.ts`
- [ ] T075 [US3] Update AI message rendering to detect and linkify citations in `apps/frontend/src/components/thread/messages/ai.tsx`
- [ ] T076 [US3] Parse citation patterns like "[Document.pdf, p.X, § Y.Z]" in AI responses in `apps/frontend/src/components/thread/messages/ai.tsx`
- [ ] T077 [US3] Render citations as clickable `CitationLink` components in `apps/frontend/src/components/thread/messages/ai.tsx`

**Checkpoint**: AI responses include verifiable inline citations, clicking opens source document

---

## Phase 6: User Story 4 - Document Normalization (Priority: P2)

**Goal**: Documents are converted to clean markdown format for optimal LLM context

**Independent Test**: Upload PDF, verify `normalized_markdown` field contains clean markdown with proper heading levels

### Implementation for User Story 4

- [ ] T078 [P] [US4] Implement `generate_normalized_markdown()` in `apps/agent/src/services/structure_extractor.py`
- [ ] T079 [US4] Convert headings to markdown format (# ## ###) in `apps/agent/src/services/structure_extractor.py`
- [ ] T080 [US4] Convert tables to markdown table format in `apps/agent/src/services/structure_extractor.py`
- [ ] T081 [US4] Convert lists to markdown list format in `apps/agent/src/services/structure_extractor.py`
- [ ] T082 [US4] Remove noise (headers, footers, page numbers) from content in `apps/agent/src/services/structure_extractor.py`
- [ ] T083 [US4] Store normalized markdown in `documents.normalized_markdown` field in `apps/frontend/src/app/api/documents/process/route.ts`
- [ ] T084 [US4] Calculate and store extraction quality score in `apps/frontend/src/app/api/documents/process/route.ts`
- [ ] T085 [US4] Update agent tools to use normalized markdown for context in `apps/agent/src/tools/get_document_text.py`

**Checkpoint**: Documents have clean markdown representation stored and used for AI context

---

## Phase 7: User Story 5 - Parent-Child Context Expansion (Priority: P2)

**Goal**: Search results include surrounding context from parent section

**Independent Test**: Search matches paragraph 7.2.3, verify parent section 7.2 content is included in results

### Implementation for User Story 5

- [ ] T086 [US5] Update `hybrid_search_chunks` function to return `parent_content` in `supabase/migrations/20251225000300_create_hybrid_search.sql`
- [ ] T087 [US5] Add `include_context` parameter to control context expansion in search function
- [ ] T088 [P] [US5] Create expandable search result component in `apps/frontend/src/components/documents/search-result-card.tsx`
- [ ] T089 [US5] Show matched chunk with "Show context" expand button in `apps/frontend/src/components/documents/search-result-card.tsx`
- [ ] T090 [US5] Display parent section and sibling chunks on expand in `apps/frontend/src/components/documents/search-result-card.tsx`
- [ ] T091 [US5] Update search API to pass `include_context` option in `apps/frontend/src/app/api/documents/search/route.ts`
- [ ] T092 [US5] Update `isaacus_search` tool to include parent context in output in `apps/agent/src/tools/isaacus_search.py`

**Checkpoint**: Search results show context, users can expand to see surrounding paragraphs

---

## Phase 8: User Story 6 - Hybrid Search for Legal Terms (Priority: P2)

**Goal**: Exact legal term matches (§ references, case citations) appear first in results

**Independent Test**: Search for "§ 512(c)", verify exact matches rank higher than semantic-only matches

### Implementation for User Story 6

- [ ] T093 [US6] Verify pg_trgm index is created on `document_chunks.content` in `supabase/migrations/20251225000300_create_hybrid_search.sql`
- [ ] T094 [US6] Add `semantic_weight` parameter to search API in `apps/frontend/src/app/api/documents/search/route.ts`
- [ ] T095 [US6] Expose semantic/keyword weight slider in search UI in `apps/frontend/src/components/documents/document-search.tsx`
- [ ] T096 [US6] Add presets for "Semantic" (0.9), "Balanced" (0.7), "Exact" (0.3) in `apps/frontend/src/components/documents/document-search.tsx`
- [ ] T097 [US6] Update `isaacus_search` tool to accept `semantic_weight` parameter in `apps/agent/src/tools/isaacus_search.py`
- [ ] T098 [US6] Auto-detect legal term patterns (§, v., citations) and adjust weight in `apps/agent/src/tools/isaacus_search.py`

**Checkpoint**: Hybrid search balances semantic and keyword matching, legal terms get exact matches

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T099 [P] Deprecate Supabase Edge Function `process-document` (keep for rollback)
- [ ] T100 [P] Update document upload hook to trigger new processing endpoint in `apps/frontend/src/hooks/use-documents.ts`
- [ ] T101 Create background job for migrating existing documents in `apps/frontend/src/app/api/documents/migrate/route.ts`
- [ ] T102 Add migration progress tracking UI in `apps/frontend/src/app/protected/matters/[matterId]/page.tsx`
- [ ] T103 [P] Add loading states for structure extraction in `apps/frontend/src/components/documents/document-card.tsx`
- [ ] T104 [P] Add error states and retry UI for failed processing in `apps/frontend/src/components/documents/document-card.tsx`
- [ ] T105 Update existing document list to show structure status in `apps/frontend/src/components/documents/document-list.tsx`
- [ ] T106 Add "Re-process" button for error documents in `apps/frontend/src/components/documents/document-list.tsx`
- [ ] T107 [P] Add structured logging for document processing in `apps/frontend/src/app/api/documents/process/route.ts`
- [ ] T108 Run quickstart.md validation steps to verify feature completeness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - US1 (Phase 3): No dependencies on other stories
  - US2 (Phase 4): Can run parallel with US1, uses same infrastructure
  - US3 (Phase 5): Depends on US2 (uses citation formatting)
  - US4 (Phase 6): No dependencies, can run parallel
  - US5 (Phase 7): Depends on US2 (extends search)
  - US6 (Phase 8): Depends on US2 (extends search)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational)
         │
         ▼
    ┌────┴────┐
    │         │
    ▼         ▼
  US1       US4 (parallel)
    │
    ▼
  US2 ───────────────┐
    │                │
    ├────┬───────────┤
    ▼    ▼           ▼
  US3   US5         US6 (parallel)
    │    │           │
    └────┴───────────┘
              │
              ▼
         Phase 9 (Polish)
```

### Parallel Opportunities

**Phase 1 (Setup)**:

- T001-T003: All dependencies can be added in parallel
- T005-T008: All migration files can be created in parallel

**Phase 2 (Foundational)**:

- T022, T023: TypeScript types can be created in parallel with migrations

**Phase 3 (US1)**:

- T024, T029, T032, T041, T043: Separate files, can run in parallel

**Phase 4 (US2)**:

- T046, T050, T056, T061: Separate files, can run in parallel

**Phase 5 (US3)**:

- T063, T066, T072: Separate files, can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch in parallel (different files):
Task: T024 "Create StructureExtractor service in apps/agent/src/services/structure_extractor.py"
Task: T029 "Create extract_document_structure tool in apps/agent/src/tools/extract_document_structure.py"
Task: T032 "Create Next.js API route apps/frontend/src/app/api/documents/process/route.ts"
Task: T041 "Create GET endpoint apps/frontend/src/app/api/documents/[id]/structure/route.ts"
Task: T043 "Create SectionTree component in apps/frontend/src/components/documents/section-tree.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 - Document Structure Detection
4. **STOP and VALIDATE**: Upload document, verify sections extracted
5. Complete Phase 4: US2 - Search with Citations
6. **STOP and VALIDATE**: Search returns formatted citations
7. Complete Phase 5: US3 - AI Grounded Responses
8. **STOP and VALIDATE**: AI responses include citations
9. Deploy MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Documents show structure
3. Add US2 → Test independently → Search shows citations
4. Add US3 → Test independently → AI cites sources (MVP Complete!)
5. Add US4 → Improved LLM context efficiency
6. Add US5 → Richer search context
7. Add US6 → Better legal term matching

---

## Summary

| Phase                 | Stories | Task Count |
| --------------------- | ------- | ---------- |
| Phase 1: Setup        | -       | 9          |
| Phase 2: Foundational | -       | 14         |
| Phase 3: US1          | US1     | 22         |
| Phase 4: US2          | US2     | 17         |
| Phase 5: US3          | US3     | 15         |
| Phase 6: US4          | US4     | 8          |
| Phase 7: US5          | US5     | 7          |
| Phase 8: US6          | US6     | 6          |
| Phase 9: Polish       | -       | 10         |
| **Total**             |         | **108**    |

**MVP Scope**: Phases 1-5 (US1 + US2 + US3) = 77 tasks
**Suggested MVP Focus**: Complete US1 first (45 tasks through Phase 3)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story is independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story
- Avoid cross-story dependencies that break independence
