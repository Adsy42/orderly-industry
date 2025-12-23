# Tasks: Matters & Document Management Foundation

**Input**: Design documents from `/specs/004-matters-documents/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: Not explicitly requested - omitted per spec guidelines.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/frontend/src/`
- **Agent**: `apps/agent/src/`
- **Migrations**: `supabase/migrations/`
- **Edge Functions**: `supabase/functions/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and shared components

- [x] T001 Enable pgvector extension in Supabase project
- [x] T002 [P] Add Python dependencies (pypdf, python-docx) to apps/agent/pyproject.toml
- [x] T003 [P] Copy Supabase UI Dropzone component to apps/frontend/src/components/dropzone.tsx
- [x] T004 [P] Copy useSupabaseUpload hook to apps/frontend/src/hooks/use-supabase-upload.ts
- [x] T005 [P] Add ISAACUS_API_KEY and ISAACUS_BASE_URL to apps/agent/.env.example
- [x] T006 Generate TypeScript types from Supabase schema to apps/frontend/src/lib/supabase/types.ts

---

## Phase 2: Foundational (Database & Storage)

**Purpose**: Database schema and storage bucket - MUST complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create migration 20251223120000_create_matters.sql in supabase/migrations/ with matters table, sequence, and RLS policies per data-model.md
- [x] T008 Create migration 20251223120100_create_documents.sql in supabase/migrations/ with documents table and RLS policies per data-model.md
- [x] T009 Create migration 20251223120200_create_matter_participants.sql in supabase/migrations/ with participants table and RLS policies per data-model.md
- [x] T010 Create migration 20251223120300_create_document_embeddings.sql in supabase/migrations/ with embeddings table (vector column) and RLS policies per data-model.md
- [x] T011 Create migration 20251223120400_create_storage_bucket.sql in supabase/migrations/ with documents bucket and storage policies
- [x] T012 Create user_can_access_matter() helper function in supabase/migrations/
- [x] T013 Create match_document_embeddings() RPC function in supabase/migrations/
- [x] T014 Apply all migrations: run `supabase migration up`
- [x] T015 Regenerate TypeScript types after migrations: run `supabase gen types typescript`

**Checkpoint**: Database and storage ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Manage Matters (P1) 🎯 MVP

**Goal**: Counsel can create, view, edit, and delete matters to organize their work

**Independent Test**: Create a matter, see it in list, edit title/status, delete it

### Implementation for User Story 1

- [x] T016 [P] [US1] Create use-matters hook in apps/frontend/src/hooks/use-matters.ts with CRUD operations
- [x] T017 [P] [US1] Create MatterCard component in apps/frontend/src/components/matters/matter-card.tsx
- [x] T018 [P] [US1] Create MatterForm component in apps/frontend/src/components/matters/matter-form.tsx
- [x] T019 [US1] Create MatterList component in apps/frontend/src/components/matters/matter-list.tsx using MatterCard
- [x] T020 [US1] Create matters list page in apps/frontend/src/app/protected/matters/page.tsx
- [x] T021 [US1] Create matter detail page in apps/frontend/src/app/protected/matters/[matterId]/page.tsx
- [x] T022 [US1] Add "New Matter" button and form dialog to matters list page
- [x] T023 [US1] Add edit functionality to matter detail page with status dropdown (active/closed/archived)
- [x] T024 [US1] Add delete functionality with confirmation dialog to matter detail page
- [x] T025 [US1] Add navigation link to matters from main protected layout in apps/frontend/src/app/protected/layout.tsx

**Checkpoint**: User Story 1 complete - counsel can manage matters independently

---

## Phase 4: User Story 2 - Upload Documents to Matters (P1)

**Goal**: Counsel can upload PDF, DOCX, TXT files to matters via drag-and-drop

**Independent Test**: Upload files to a matter, see them listed with metadata

### Implementation for User Story 2

- [x] T026 [P] [US2] Create use-documents hook in apps/frontend/src/hooks/use-documents.ts with list/create/delete operations
- [x] T027 [P] [US2] Create DocumentCard component in apps/frontend/src/components/documents/document-card.tsx with file type icon and status indicator
- [x] T028 [US2] Create DocumentList component in apps/frontend/src/components/documents/document-list.tsx using DocumentCard
- [x] T029 [US2] Create DocumentUpload component in apps/frontend/src/components/documents/document-upload.tsx using Dropzone with matter_id path
- [x] T030 [US2] Extend use-supabase-upload hook to create document record after successful upload
- [x] T031 [US2] Add document upload area to matter detail page in apps/frontend/src/app/protected/matters/[matterId]/page.tsx
- [x] T032 [US2] Add document list to matter detail page showing all documents with status
- [x] T033 [US2] Add document download functionality via signed URL
- [x] T034 [US2] Add document delete functionality with confirmation
- [x] T035 [US2] Add file type validation for PDF, DOCX, TXT with error messages

**Checkpoint**: User Story 2 complete - counsel can upload and manage documents

---

## Phase 5: User Story 3 - Document Processing & Embedding (P1)

**Goal**: Uploaded documents are automatically processed for text extraction and embedding generation

**Independent Test**: Upload document, verify status changes from pending → processing → ready, check extracted_text populated

### Implementation for User Story 3

- [x] T036 [P] [US3] Create IsaacusClient service in apps/agent/src/services/isaacus_client.py with embed(), rerank(), extract(), classify() methods
- [x] T037 [P] [US3] Create DocumentProcessor service in apps/agent/src/services/document_processor.py with extract_text() for PDF/DOCX/TXT
- [x] T038 [US3] Create Edge Function process-document in supabase/functions/process-document/index.ts
- [x] T039 [US3] Implement text extraction in Edge Function using document_processor service
- [x] T040 [US3] Implement embedding generation in Edge Function using isaacus_client.embed()
- [x] T041 [US3] Implement chunk storage in document_embeddings table (~500 token chunks)
- [x] T042 [US3] Add retry logic (3 attempts) for Isaacus API calls in Edge Function
- [x] T043 [US3] Create database webhook trigger for documents INSERT to call Edge Function
- [x] T044 [US3] Deploy Edge Function: run `supabase functions deploy process-document`
- [x] T045 [US3] Add real-time status updates to DocumentCard component using Supabase subscription
- [x] T046 [US3] Add error message display when processing_status is 'error'

**Checkpoint**: User Story 3 complete - documents are processed and searchable

---

## Phase 6: User Story 4 - Semantic Search Within a Matter (P2)

**Goal**: Counsel can search documents using natural language, finding results by meaning

**Independent Test**: Upload documents, search with query that doesn't match exact text, verify relevant results returned

### Implementation for User Story 4

- [x] T047 [P] [US4] Create DocumentSearch component in apps/frontend/src/components/documents/document-search.tsx with search input
- [x] T048 [P] [US4] Create API route /api/embed in apps/frontend/src/app/api/embed/route.ts to call Isaacus embed
- [x] T049 [US4] Extend use-documents hook with searchDocuments() using match_document_embeddings RPC
- [x] T050 [US4] Add search UI to matter detail page with results display
- [x] T051 [US4] Display search results with document name, excerpt, and similarity score
- [x] T052 [US4] Add excerpt highlighting in search results
- [x] T053 [US4] Add "No results found" empty state
- [x] T054 [US4] Add fallback to full-text search when semantic search fails
- [x] T055 [US4] Add click-to-open functionality on search results

**Checkpoint**: User Story 4 complete - semantic search functional

---

## Phase 7: User Story 5 - Matter Participants and Access Control (P2)

**Goal**: Counsel can invite team members with specific roles (counsel/client/observer)

**Independent Test**: Add participant with observer role, verify they can view but not upload

### Implementation for User Story 5

- [x] T056 [P] [US5] Create use-participants hook in apps/frontend/src/hooks/use-participants.ts
- [x] T057 [US5] Create ParticipantsManager component in apps/frontend/src/components/matters/participants-manager.tsx
- [x] T058 [US5] Add participant list display with role badges
- [x] T059 [US5] Add invite participant form with email input and role dropdown
- [x] T060 [US5] Add remove participant functionality (owner only)
- [x] T061 [US5] Add change role functionality (owner only)
- [x] T062 [US5] Add "Manage Participants" button to matter detail page
- [x] T063 [US5] Update document upload to check participant role permissions
- [x] T064 [US5] Update document delete to check participant role permissions

**Checkpoint**: User Story 5 complete - collaboration with access control functional

---

## Phase 8: User Story 6 - AI Document Analysis with Extractive QA (P2)

**Goal**: AI can extract precise answers from documents with citations

**Independent Test**: Ask AI about document contents, receive answer with document/page citation

### Implementation for User Story 6

- [x] T065 [P] [US6] Create isaacus_extract tool in apps/agent/src/tools/isaacus_extract.py per contracts/agent-tools.md
- [x] T066 [US6] Add isaacus_extract to agent tools in apps/agent/src/tools/**init**.py
- [x] T067 [US6] Update agent graph to include isaacus_extract tool in apps/agent/src/agent/graph.py
- [x] T068 [US6] Format extraction responses with document name, page, and section citations
- [x] T069 [US6] Add "not found" response when answer not in documents

**Checkpoint**: User Story 6 complete - extractive QA functional

---

## Phase 9: User Story 7 - Clause Classification and Extraction (P2)

**Goal**: AI can identify and classify contract clauses (termination, indemnity, liability, etc.)

**Independent Test**: Upload contract, request clause analysis, receive structured clause list

### Implementation for User Story 7

- [x] T070 [P] [US7] Create isaacus_classify tool in apps/agent/src/tools/isaacus_classify.py per contracts/agent-tools.md
- [x] T071 [US7] Add isaacus_classify to agent tools in apps/agent/src/tools/**init**.py
- [x] T072 [US7] Update agent graph to include isaacus_classify tool in apps/agent/src/agent/graph.py
- [x] T073 [US7] Add default clause types list (termination, indemnity, liability, confidentiality, etc.)
- [x] T074 [US7] Format clause responses with clause type, text, and location

**Checkpoint**: User Story 7 complete - clause classification functional

---

## Phase 10: User Story 8 - Natural Language Document Queries (P3)

**Goal**: AI can answer conversational questions about matter documents with citations

**Independent Test**: Ask complex question about documents, receive comprehensive answer with sources

### Implementation for User Story 8

- [x] T075 [P] [US8] Create isaacus_search tool in apps/agent/src/tools/isaacus_search.py per contracts/agent-tools.md
- [x] T076 [US8] Add isaacus_search to agent tools in apps/agent/src/tools/**init**.py
- [x] T077 [US8] Create Document Agent subagent configuration in apps/agent/src/agents/document_agent.py
- [x] T078 [US8] Add DOCUMENT_AGENT_INSTRUCTIONS to apps/agent/src/agents/document_agent.py
- [x] T079 [US8] Register Document Agent with orchestrator subagents list in apps/agent/src/agents/**init**.py
- [x] T080 [US8] Update orchestrator to delegate document tasks to Document Agent

**Checkpoint**: User Story 8 complete - natural language document queries functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T081 [P] Add loading states to all async operations in frontend components
- [x] T082 [P] Add error boundaries to matter and document pages
- [x] T083 Add empty state illustrations for matters list and document list
- [x] T084 Add matter document count to matter card in list view
- [x] T085 Add keyboard shortcuts for common actions (Cmd+N for new matter)
- [x] T086 Optimize RLS policies with proper indexes per data-model.md
- [x] T087 Run quickstart.md validation to verify setup works end-to-end
- [x] T088 Update README.md with matters and documents feature documentation
- [x] T089 [NEW] Add navigation header with matters link to protected layout

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────► Phase 2 (Foundational) ─────────┬─► Phase 3 (US1: Matters) 🎯 MVP
                                                           ├─► Phase 4 (US2: Upload)
                                                           ├─► Phase 5 (US3: Processing)
                                                           │
                                                           │   [After US3 complete]
                                                           ├─► Phase 6 (US4: Search)
                                                           ├─► Phase 7 (US5: Participants)
                                                           ├─► Phase 8 (US6: Extract)
                                                           ├─► Phase 9 (US7: Classify)
                                                           │
                                                           │   [After US4, US6, US7 complete]
                                                           └─► Phase 10 (US8: NL Queries)

Phase 11 (Polish) ◄──────── All desired user stories complete
```

