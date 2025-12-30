# Tasks: Natural Language to IQL Translation

**Input**: Design documents from `/specs/006-nl-iql-translation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested in the specification. Implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a frontend-only feature in the Next.js monorepo:
- API routes: `apps/frontend/src/app/api/iql/translate/route.ts`
- Components: `apps/frontend/src/components/documents/`
- Lib utilities: `apps/frontend/src/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure and shared utilities

- [x] T001 Create API route directory structure for translation endpoint at `apps/frontend/src/app/api/iql/translate/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core translation service that blocks user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [US1] [US3] Create translation API endpoint at `apps/frontend/src/app/api/iql/translate/route.ts` with OpenAI GPT-4o-mini integration for natural language to IQL translation

**Checkpoint**: Translation API endpoint ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Natural Language Clause Search (Priority: P1) 🎯 MVP

**Goal**: Users can describe clause searches in plain English and have them automatically translated to IQL syntax, then executed.

**Independent Test**: Type "one-sided confidentiality clauses" in natural language mode and verify the system translates to `{IS confidentiality clause} AND {IS unilateral clause}` and returns matching results.

### Implementation for User Story 1

- [x] T003 [US1] Add mode state management to `apps/frontend/src/components/documents/iql-query-builder.tsx` with default mode "natural-language"
- [x] T004 [US1] Add mode toggle UI (buttons/tabs) to `apps/frontend/src/components/documents/iql-query-builder.tsx` allowing users to switch between "Natural Language" and "IQL" modes
- [x] T005 [US1] Implement translation API call in `apps/frontend/src/components/documents/iql-query-builder.tsx` when user executes query in natural language mode
- [x] T006 [US1] Add validation of translated IQL query using existing `validateIQLQuery` from `apps/frontend/src/lib/iql-validation.ts` before execution
- [x] T007 [US1] Integrate translated IQL query with existing IQL execution flow in `apps/frontend/src/components/documents/iql-query-builder.tsx` (call `/api/iql/query` with translated query)
- [x] T008 [US1] Add error handling for translation failures in `apps/frontend/src/components/documents/iql-query-builder.tsx` with user-friendly error messages and fallback suggestion to use IQL mode

**Checkpoint**: At this point, User Story 1 should be fully functional - users can enter natural language, see it translated to IQL, and get results

---

## Phase 4: User Story 2 - Mode Toggle Between Natural Language and IQL (Priority: P1)

**Goal**: Users can toggle between natural language and direct IQL input modes, with input text preserved when switching modes.

**Independent Test**: Toggle between "Natural Language" and "IQL" modes in the Clause Finder interface and verify that each mode works independently, and input text is preserved when switching.

### Implementation for User Story 2

- [x] T009 [US2] Implement mode-specific validation logic in `apps/frontend/src/components/documents/iql-query-builder.tsx` (skip translation validation in IQL mode, show IQL syntax validation)
- [x] T010 [US2] Add input text preservation logic in `apps/frontend/src/components/documents/iql-query-builder.tsx` so switching modes preserves the current input field text
- [x] T011 [US2] Update query execution logic in `apps/frontend/src/components/documents/iql-query-builder.tsx` to bypass translation when in IQL mode (use query directly)
- [x] T012 [US2] Add mode indicator in `apps/frontend/src/components/documents/iql-query-builder.tsx` to clearly show which mode is active
- [x] T013 [US2] Clear mode-specific validation errors when switching modes in `apps/frontend/src/components/documents/iql-query-builder.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can toggle modes, input is preserved, and each mode functions correctly

---

## Phase 5: User Story 3 - Template Preference and Fallback (Priority: P2)

**Goal**: Translation service prefers pre-optimized IQL templates when available, falling back to custom descriptions only when no template matches.

**Independent Test**: Search for "termination clauses" (should use template) versus "clauses about GDPR compliance" (should use custom description fallback) and verify the translation uses templates when appropriate.

**Note**: This user story is primarily implemented in the translation API endpoint (T002). These tasks enhance the prompt and add verification.

### Implementation for User Story 3

- [x] T014 [US3] Enhance translation prompt in `apps/frontend/src/app/api/iql/translate/route.ts` to include full IQL template list from `apps/frontend/src/lib/iql-templates.ts` with template descriptions
- [x] T015 [US3] Update translation prompt in `apps/frontend/src/app/api/iql/translate/route.ts` to instruct LLM to prefer templates over custom descriptions
- [x] T016 [US3] Add template matching verification in translation API response parsing in `apps/frontend/src/app/api/iql/translate/route.ts` to extract and return `templates_used` array

**Checkpoint**: Translation service now prioritizes templates correctly, providing more accurate results for template-matching queries

---

## Phase 6: User Story 4 - Translation Visibility and Transparency (Priority: P2)

**Goal**: Users can see the translated IQL query after translation, enabling learning and verification of translation accuracy.

