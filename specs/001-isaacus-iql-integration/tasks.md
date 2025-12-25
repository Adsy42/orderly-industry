# Tasks: Isaacus IQL Legal Document Analysis

**Input**: Design documents from `/specs/001-isaacus-iql-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/frontend/src/`
- **Agent**: `apps/agent/src/`
- **Database**: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Note**: This feature extends existing infrastructure. No new project setup required.

- [x] T001 Verify Isaacus API key configuration in environment variables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Create database migration for `saved_iql_queries` table in `supabase/migrations/YYYYMMDDHHMMSS_create_saved_iql_queries.sql`
- [x] T003 [P] Extend `IsaacusClient` with IQL query method in `apps/agent/src/services/isaacus_client.py`
- [x] T004 [P] Create IQL query validation utility function in `apps/frontend/src/lib/iql-validation.ts`
- [x] T005 [P] Create IQL templates constant file in `apps/frontend/src/lib/iql-templates.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Analyze Legal Document with IQL Query (Priority: P1) 🎯 MVP

**Goal**: Enable users to execute IQL queries against uploaded documents to identify specific clauses with confidence scores

**Independent Test**: Upload a sample contract, run a simple IQL template query (e.g., `{IS confidentiality clause}`), and verify matching clauses are identified with confidence scores

### Implementation for User Story 1

- [x] T006 [US1] Create IQL query API route handler in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T007 [US1] Implement document text retrieval and validation in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T008 [US1] Implement document chunking logic for large documents in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T009 [US1] Integrate Isaacus API call for IQL classification in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T010 [US1] Implement result aggregation for chunked documents in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T011 [US1] Add error handling for Isaacus API failures in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T012 [US1] Create IQL query builder component in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T013 [US1] Create IQL results display component in `apps/frontend/src/components/documents/iql-results.tsx`
- [x] T014 [US1] Create IQL query page route in `apps/frontend/src/app/protected/matters/[matterId]/documents/[documentId]/iql/page.tsx`
- [x] T015 [US1] Add navigation link to IQL query page from document list in `apps/frontend/src/components/documents/document-card.tsx`
- [x] T016 [US1] Implement confidence score display with visual distinction (>70% high, <50% low) in `apps/frontend/src/components/documents/iql-results.tsx`
- [x] T017 [US1] Add loading states and error messages in IQL query components

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Use Pre-built IQL Templates (Priority: P1)

**Goal**: Enable users to select from pre-built IQL templates for common legal analysis tasks without learning IQL syntax

**Independent Test**: Select a template from a list (e.g., "confidentiality clause", "termination clause"), apply it to a document, and verify results are returned

### Implementation for User Story 2

- [x] T018 [P] [US2] Create IQL templates API route in `apps/frontend/src/app/api/iql/templates/route.ts`
- [x] T019 [US2] Create IQL template selector component in `apps/frontend/src/components/documents/iql-template-selector.tsx`
- [x] T020 [US2] Implement template categorization and display in `apps/frontend/src/components/documents/iql-template-selector.tsx`
- [x] T021 [US2] Implement parameter input for parameterized templates in `apps/frontend/src/components/documents/iql-template-selector.tsx`
- [x] T022 [US2] Integrate template selector with query builder in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T023 [US2] Add template selection to IQL query page in `apps/frontend/src/app/protected/matters/[matterId]/documents/[documentId]/iql/page.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Build Complex IQL Queries with Operators (Priority: P2)

**Goal**: Enable advanced users to combine multiple IQL statements using logical operators (AND, OR, NOT) and comparison operators

**Independent Test**: Construct a compound query like `{IS confidentiality clause} AND {IS unilateral clause}` and verify the system returns the minimum score of both conditions

### Implementation for User Story 3

- [x] T024 [US3] Extend IQL validation to support logical operators (AND, OR, NOT) in `apps/frontend/src/lib/iql-validation.ts`
- [x] T025 [US3] Extend IQL validation to support comparison operators (>, <) in `apps/frontend/src/lib/iql-validation.ts`
- [x] T026 [US3] Extend IQL validation to support averaging operator (+) in `apps/frontend/src/lib/iql-validation.ts`
- [x] T027 [US3] Implement operator precedence handling ((), +, >, <, NOT, AND, OR) in `apps/frontend/src/lib/iql-validation.ts`
- [x] T028 [US3] Update query builder to support complex queries with operators in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T029 [US3] Implement complex query execution with operator evaluation in `apps/frontend/src/app/api/iql/query/route.ts`
- [x] T030 [US3] Add operator syntax help and examples in IQL query builder UI

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - View and Export Analysis Results (Priority: P2)

**Goal**: Enable users to view IQL query results in a clear, organized format and export them for sharing

**Independent Test**: Run any IQL query and verify results display with document excerpts, scores, and export functionality

### Implementation for User Story 4