### User Story Dependencies

| Story                  | Depends On    | Can Start After                                |
| ---------------------- | ------------- | ---------------------------------------------- |
| **US1** (Matters)      | Foundational  | Phase 2 complete                               |
| **US2** (Upload)       | US1           | Phase 3 complete (needs matter to upload to)   |
| **US3** (Processing)   | US2           | Phase 4 complete (needs documents to process)  |
| **US4** (Search)       | US3           | Phase 5 complete (needs embeddings for search) |
| **US5** (Participants) | US1           | Phase 3 complete (needs matters to share)      |
| **US6** (Extract QA)   | US3           | Phase 5 complete (needs extracted text)        |
| **US7** (Classify)     | US3           | Phase 5 complete (needs extracted text)        |
| **US8** (NL Queries)   | US4, US6, US7 | All tools ready for Document Agent             |

### Within Each User Story

- Models/migrations before services
- Services before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (all [P] tasks)**:

```
T002, T003, T004, T005 can run in parallel
```

**Phase 3 (US1 models)**:

```
T016, T017, T018 can run in parallel
```

**Phase 4 (US2 components)**:

```
T026, T027 can run in parallel
```

**Phase 5 (US3 services)**:

```
T036, T037 can run in parallel
```

**P2 Stories (after US3)**:

