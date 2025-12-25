# Tasks: LangSmith Preview Deployments

**Input**: Design documents from `/specs/001-langsmith-preview-deploys/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Manual verification via PR workflow (no automated tests required for CI/CD infrastructure)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Workflows**: `.github/workflows/`
- **Scripts**: `.github/scripts/`
- **Documentation**: `specs/001-langsmith-preview-deploys/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure GitHub repository with required secrets and permissions

- [ ] T001 Add `LANGSMITH_API_KEY` secret to GitHub repository settings _(manual step - do in GitHub UI)_
- [ ] T002 Add `LANGSMITH_WORKSPACE_ID` secret to GitHub repository settings _(manual step - do in GitHub UI)_
- [ ] T003 Verify workflow permissions allow issue comments in Settings → Actions → General _(manual step - do in GitHub UI)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Validate existing infrastructure is ready for deployment workflows

**⚠️ CRITICAL**: Preview deployment workflows cannot work until these are verified

- [ ] T004 Verify `apps/agent/langgraph.json` is valid by running `cd apps/agent && langgraph dev` locally _(manual step)_
- [ ] T005 Verify agent deploys manually via `langgraph deploy --config langgraph.json` locally _(manual step)_
- [x] T006 [P] Create `.github/scripts/` directory structure _(not needed - using inline scripts)_

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Preview Agent Deployment on Pull Request (Priority: P1) 🎯 MVP

**Goal**: Automatically deploy a preview agent when a PR with agent changes is opened

**Independent Test**: Open a PR that modifies `apps/agent/`, verify deployment URL is posted as comment within 5 minutes

### Implementation for User Story 1

- [x] T007 [US1] Update workflow trigger in `.github/workflows/preview-agent.yml` to include `opened`, `synchronize`, `reopened` actions
- [x] T008 [US1] Add path filter for `apps/agent/**` in `.github/workflows/preview-agent.yml`
- [x] T009 [US1] Configure Python 3.11 and uv setup steps in `.github/workflows/preview-agent.yml`
- [x] T010 [US1] Add LangGraph CLI installation step in `.github/workflows/preview-agent.yml`
- [x] T011 [US1] Implement deployment step with `--revision pr-${{ github.event.pull_request.number }}` in `.github/workflows/preview-agent.yml`
- [x] T012 [US1] Add `--wait` flag to deployment command for health check in `.github/workflows/preview-agent.yml`
- [x] T013 [US1] Capture deployment URL from CLI output in `.github/workflows/preview-agent.yml`
- [x] T014 [US1] Implement PR comment posting with deployment URL using `actions/github-script@v7` in `.github/workflows/preview-agent.yml`
- [x] T015 [US1] Add error handling with clear failure messages in `.github/workflows/preview-agent.yml`
- [x] T016 [US1] Add workflow summary output for GitHub Actions UI in `.github/workflows/preview-agent.yml`

**Checkpoint**: User Story 1 complete - PRs with agent changes now get preview deployments

---

## Phase 4: User Story 2 - Automatic Preview Cleanup on PR Merge/Close (Priority: P2)

**Goal**: Delete preview deployment when PR is merged or closed to prevent resource waste

**Independent Test**: Merge or close a PR with a preview deployment, verify cleanup note is logged

### Implementation for User Story 2

- [x] T017 [US2] Add `closed` action to PR trigger in `.github/workflows/preview-agent.yml`
- [x] T018 [US2] Create cleanup job with `if: github.event.action == 'closed'` condition in `.github/workflows/preview-agent.yml`
- [x] T019 [US2] Add cleanup logging step noting revision `pr-${{ github.event.pull_request.number }}` in `.github/workflows/preview-agent.yml`
- [x] T020 [US2] Document manual cleanup process in PR comment for LangSmith dashboard in `.github/workflows/preview-agent.yml`

**Note**: LangSmith CLI doesn't currently support programmatic revision deletion. Cleanup is logged for manual action if needed. Revisions are lightweight when inactive.

**Checkpoint**: User Story 2 complete - PR close triggers cleanup notification

---

## Phase 5: User Story 3 - Production Deployment on Merge to Main (Priority: P2)

**Goal**: Automatically update production deployment when agent changes are merged to main

**Independent Test**: Merge a PR to main with agent changes, verify production deployment is updated within 10 minutes

### Implementation for User Story 3