- [x] T031 [US4] Implement click-to-navigate functionality in results (navigate to document section) in `apps/frontend/src/components/documents/iql-results.tsx`
- [x] T032 [US4] Add document viewer integration for result navigation in `apps/frontend/src/components/documents/iql-results.tsx`
- [x] T033 [US4] Implement export results functionality (JSON format) in `apps/frontend/src/components/documents/iql-results.tsx`
- [x] T034 [US4] Add export button to results display component
- [x] T035 [US4] Format exported results with metadata (query, document, timestamp, scores) in export function

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Save and Reuse IQL Queries (Priority: P3)

**Goal**: Enable users to save custom IQL queries for reuse across sessions and documents

**Independent Test**: Save a custom query, refresh the page, and verify the saved query is available for reuse

### Implementation for User Story 5

- [x] T036 [US5] Create saved queries list API route in `apps/frontend/src/app/api/iql/saved/route.ts` (GET handler)
- [x] T037 [US5] Create saved query creation API route in `apps/frontend/src/app/api/iql/saved/route.ts` (POST handler)
- [x] T038 [US5] Create saved query update API route in `apps/frontend/src/app/api/iql/saved/[id]/route.ts` (PATCH handler)
- [x] T039 [US5] Create saved query deletion API route in `apps/frontend/src/app/api/iql/saved/[id]/route.ts` (DELETE handler)
- [x] T040 [US5] Create saved queries hook in `apps/frontend/src/hooks/use-saved-iql-queries.ts`
- [x] T041 [US5] Create saved queries list component in `apps/frontend/src/components/documents/saved-queries.tsx`
- [x] T042 [US5] Add save query functionality to query builder in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T043 [US5] Add apply saved query functionality to query builder in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T044 [US5] Integrate saved queries component into IQL query page in `apps/frontend/src/app/protected/matters/[matterId]/documents/[documentId]/iql/page.tsx`
- [x] T045 [US5] Add edit and delete actions to saved queries list component

**Checkpoint**: At this point, all user stories should be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T046 [P] Add TypeScript types for IQL query results in `apps/frontend/src/types/iql.ts`
- [x] T047 [P] Add TypeScript types for saved queries in `apps/frontend/src/types/iql.ts`
- [x] T048 [P] Create IQL agent tool for LangGraph in `apps/agent/src/tools/isaacus_iql.py`
- [x] T049 [P] Update agent context documentation with IQL capabilities
- [x] T050 Add comprehensive error messages for all error scenarios
- [x] T051 Add loading indicators for all async operations
- [x] T052 Add accessibility attributes to IQL components (ARIA labels, keyboard navigation)
- [x] T053 Run quickstart.md validation and update if needed
- [x] T054 Code cleanup and refactoring across IQL components
- [x] T055 Add logging for IQL query operations in API routes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 query execution but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Extends US1/US2 but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Extends US1 results display but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Uses US1 query execution but independently testable

### Within Each User Story

- API routes before frontend components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models/types within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch foundational tasks in parallel:
Task: "Extend IsaacusClient with IQL query method in apps/agent/src/services/isaacus_client.py"
Task: "Create IQL query validation utility function in apps/frontend/src/lib/iql-validation.ts"
Task: "Create IQL templates constant file in apps/frontend/src/lib/iql-templates.ts"

# After foundational, launch US1 API and components in parallel:
Task: "Create IQL query API route handler in apps/frontend/src/app/api/iql/query/route.ts"
Task: "Create IQL query builder component in apps/frontend/src/components/documents/iql-query-builder.tsx"
Task: "Create IQL results display component in apps/frontend/src/components/documents/iql-results.tsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch US2 tasks in parallel:
Task: "Create IQL templates API route in apps/frontend/src/app/api/iql/templates/route.ts"
Task: "Create IQL template selector component in apps/frontend/src/components/documents/iql-template-selector.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Core IQL query execution)
4. Complete Phase 4: User Story 2 (Templates - enables P1 functionality)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Core MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Enhanced MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Advanced queries)
5. Add User Story 4 → Test independently → Deploy/Demo (Export functionality)
6. Add User Story 5 → Test independently → Deploy/Demo (Saved queries)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Core query execution)
   - Developer B: User Story 2 (Templates) - can start in parallel
   - Developer C: User Story 3 (Operators) - can start after US1/US2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- IQL queries use existing `extracted_text` field - no document processing changes required
- All API routes require Supabase authentication (existing middleware)
- Database migration must be applied before User Story 5 implementation

---

## Task Summary

- **Total Tasks**: 55
- **Phase 1 (Setup)**: 1 task
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (User Story 1)**: 12 tasks
- **Phase 4 (User Story 2)**: 6 tasks
- **Phase 5 (User Story 3)**: 7 tasks
- **Phase 6 (User Story 4)**: 5 tasks
- **Phase 7 (User Story 5)**: 10 tasks
- **Phase 8 (Polish)**: 10 tasks

**MVP Scope**: Phases 1-4 (User Stories 1 & 2) = 23 tasks