```
US4, US5, US6, US7 can run in parallel by different developers
```

---

## Parallel Example: Phase 5 (US3)

```bash
# Launch both services in parallel:
Task: "Create IsaacusClient service in apps/agent/src/services/isaacus_client.py"
Task: "Create DocumentProcessor service in apps/agent/src/services/document_processor.py"

# Then sequentially:
Task: "Create Edge Function process-document..."
Task: "Implement text extraction in Edge Function..."
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Matters
4. Complete Phase 4: User Story 2 - Upload
5. Complete Phase 5: User Story 3 - Processing
6. **STOP and VALIDATE**: Test matters → upload → processing flow
7. Deploy/demo if ready - this is a functional MVP!

### Incremental Delivery

| Milestone         | User Stories    | Value Delivered                       |
| ----------------- | --------------- | ------------------------------------- |
| **MVP**           | US1 + US2 + US3 | Matters + Documents with processing   |
| **Search**        | + US4           | Semantic search across documents      |
| **Collaboration** | + US5           | Team access with roles                |
| **AI Analysis**   | + US6 + US7     | Extractive QA + Clause classification |
| **Full Product**  | + US8           | Natural language document queries     |

### Parallel Team Strategy

With 3 developers after Phase 2:

- **Developer A**: US1 → US2 → US3 (core flow, sequential)
- **Developer B**: US5 (after US1) → US6 (after US3)
- **Developer C**: US4 (after US3) → US7 (after US3)

---

## Summary

| Metric                 | Count |
| ---------------------- | ----- |
| **Total Tasks**        | 88    |
| **Setup Phase**        | 6     |
| **Foundational Phase** | 9     |
| **User Story 1 (P1)**  | 10    |
| **User Story 2 (P1)**  | 10    |
| **User Story 3 (P1)**  | 11    |
| **User Story 4 (P2)**  | 9     |
| **User Story 5 (P2)**  | 9     |
| **User Story 6 (P2)**  | 5     |
| **User Story 7 (P2)**  | 5     |
| **User Story 8 (P3)**  | 6     |
| **Polish Phase**       | 8     |

**MVP Scope**: Phases 1-5 (US1 + US2 + US3) = **46 tasks**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Edge Function requires `supabase functions deploy` after changes
- TypeScript types must be regenerated after migration changes
