# Tasks: Isaacus Agent Enhancement

**Input**: Design documents from `/specs/002-isaacus-agent-enhancement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in spec, so not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Note**: This feature extends existing codebase - no new project setup required. All infrastructure already exists.

- [x] T001 Verify existing `isaacus_iql.py` tool exists and is functional in `apps/agent/src/tools/isaacus_iql.py`
- [x] T002 Verify IQL templates are available in `apps/frontend/src/lib/iql-templates.ts`
- [x] T003 [P] Verify Thread provider exists in `apps/frontend/src/providers/Thread.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Wire up `isaacus_iql` tool to `ISAACUS_TOOLS` in `apps/agent/src/tools/__init__.py`
- [x] T005 Update document agent instructions with IQL tool selection guidance in `apps/agent/src/agents/document_agent.py`

**Checkpoint**: Foundation ready - IQL tool is now available to agent. User story implementation can now begin.

---

## Phase 3: User Story 1 - Conversational IQL Analysis (Priority: P1) 🎯 MVP

**Goal**: Enable users to ask natural language questions about legal clauses in chat and receive IQL-based analysis results with probability scores.

**Independent Test**: Upload a contract document, ask in chat "Find all confidentiality clauses", verify agent uses IQL tool and returns scored results.

### Implementation for User Story 1

- [x] T006 [US1] Add IQL tool to tool selection table in document agent instructions in `apps/agent/src/agents/document_agent.py`
- [x] T007 [US1] Add IQL usage examples and score interpretation guidance to document agent instructions in `apps/agent/src/agents/document_agent.py`
- [x] T008 [US1] Add tool selection heuristics (IQL vs classify vs search) to document agent instructions in `apps/agent/src/agents/document_agent.py`
- [ ] T009 [US1] Test agent can translate "Find termination clauses" to IQL query `{IS termination clause}`
- [ ] T010 [US1] Test agent can construct compound queries like `{IS unilateral clause} AND {IS clause obligating "Customer"}`

**Checkpoint**: At this point, User Story 1 should be fully functional - users can ask clause questions in chat and get IQL results.

---

## Phase 4: User Story 2 - Document-Aware Context (Priority: P1)

**Goal**: When viewing a specific document, chat questions automatically target that document without requiring manual document selection.

**Independent Test**: Open a document in viewer, ask "What are the payment terms?", verify agent queries only that specific document.

### Implementation for User Story 2

- [x] T011 [US2] Update Thread provider to build context message with optional document_id in `apps/frontend/src/components/thread/index.tsx`
- [x] T012 [US2] Pass document_id and document_name from document viewer page to Thread provider in `apps/frontend/src/components/thread/index.tsx` (via query params)
- [x] T013 [US2] Update document agent instructions to parse document_id from context message in `apps/agent/src/agents/document_agent.py`
- [x] T014 [US2] Update document agent instructions to use document_ids filter when document context is provided in `apps/agent/src/agents/document_agent.py`
- [ ] T015 [US2] Test context message includes document_id when viewing specific document
- [ ] T016 [US2] Test agent uses document_ids filter when document context is present
- [ ] T017 [US2] Test agent searches all documents when no document context (matter overview)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - conversational IQL with document-aware targeting.

---

## Phase 5: User Story 3 - Template-First Legal Analysis (Priority: P2)

**Goal**: Users can quickly select from pre-built analysis templates for one-click legal document analysis without learning IQL syntax.

**Independent Test**: View a document, click template button "Confidentiality Clause", verify IQL query runs and displays scored results.

### Implementation for User Story 3

- [x] T018 [US3] Verify template selector component exists and displays all 15+ templates in `apps/frontend/src/components/documents/iql-template-selector.tsx`
- [x] T019 [US3] Ensure template selector supports parameterized templates with input fields in `apps/frontend/src/components/documents/iql-template-selector.tsx`
- [x] T020 [US3] Update IQL results component to visually distinguish confidence levels (>70% high, 50-70% medium, <50% low) in `apps/frontend/src/components/documents/iql-results.tsx`
- [ ] T021 [US3] Test non-parameterized template executes with single click
- [ ] T022 [US3] Test parameterized template prompts for input and constructs correct IQL query
- [ ] T023 [US3] Test results display with appropriate confidence indicators (color coding)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - templates provide easy one-click analysis.