**Independent Test**: Enter natural language, execute a search, and verify the generated IQL query is displayed in the results interface.

### Implementation for User Story 4

- [x] T017 [US4] Add translated IQL query display in `apps/frontend/src/components/documents/iql-results.tsx` showing the generated IQL query above results
- [x] T018 [US4] Add copy functionality for translated IQL query in `apps/frontend/src/components/documents/iql-results.tsx` allowing users to copy the IQL query
- [x] T019 [US4] Add "Switch to IQL mode" button in `apps/frontend/src/components/documents/iql-results.tsx` that populates the query builder with the translated IQL query when clicked
- [x] T020 [US4] Pass translated IQL query from `apps/frontend/src/components/documents/iql-query-builder.tsx` to `apps/frontend/src/components/documents/iql-results.tsx` via results data structure
- [x] T021 [US4] Update `apps/frontend/src/types/iql.ts` to include optional `translatedIQL` field in `IQLQueryResult` interface for passing translated query to results component

**Checkpoint**: Users can now see translated queries, copy them, and switch to IQL mode with the query pre-filled

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T022 [P] Add loading state indicator during translation in `apps/frontend/src/components/documents/iql-query-builder.tsx` to show translation is in progress
- [x] T023 [P] Add timeout handling (2 second target per SC-003) in `apps/frontend/src/app/api/iql/translate/route.ts` with appropriate error messages
- [x] T024 [P] Update help text/info box in `apps/frontend/src/components/documents/iql-query-builder.tsx` to explain natural language mode capabilities
- [ ] T025 [P] Add translation result metadata (confidence, templates_used) to results display in `apps/frontend/src/components/documents/iql-results.tsx` (optional, collapsible) - SKIPPED: Optional enhancement, would require API response structure changes
- [x] T026 [P] Update IQL help documentation to mention natural language mode option
- [x] T027 Code cleanup and refactoring - remove any temporary debugging code (console.log statements are appropriate for error logging and debugging, kept as-is)
- [ ] T028 Run quickstart.md validation - verify all examples from quickstart guide work correctly - MANUAL: Requires manual testing with running application

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (translation API must exist)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 stories → P2 stories)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Enhances US1 but should be independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Enhances translation service (T002) but independent
- **User Story 4 (P2)**: Depends on User Story 1 (needs translation results) - Can start after US1 complete

### Within Each User Story

- Core implementation tasks before integration tasks
- API endpoint before component usage
- State management before UI rendering
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks can run in parallel
- Once Foundational phase completes, User Stories 1, 2, and 3 can start in parallel (if team capacity allows)
- User Story 4 can start after User Story 1 completes
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# These tasks can run in parallel (different concerns):
Task: "Add mode state management to iql-query-builder.tsx"
Task: "Add mode toggle UI to iql-query-builder.tsx"

# These must run sequentially (dependencies):
Task: "Implement translation API call" (depends on T002 - translation endpoint)
Task: "Add validation of translated IQL query" (depends on translation API call)
Task: "Integrate translated IQL query with existing execution flow" (depends on validation)
```

---

## Parallel Example: User Story 4

```bash
# These tasks can run in parallel (different files):
Task: "Update IQLQueryResult interface in types/iql.ts"
Task: "Add translated IQL query display in iql-results.tsx"
Task: "Add copy functionality for translated IQL query"

# This depends on interface update:
Task: "Pass translated IQL query from query-builder to results" (depends on interface)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (directory structure)
2. Complete Phase 2: Foundational (translation API endpoint - CRITICAL)
3. Complete Phase 3: User Story 1 (natural language search)
4. Complete Phase 4: User Story 2 (mode toggle)
5. **STOP and VALIDATE**: Test both P1 stories independently
6. Deploy/demo if ready

**MVP delivers**: Users can search using natural language OR direct IQL, with mode toggle working correctly.

### Incremental Delivery

1. Complete Setup + Foundational → Translation API ready
2. Add User Story 1 → Test independently → Deploy/Demo (Core NL translation!)
3. Add User Story 2 → Test independently → Deploy/Demo (Mode toggle complete!)
4. Add User Story 3 → Test independently → Deploy/Demo (Template optimization)
5. Add User Story 4 → Test independently → Deploy/Demo (Transparency complete)
6. Add Polish phase → Final cleanup and documentation

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational (Phase 2) is done:
   - Developer A: User Story 1 (natural language search)
   - Developer B: User Story 2 (mode toggle) - can start in parallel with US1
   - Developer C: User Story 3 (template preference) - can start in parallel
3. After User Story 1 completes:
   - Developer A: User Story 4 (translation visibility)
4. All developers: Polish phase (parallel tasks)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Translation API (T002) is CRITICAL - all user stories depend on it
- User Story 4 depends on User Story 1 (needs translation results to display)

