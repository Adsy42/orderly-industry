# DevOps & Coding Lifecycle Overview

This document provides a comprehensive overview of the development, testing, staging, and deployment lifecycle for the Deep Research Agent project.

## 📋 Table of Contents

1. [Development Workflow](#development-workflow)
2. [Spec-Driven Development (SDD)](#spec-driven-development-sdd)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Preview Deployments (Staging)](#preview-deployments-staging)
5. [Pull Request Process](#pull-request-process)
6. [Production Deployment](#production-deployment)
7. [Quality Gates](#quality-gates)

---

## Development Workflow

The project follows a **Spec-Driven Development (SDD)** methodology with a structured workflow:

```
Feature Request → Specification → Plan → Tasks → Implementation → Commit → PR → Review → Merge → Deploy
```

### Branch Strategy

- **Main branch**: `main` (protected, production-ready code)
- **Feature branches**: Auto-created with format `###-feature-name` (e.g., `001-user-auth`)
- **Fix branches**: `fix/###-description`
- **Docs/chore branches**: `docs/description`, `chore/description`

All branches branch from `main` and merge back via Pull Requests.

---

## Spec-Driven Development (SDD)

Every feature must go through the SDD workflow using SpecKit commands in Cursor:

### 1. **Specify** (`/speckit.specify`)
   - Creates feature specification
   - Auto-generates branch: `001-feature-name`
   - Creates: `specs/001-feature-name/spec.md`

### 2. **Plan** (`/speckit.plan`)
   - Generates technical plan
   - Creates: `plan.md`, `data-model.md`, `contracts/`

### 3. **Tasks** (`/speckit.tasks`)
   - Breaks plan into actionable tasks
   - Creates: `tasks.md` with dependency-ordered tasks

### 4. **Implement** (`/speckit.implement`)
   - Executes implementation
   - Works through `tasks.md`, marking complete

### 5. **Commit** (`/speckit.commit`)
   - Runs quality gates (lint, format, build)
   - Creates conventional commits

### 6. **PR** (`/speckit.pr`)
   - Creates pull request with auto-generated description
   - Verifies preview deployments
   - Includes spec references and testing checklist

### 7. **Debug** (`/speckit.debug`) - If issues arise
   - Diagnoses CI failures, review feedback, runtime errors
   - Uses MCP tools for LangSmith, Supabase, Vercel

---

## CI/CD Pipeline

The project uses GitHub Actions with **path-based triggers** for efficient CI:

### Frontend CI (`.github/workflows/ci-frontend.yml`)

**Triggers:**
- Push/PR to `main` with changes in `apps/frontend/**`
- Changes to `pnpm-lock.yaml` or workflow file

**Jobs (parallel, then sequential):**
1. **lint** - ESLint checks
2. **typecheck** - TypeScript compilation check
3. **build** - Next.js production build (depends on lint + typecheck)

**Runs on:** `ubuntu-latest` with Node.js 20

---

### Agent CI (`.github/workflows/ci-agent.yml`)

**Triggers:**
- Push/PR to `main` with changes in `apps/agent/**`
- Changes to workflow file

**Jobs:**
1. **lint** - Ruff linter and formatter checks
2. **typecheck** - mypy type checking (non-blocking initially)
3. **test** - pytest tests (non-blocking if no tests exist)

**Runs on:** `ubuntu-latest` with Python 3.11

---

### Database CI (`.github/workflows/ci-database.yml`)

**Triggers:**
- Push/PR to `main` with changes in `supabase/**`
- Changes to workflow file

**Jobs:**
1. **validate-migrations**
   - Validates migration naming: `YYYYMMDDHHmmss_description.sql`
   - Checks that all `CREATE TABLE` statements enable RLS
   - Lints SQL style (lowercase keywords, table comments)

**Runs on:** `ubuntu-latest` with Supabase CLI

---

## Testing & Quality Assurance

**Note**: Preview/staging environments have been **disabled** to reduce costs. All testing happens locally and in CI before merging to production.

### Pre-commit Hooks

Pre-commit hooks (via Husky) automatically run quality checks before each commit:

**Frontend Checks:**
- ESLint (linting)
- Prettier (formatting)
- TypeScript type checking
- Production build validation
- Tests (if configured)

**Agent Checks:**
- Ruff linter and formatter
- Mypy type checking (if available)
- Tests (required - hook will block if tests fail)

**Database Checks:**
- RLS policy validation (ensures new tables have RLS enabled)
- SQL syntax validation

**To skip hooks (not recommended):**
```bash
git commit --no-verify
```

---

### CI/CD Testing

All CI workflows require tests to pass before merging:

**Frontend CI:**
- Runs all pre-commit checks
- Requires tests directory or test script in package.json
- Fails if tests are missing

**Agent CI:**
- Runs all pre-commit checks
- Requires `tests/` directory with Python test files
- Fails if tests are missing

**Database CI:**
- Validates migration naming and RLS policies

---

## Pull Request Process

### Creating a PR

**Using SpecKit Command:**
```bash
/speckit.pr
```

**What it does:**
1. Verifies branch is pushed to remote
2. Generates PR description from spec files
3. Includes testing checklist
4. Creates PR via GitHub CLI

**Note**: Preview deployment URLs are no longer included (staging environments disabled)

**Options:**
- `--draft` - Create as draft PR
- `--reviewer @user` - Add specific reviewers

---

### PR Requirements

Before opening a PR:
- ✅ SDD workflow complete (spec → plan → tasks → implementation)
- ✅ All tasks in `tasks.md` marked `[x]`
- ✅ Quality gates pass (`/speckit.commit`):
  - Linting passes (ESLint, Ruff)
  - Formatting passes (Prettier, Ruff format)
  - Build succeeds (Next.js build)
  - Tests pass (if configured)
- ✅ Self-review complete:
  - Code matches spec
  - Constitution principles followed
  - No secrets committed
  - Conventional commit messages used

**PR Template Requirements:**
- Link to spec file
- Preview deployment URLs (if applicable)
- Testing checklist
- All CI checks passing
- At least one approval required

---

### PR Review Checklist

Reviewers verify:
- [ ] Implementation matches spec
- [ ] Constitution principles followed (`.specify/memory/constitution.md`)
- [ ] Database changes have RLS policies
- [ ] No security issues
- [ ] Tests adequate
- [ ] Preview deployments working (if applicable)

---

### Debugging PR Issues

**Using SpecKit Command:**
```bash
/speckit.debug              # Debug all issues
/speckit.debug --ci         # Focus on CI failures
/speckit.debug --reviews    # Focus on review feedback
/speckit.debug --agent      # Debug agent issues (LangSmith MCP)
/speckit.debug --db         # Debug database issues (Supabase MCP)
```

**Capabilities:**
- **LangSmith MCP**: Analyze agent traces, run errors, experiments
- **Supabase MCP**: Check migrations, RLS policies, logs, security advisors
- **Vercel MCP**: Parse build logs and deployment failures

---

## Production Deployment

### Frontend → Vercel

**Trigger:** Merge to `main` branch

**Process:**
- Vercel automatically deploys on push to `main`
- Uses production environment variables
- URL: `https://[project].vercel.app`

**Configuration:**
- Root directory: `apps/frontend`
- Build command: `pnpm build`
- Environment variables: Configured in Vercel dashboard

---

### Agent → LangSmith

**Workflow:** `.github/workflows/deploy-agent.yml`

**Triggers:**
- Push to `main` with changes in `apps/agent/**`
- Manual trigger via `workflow_dispatch`

**Process:**
1. Validates `langgraph.json` configuration
2. Tests agent can be loaded
3. Creates workflow summary
4. **Note**: Actual deployment managed via LangSmith UI (connect GitHub repo for auto-deploy)

**Secrets Required:**
- `LANGSMITH_API_KEY` - LangSmith API key

---

### Database → Supabase

**Process:**
- Migrations in `supabase/migrations/` are applied manually or via CI
- **No automatic deployment workflow** - migrations are versioned and applied as needed
- Supabase preview branches can be merged to main project

---

## Quality Gates

### Pre-Commit (via `/speckit.commit`)

1. **Linting:**
   - Frontend: ESLint (`pnpm lint`)
   - Agent: Ruff (`ruff check .`)
   - Database: SQL style checks (via CI)

2. **Formatting:**
   - Frontend: Prettier (`pnpm format:check`)
   - Agent: Ruff format (`ruff format --check .`)

3. **Type Checking:**
   - Frontend: TypeScript (`pnpm tsc --noEmit`)
   - Agent: mypy (`mypy src`)

4. **Build:**
   - Frontend: Next.js build (`pnpm build`)

5. **Tests:**
   - Agent: pytest (if configured)

---

### Pre-Merge (via CI)

All CI workflows must pass before merge:
- ✅ Frontend CI (lint, typecheck, build)
- ✅ Agent CI (lint, typecheck, test)
- ✅ Database CI (migration validation, RLS checks)

**Branch Protection:**
- `main` branch is protected
- Requires passing CI checks
- Requires at least one approval

---

### Post-Merge (via Deployment Workflows)

- Frontend: Automatic Vercel deployment
- Agent: Automatic LangSmith deployment (if configured)
- Database: Migrations applied as needed

---

## Environment Summary

| Environment | Frontend | Agent | Database | Purpose |
|-------------|----------|-------|----------|---------|
| **Local** | `localhost:3000` | `localhost:2024` | Local Supabase | Development |
| **Preview** | Vercel preview URL | LangSmith revision | Supabase branch | PR testing |
| **Production** | Vercel production URL | LangSmith production | Supabase main | Live application |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `.github/workflows/ci-frontend.yml` | Frontend CI pipeline |
| `.github/workflows/ci-agent.yml` | Agent CI pipeline |
| `.github/workflows/ci-database.yml` | Database CI pipeline |
| `.github/workflows/deploy-agent.yml` | Production agent deployment |
| `.husky/pre-commit` | Pre-commit quality gates |
| `CONTRIBUTING.md` | Development workflow & conventions |
| `ENV_SETUP.md` | Environment configuration |
| `.specify/memory/constitution.md` | Core principles & coding standards |
| `.cursor/commands/` | SpecKit slash command definitions |

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE DEVELOPMENT LIFECYCLE               │
└─────────────────────────────────────────────────────────────────┘

1. FEATURE REQUEST
   │
   ├─→ /speckit.specify → Creates spec.md & feature branch
   │
2. PLANNING
   │
   ├─→ /speckit.plan → Creates plan.md, data-model.md, contracts/
   ├─→ /speckit.tasks → Creates tasks.md
   │
3. IMPLEMENTATION
   │
   ├─→ /speckit.implement → Executes tasks
   │
4. QUALITY GATES
   │
   ├─→ /speckit.commit → Lint, format, build, typecheck
   ├─→ git push → Push to remote
   │
5. PULL REQUEST
   │
   ├─→ /speckit.pr → Create PR with spec references
   │
   ├─→ CI RUNS (parallel):
   │   ├─→ ci-frontend.yml (if frontend changes)
   │   ├─→ ci-agent.yml (if agent changes)
   │   └─→ ci-database.yml (if database changes)
   │
   ├─→ PREVIEW DEPLOYMENTS (automatic):
   │   ├─→ Vercel preview (any PR)
   │   ├─→ Supabase branch (if supabase/** changed)
   │   └─→ LangSmith preview (if apps/agent/** changed)
   │
   ├─→ PR COMMENT: Preview URLs + testing checklist
   │
6. REVIEW
   │
   ├─→ Code review by team
   ├─→ Testing on preview environments
   │
   ├─→ IF ISSUES:
   │   └─→ /speckit.debug → Diagnose & fix → Loop back to 4
   │
7. MERGE
   │
   ├─→ Merge to main (squash & merge)
   │
8. PRODUCTION DEPLOYMENT
   │
   ├─→ Vercel: Automatic deployment to production
   ├─→ LangSmith: Auto-deploy if configured
   └─→ Supabase: Migrations applied as needed

┌─────────────────────────────────────────────────────────────────┐
│                     PREVIEW DEPLOYMENT FLOW                      │
└─────────────────────────────────────────────────────────────────┘

PR Opened
   │
   ├─→ Vercel (automatic)
   │   └─→ Creates preview URL: https://[project]-git-[branch].vercel.app
   │
   ├─→ Supabase (if supabase/** changed)
   │   ├─→ preview-supabase.yml triggered
   │   ├─→ Creates branch: pr-{NUMBER}
   │   ├─→ Applies migrations
   │   └─→ PR comment with branch URL
   │
   └─→ LangSmith (if apps/agent/** changed)
       ├─→ preview-agent.yml triggered
       ├─→ Validates langgraph.json
       ├─→ Tests agent loading
       └─→ PR comment with validation status
       └─→ Actual deployment via LangSmith UI (if configured)

PR Closed/Merged
   │
   ├─→ Supabase: Deletes branch (cleanup job)
   └─→ LangSmith: Cleanup note (manual cleanup if needed)
```

---

## Notes

1. **Vercel Integration**: Fully automatic via GitHub integration (no workflow needed)
2. **Supabase Branches**: Fully automated create/delete via workflows
3. **LangSmith Deployments**: Workflow validates config; actual deployment requires LangSmith UI setup
4. **Path-Based Triggers**: CI workflows only run when relevant paths change (efficient)
5. **Conventional Commits**: Required format for clean git history
6. **Constitution Compliance**: All code must follow `.specify/memory/constitution.md`

---

## Quick Reference Commands

```bash
# Development
/speckit.specify <feature description>  # Start new feature
/speckit.plan                           # Create technical plan
/speckit.tasks                          # Generate tasks
/speckit.implement                      # Execute implementation
/speckit.commit                         # Quality gates & commit
/speckit.pr                             # Create pull request
/speckit.debug                          # Debug PR issues

# Local Development
pnpm dev:all                            # Run frontend + agent
pnpm lint:all                           # Lint all code
pnpm format                             # Format all code
```

---

**Last Updated**: Based on repository state as of latest commit