---

## Phase 6: User Story 4 - Combine Templates with Operators (Priority: P3)

**Goal**: Power users can combine multiple templates using logical operators through an advanced query builder for sophisticated multi-criteria analysis.

**Independent Test**: Build query "Termination Clause AND Unilateral Clause", verify system executes combined IQL query and returns results matching both criteria.

### Implementation for User Story 4

- [x] T024 [US4] Verify advanced query builder component exists in `apps/frontend/src/components/documents/iql-query-builder.tsx`
- [x] T025 [US4] Ensure query builder validates IQL syntax before execution using existing validation in `apps/frontend/src/lib/iql-validation.ts`
- [ ] T026 [US4] Test query builder can combine templates with AND operator
- [ ] T027 [US4] Test query builder can combine templates with OR operator
- [ ] T028 [US4] Test query builder can use comparison operators (>, <)
- [ ] T029 [US4] Test query builder provides clear syntax error feedback for invalid queries

**Checkpoint**: All user stories should now be independently functional - full IQL capability available through chat, templates, and advanced builder.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 [P] Update agent context documentation with IQL tool usage in `.cursor/rules/` or relevant docs
- [ ] T031 [P] Verify all IQL results properly interpret scores as probabilities (not relative rankings)
- [ ] T032 Test end-to-end: conversational IQL with document context and template usage
- [ ] T033 Run quickstart.md validation steps from `specs/002-isaacus-agent-enhancement/quickstart.md`
- [ ] T034 Verify agent correctly chooses between IQL, classify, search, and extract tools based on query intent
- [ ] T035 Test edge cases: document still processing, document not found, no matches found

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
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1, but enhances US1 experience
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent, uses existing templates
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent, uses existing query builder

### Within Each User Story

- Agent instruction updates before testing
- Frontend changes before integration testing
- Core implementation before edge case handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (both P1)
- User Stories 3 and 4 can be worked on in parallel after US1/US2
- Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# All agent instruction updates can be done together:
Task: "Add IQL tool to tool selection table in document agent instructions"
Task: "Add IQL usage examples and score interpretation guidance"
Task: "Add tool selection heuristics (IQL vs classify vs search)"
```

---

## Parallel Example: User Story 2

```bash
# Frontend and agent updates can be done in parallel:
Task: "Update Thread provider to build context message with optional document_id"
Task: "Update document agent instructions to parse document_id from context message"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (verify existing code)
2. Complete Phase 2: Foundational (wire IQL tool) - CRITICAL
3. Complete Phase 3: User Story 1 (conversational IQL)
4. Complete Phase 4: User Story 2 (document context)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic IQL)
3. Add User Story 2 → Test independently → Deploy/Demo (Document-aware)
4. Add User Story 3 → Test independently → Deploy/Demo (Templates)
5. Add User Story 4 → Test independently → Deploy/Demo (Advanced)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (agent instructions)
   - Developer B: User Story 2 (frontend context passing)
3. After US1/US2 complete:
   - Developer A: User Story 3 (template UI)
   - Developer B: User Story 4 (advanced builder)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All existing code (isaacus_iql.py, templates, query builder) is already implemented - only wiring and integration needed

---

## Summary

**Total Tasks**: 35

- Phase 1 (Setup): 3 tasks
- Phase 2 (Foundational): 2 tasks
- Phase 3 (US1): 5 tasks
- Phase 4 (US2): 7 tasks
- Phase 5 (US3): 6 tasks
- Phase 6 (US4): 6 tasks
- Phase 7 (Polish): 6 tasks

**Parallel Opportunities**:

- Setup tasks can run in parallel
- US1 and US2 can start in parallel after foundational
- US3 and US4 can run in parallel
- Polish tasks marked [P] can run in parallel

**Suggested MVP Scope**: User Stories 1 & 2 (P1 priorities) - conversational IQL with document-aware context

**Independent Test Criteria**:

- US1: Ask "Find confidentiality clauses" → IQL results with scores
- US2: View document, ask question → Only that document queried
- US3: Click template → IQL query runs, results displayed
- US4: Build compound query → Combined results returned
