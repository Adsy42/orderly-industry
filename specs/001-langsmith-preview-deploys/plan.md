# Implementation Plan: LangSmith Preview Deployments

**Branch**: `001-langsmith-preview-deploys` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-langsmith-preview-deploys/spec.md`

## Summary

Implement automated LangSmith preview deployments for pull requests, mirroring the existing Vercel and Supabase preview patterns. The system will use GitHub Actions with the LangGraph CLI and LangSmith Control Plane API to create, manage, and cleanup preview deployments automatically.

## Technical Context

**Language/Version**: YAML (GitHub Actions), Bash (scripts)  
**Primary Dependencies**: LangGraph CLI, LangSmith Control Plane API, GitHub Actions  
**Storage**: N/A (managed by LangSmith)  
**Testing**: Manual verification via PR workflow  
**Target Platform**: GitHub Actions runners (ubuntu-latest)  
**Project Type**: CI/CD infrastructure  
**Performance Goals**: Preview deployments created within 5 minutes  
**Constraints**: LangSmith API rate limits, GitHub Actions timeout (default 360 minutes)  
**Scale/Scope**: ~10-20 PRs per month initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Monorepo Architecture** | ✅ PASS | Workflows target `apps/agent/` directory specifically |
| **Authentication-First** | ✅ PASS | Preview deployments include existing custom auth handler |
| **Security by Default** | ✅ PASS | Secrets managed via GitHub repository secrets, never exposed |
| **Research Agent Patterns** | ✅ N/A | Infrastructure change, not agent logic |
| **Simplicity Over Complexity** | ✅ PASS | Uses native LangGraph CLI, minimal custom scripting |
| **Deployment Strategy** | ✅ ALIGNED | Extends existing LangSmith deployment pattern |
| **Git Workflow** | ✅ ALIGNED | Integrates with existing PR workflow |
| **Commit Conventions** | ✅ ALIGNED | CI workflow changes use `ci` type |

**Gate Status**: ✅ PASSED - No violations, proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-langsmith-preview-deploys/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (workflow model)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   └── control-plane-api.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
.github/
├── workflows/
│   ├── ci-agent.yml           # Existing - lint/test agent
│   ├── preview-agent.yml      # NEW - preview deployment on PR
│   └── deploy-agent.yml       # NEW - production deploy on merge
└── scripts/
    └── langsmith-deploy.sh    # NEW - deployment helper script
```

**Structure Decision**: CI/CD infrastructure feature - workflows live in `.github/workflows/`, no application code changes required.

## Complexity Tracking

No violations to justify - implementation follows simplicity principle using native tooling.