- [x] T021 [P] [US3] Configure push trigger for `main` branch in `.github/workflows/deploy-agent.yml`
- [x] T022 [P] [US3] Add path filter for `apps/agent/**` in `.github/workflows/deploy-agent.yml`
- [x] T023 [US3] Configure Python 3.11 and uv setup steps in `.github/workflows/deploy-agent.yml`
- [x] T024 [US3] Add LangGraph CLI installation step in `.github/workflows/deploy-agent.yml`
- [x] T025 [US3] Implement production deployment step with `--wait` flag in `.github/workflows/deploy-agent.yml`
- [x] T026 [US3] Add workflow summary with deployment confirmation in `.github/workflows/deploy-agent.yml`
- [x] T027 [US3] Add `workflow_dispatch` trigger for manual deployments in `.github/workflows/deploy-agent.yml`

**Checkpoint**: User Story 3 complete - Merges to main trigger production deployment

---

## Phase 6: User Story 4 - Preview URL Integration with Frontend (Priority: P3)

**Goal**: Make it easy to connect Vercel preview frontend with LangSmith preview agent

**Independent Test**: Use the URL params from PR comment to test preview frontend with preview agent

### Implementation for User Story 4

- [x] T028 [US4] Enhance PR comment to include frontend URL params in `.github/workflows/preview-agent.yml`
- [x] T029 [US4] Add testing instructions with `?apiUrl=...&assistantId=deep_research` format in `.github/workflows/preview-agent.yml`
- [x] T030 [US4] Add LangSmith dashboard link to PR comment in `.github/workflows/preview-agent.yml`
- [x] T031 [US4] Update quickstart.md with full-stack testing guide in `specs/001-langsmith-preview-deploys/quickstart.md`

**Checkpoint**: User Story 4 complete - Full-stack preview testing is documented and easy

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation

- [x] T032 [P] Update CONTRIBUTING.md with LangSmith preview workflow documentation
- [x] T033 [P] Add GitHub secrets setup instructions to README or docs _(included in quickstart.md)_
- [ ] T034 Run end-to-end validation: open PR → verify preview → merge → verify production _(manual step after merge)_
- [x] T035 Update constitution.md if any new patterns were established _(no new patterns - using existing deployment strategy)_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - configure secrets first
- **Foundational (Phase 2)**: Depends on Setup - verify local deployment works
- **User Story 1 (Phase 3)**: Depends on Foundational - core MVP
- **User Story 2 (Phase 4)**: Depends on US1 (same workflow file)
- **User Story 3 (Phase 5)**: Depends on Foundational only - can parallel with US1/US2
- **User Story 4 (Phase 6)**: Depends on US1 (enhances PR comment)
- **Polish (Phase 7)**: Depends on all user stories

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational
    ↓
    ├──→ Phase 3: US1 (P1) ──→ Phase 4: US2 (P2) ──→ Phase 6: US4 (P3)
    │
    └──→ Phase 5: US3 (P2) [can run in parallel with US1/US2]

All stories → Phase 7: Polish
```

### Parallel Opportunities

- **Phase 5 (US3)** can run in parallel with Phase 3-4 (US1/US2) since they're different files
- **T021, T022** within US3 can run in parallel
- **T032, T033** in Polish phase can run in parallel

---

## Parallel Example: User Story 3

```bash
# These tasks can run in parallel (different workflow file):
Task: "T021 [P] [US3] Configure push trigger for main branch"
Task: "T022 [P] [US3] Add path filter for apps/agent/**"

# Meanwhile, US1 work can proceed on preview-agent.yml
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (add secrets)
2. Complete Phase 2: Foundational (verify local deployment)
3. Complete Phase 3: User Story 1 (preview on PR)
4. **STOP and VALIDATE**: Open a test PR, verify preview works
5. Push branch and open PR to merge this feature

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Preview deployments work (MVP!)
3. Add User Story 2 → Cleanup notifications added
4. Add User Story 3 → Production auto-deploy works
5. Add User Story 4 → Full-stack testing documented
6. Polish → Ready for production use

### Recommended Order

Since US2 and US4 modify the same file as US1, work sequentially:
**US1 → US2 → US4** (all in preview-agent.yml)

US3 can be done in parallel by another developer or after US1:
**US3** (in deploy-agent.yml)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Workflows already scaffolded - tasks refine and complete them
- No automated tests needed - manual PR validation is the test
- Commit after each user story phase for clean history
- Stop at any checkpoint to validate story independently
