# Contributing to Deep Research Agent

Thank you for your interest in contributing! This project uses **Spec-Driven Development (SDD)** to ensure features are well-defined before implementation.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Spec-Driven Development](#spec-driven-development)
- [Git Workflow](#git-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Python >= 3.11
- Supabase CLI (optional, for local database)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd testv4

# Install frontend dependencies
pnpm install

# Install agent dependencies
cd apps/agent
pip install -e ".[dev]"
cd ../..

# Set up environment variables
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/agent/.env.example apps/agent/.env

# Start development
pnpm dev:all
```

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Spec-Driven Development Workflow                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   1. ISSUE   │────▶│   2. SPEC    │────▶│   3. PLAN    │────▶│  4. TASKS    │
  │              │     │              │     │              │     │              │
  │ Feature      │     │ /speckit     │     │ /speckit     │     │ /speckit     │
  │ Request      │     │ .specify     │     │ .plan        │     │ .tasks       │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                        │
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   9. MERGE   │◀────│   7. PR      │◀────│  6. COMMIT   │◀────│ 5. IMPLEMENT │◀──┘
  │              │     │              │     │              │     │              │
  │ Squash &     │     │ /speckit     │     │ /speckit     │     │ /speckit     │
  │ Merge        │     │ .pr          │     │ .commit      │     │ .implement   │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   8. DEBUG   │ ◀─── Issues? CI Failures?
                       │              │      Review Feedback?
                       │ /speckit     │
                       │ .debug       │ ────▶ Fix → Commit → Re-review
                       └──────────────┘
```

## Spec-Driven Development

All features must go through the SDD workflow. This ensures:

- Requirements are clear before coding
- Implementation matches expectations
- Reviews have a reference document

### 1. Create a Feature Specification

```bash
# In Cursor, run the slash command:
/speckit.specify Add user profile management with avatar uploads
```

This creates:

- Feature branch: `001-user-profiles`
- Spec file: `specs/001-user-profiles/spec.md`

### 2. Create a Technical Plan

```bash
/speckit.plan
```

This generates:

- `plan.md` - Technical approach
- `data-model.md` - Database schema
- `contracts/` - API specifications

### 3. Break Down into Tasks

```bash
/speckit.tasks
```

This creates:

- `tasks.md` - Ordered, actionable tasks

### 4. Implement

```bash
/speckit.implement
```

Or manually work through `tasks.md`, marking each complete.

### Available Commands

| Command                  | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `/speckit.specify`       | Create feature specification             |
| `/speckit.clarify`       | Clarify ambiguous requirements           |
| `/speckit.plan`          | Create technical plan                    |
| `/speckit.tasks`         | Break plan into tasks                    |
| `/speckit.implement`     | Execute implementation                   |
| `/speckit.commit`        | Verify quality gates & create commits    |
| `/speckit.pr`            | Create pull request with spec references |
| `/speckit.debug`         | Debug CI failures & review feedback      |
| `/speckit.analyze`       | Check consistency                        |
| `/speckit.checklist`     | Generate quality checklist               |
| `/speckit.taskstoissues` | Export tasks to GitHub Issues            |

## Git Workflow

### Branch Naming

Branches are created automatically by SDD:

- Format: `###-feature-name` (e.g., `001-user-auth`)
- Numbers auto-increment based on existing branches

For non-feature work:

- `fix/###-description` - Bug fixes
- `docs/description` - Documentation
- `chore/description` - Maintenance

### Branch Strategy

```
main (protected)
  │
  ├── 001-user-auth (feature)
  │     └── PR → main
  │
  ├── 002-chat-history (feature)
  │     └── PR → main
  │
  └── fix/003-login-redirect (bugfix)
        └── PR → main
```

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                 |
| ---------- | --------------------------- |
| `feat`     | New feature                 |
| `fix`      | Bug fix                     |
| `docs`     | Documentation               |
| `style`    | Formatting (no code change) |
| `refactor` | Code restructuring          |
| `perf`     | Performance improvement     |
| `test`     | Adding tests                |
| `chore`    | Build, CI, dependencies     |
| `ci`       | CI configuration            |

### Scopes

| Scope      | Description         |
| ---------- | ------------------- |
| `frontend` | Next.js app         |
| `agent`    | Python agent        |
| `db`       | Database/migrations |
| `auth`     | Authentication      |
| `api`      | API routes          |
| `ui`       | UI components       |
| `deps`     | Dependencies        |

### Examples

```bash
# Feature
feat(frontend): add user profile avatar upload

# Bug fix
fix(agent): handle timeout in tavily search

# With spec reference
feat(db): add conversations table

Spec: 002-chat-history
Closes #45
```

### Setup Commit Template

```bash
git config commit.template .gitmessage
```

## Pull Request Process

### Creating a Pull Request

After committing your changes with `/speckit.commit`, use `/speckit.pr` to create a pull request:

```bash
# Create PR with auto-generated description from spec
/speckit.pr

# Create as draft
/speckit.pr --draft

# Add specific reviewers
/speckit.pr --reviewer @teammate1
```

The command will:

1. Verify your branch is pushed to remote
2. Check for preview deployments (Vercel, LangSmith, Supabase)
3. Generate a PR description from your spec files
4. Include testing checklist and preview URLs
5. Create the PR via GitHub CLI

### Debugging PR Issues

If CI fails or reviewers request changes, use `/speckit.debug`:

```bash
# Debug all issues
/speckit.debug

# Focus on CI failures
/speckit.debug --ci

# Focus on review feedback
/speckit.debug --reviews

# Debug agent issues (uses LangSmith MCP)
/speckit.debug --agent

# Debug database issues (uses Supabase MCP)
/speckit.debug --db
```

The command uses MCP tools to diagnose issues:

- **LangSmith**: Analyze agent traces, run errors, and experiments
- **Supabase**: Check migrations, RLS policies, logs, and security advisors
- **Vercel**: Parse build logs and deployment failures

### Quality Gates & Testing

**Pre-commit hooks** ensure code quality before committing:

- ✅ Frontend: ESLint, Prettier, TypeScript check, build validation
- ✅ Agent: Ruff lint/format, type checking (mypy), tests
- ✅ Database: RLS policy validation for new tables

**CI/CD Pipeline** runs on every PR:

- ✅ All pre-commit checks run in CI
- ✅ Tests are **required** (CI will fail if tests are missing)
- ✅ Build validation ensures production readiness

**Note**: Preview/staging environments have been disabled to reduce costs. All testing happens locally and in CI before merging to `main`.

### Before Opening a PR

1. **Ensure SDD workflow is complete**
   - Spec reviewed and approved
   - Plan completed
   - All tasks in `tasks.md` marked `[x]`

2. **Run quality gates (pre-commit hooks run automatically)**
   - Linting passes (ESLint, Ruff)
   - Formatting passes (Prettier, Ruff format)
   - Type checking passes (TypeScript, mypy)
   - Build succeeds (Next.js build)
   - **Tests pass** (required - pre-commit hook will block if tests fail)

3. **Self-review your code**
   - Check against constitution (`.specify/memory/constitution.md`)
   - Verify no secrets committed
   - Conventional commit messages used
   - All environment variables properly configured (no hardcoded values)

4. **Test your changes locally**
   - Local testing completed with production-like environment variables
   - All tests passing
   - No regressions

### PR Requirements

- Fill out the PR template completely
- Link to the spec file
- All CI checks passing
- At least one approval

### Review Checklist

Reviewers should verify:

- [ ] Implementation matches spec
- [ ] Constitution principles followed
- [ ] Database changes have RLS
- [ ] No security issues
- [ ] Tests adequate

## Code Standards

### Read the Constitution

The project constitution defines all coding standards:

```
.specify/memory/constitution.md
```

### Key Principles

1. **Authentication-First** - All endpoints secured
2. **RLS Required** - All tables have Row Level Security
3. **Simplicity** - No over-engineering

### Frontend (TypeScript)

- Use path aliases (`@/components`)
- React Server Components by default
- `"use client"` only when needed

### Agent (Python)

- Type hints on all functions
- Docstrings for public functions
- Async/await for I/O

### Database (SQL)

- Lowercase SQL keywords
- `snake_case` naming
- Comments on all tables
- Granular RLS policies

## Getting Help

- **Constitution**: `.specify/memory/constitution.md`
- **Specs**: `.specify/specs/`
- **Cursor Rules**: `.cursor/rules/`
- **SDD Commands**: `.cursor/commands/`

## License

MIT
