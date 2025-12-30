# Task Breakdown Prompt

Use this prompt to break a technical plan into actionable tasks.

## Context

You are generating tasks for the Deep Research Agent that can be executed by an AI coding assistant. Each task should be specific enough to complete without additional context.

## Instructions

Given a technical plan, generate a tasks list:

### Task Format

Every task MUST follow this format:

```
- [ ] [TaskID] [P?] [Story?] Description with file path
```

Components:

1. **Checkbox**: `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential (T001, T002, T003...)
3. **[P] marker**: Only if parallelizable (different files, no dependencies)
4. **[Story] label**: [US1], [US2], etc. for user story tasks
5. **Description**: Clear action with exact file path

### Phase Structure

**Phase 1: Setup**

- Project initialization
- Dependencies installation
- Configuration files

**Phase 2: Foundational**

- Blocking prerequisites
- Shared infrastructure
- Database migrations

**Phase 3+: User Stories** (in priority order)

- Each story gets its own phase
- Within each: Models → Services → Endpoints → Integration
- Each phase is independently testable

**Final Phase: Polish**

- Cross-cutting concerns
- Documentation
- Cleanup

### Example Tasks

```markdown
## Phase 1: Setup

- [ ] T001 Install dependencies in apps/frontend via `pnpm install`
- [ ] T002 Create migration file in supabase/migrations/

## Phase 2: Foundational

- [ ] T003 Add RLS policies to supabase/migrations/YYYYMMDDHHmmss_add_rls.sql
- [ ] T004 [P] Create shared types in apps/frontend/src/types/

## Phase 3: User Story 1 - User Profiles

- [ ] T005 [US1] Create ProfileCard component in apps/frontend/src/components/profile/ProfileCard.tsx
- [ ] T006 [P] [US1] Add profile API route in apps/frontend/src/app/api/profile/route.ts
- [ ] T007 [US1] Integrate ProfileCard in protected page at apps/frontend/src/app/protected/page.tsx

## Phase 4: Polish

- [ ] T008 Add loading states to all new components
- [ ] T009 Update README with new feature documentation
```

### Dependency Graph

Show which tasks depend on others:

```
T001 → T002 → T003
              ↓
         T004 (parallel)
              ↓
         T005 → T006 → T007
```

### Parallel Execution

Identify tasks that can run simultaneously:

- Different files with no shared state
- Independent user stories
- Tests and implementation (different files)

## Guidelines

**DO:**

- Include exact file paths
- Make tasks atomic (single responsibility)
- Order by dependencies
- Mark parallelizable tasks

**DON'T:**

- Create vague tasks ("implement feature")
- Skip file paths
- Create overly large tasks
- Forget dependency ordering

## Reference Documents

- Plan Template: `.specify/templates/plan-template.md`
- Tasks Template: `.specify/templates/tasks-template.md`
- Project Structure: `README.md`



