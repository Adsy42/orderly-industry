# Deep Research Agent Constitution

This document defines the core principles, technical decisions, and coding standards that govern the Deep Research Agent MVP. All development must align with these principles.

## Core Principles

### I. Monorepo Architecture

The project is structured as a monorepo with two primary applications:
- **Frontend** (`apps/frontend/`): Next.js 15 application for the chat interface
- **Agent** (`apps/agent/`): Python LangGraph agent for deep research

Each application maintains its own dependencies and can be deployed independently. Shared database migrations live at the root level in `supabase/`.

### II. Authentication-First

Every user interaction must be authenticated and authorized:
- Frontend uses Supabase Auth with cookie-based sessions
- Agent validates JWT tokens against Supabase on every request
- All resources (threads, conversations) are scoped to the authenticated user
- No anonymous access to agent functionality

### III. Security by Default

- All database tables MUST have Row Level Security (RLS) enabled
- JWT tokens are validated server-side, never trusted on the client alone
- Secrets are managed via environment variables, never committed to code
- Use `SECURITY INVOKER` for database functions unless `SECURITY DEFINER` is explicitly required

### IV. Research Agent Patterns

The agent follows a hierarchical delegation model:
- **Orchestrator**: Plans research, delegates to sub-agents, synthesizes findings
- **Sub-agents**: Execute focused research tasks with specific tool access
- **Tools**: tavily_search (web search), think_tool (strategic reflection)

Research workflows must follow: Plan → Delegate → Research → Synthesize → Write Report

### V. Simplicity Over Complexity

- Start simple, add complexity only when required (YAGNI)
- One sub-agent is preferred for most queries; parallelize only for explicit comparisons
- Avoid premature optimization and over-engineering
- Prefer existing abstractions over creating new ones

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Supabase SSR | latest | Auth & database client |
| LangGraph SDK | latest | Agent communication |

### Agent
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| LangGraph | latest | Agent orchestration framework |
| LangChain | latest | LLM abstractions and tools |
| Tavily | latest | Web search API |
| HTTPX | latest | Async HTTP client |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | Auth, PostgreSQL database, storage |
| Vercel | Frontend hosting |
| LangSmith | Agent deployment and monitoring |

## Deployment Strategy

### Frontend → Vercel
- Root directory: `apps/frontend`
- Build command: `pnpm build`
- Environment variables prefixed with `NEXT_PUBLIC_` for client-side access
- Server-side secrets (e.g., `LANGSMITH_API_KEY`) kept without prefix

### Agent → LangSmith
- Path to LangGraph API: `apps/agent`
- Configuration: `langgraph.json`
- Automatic JWT validation via custom auth handler
- Environment variables managed in LangSmith dashboard

## Coding Standards

### SQL & Database

All database code must follow these guidelines (see `.cursor/rules/` for detailed patterns):

**Naming Conventions:**
- Use `snake_case` for tables and columns
- Prefer plural table names, singular column names
- Foreign key columns: `{table_singular}_id` (e.g., `user_id`)

**Table Structure:**
- Always add `id` column as `bigint generated always as identity primary key` (or `uuid` for auth-linked tables)
- Always add table comments describing purpose
- Create all tables in `public` schema unless specified

**Row Level Security:**
- Enable RLS on ALL tables, even public-access ones
- Create separate policies for each operation (SELECT, INSERT, UPDATE, DELETE)
- Create separate policies for each role (`anon`, `authenticated`)
- Use `(select auth.uid())` instead of `auth.uid()` for performance
- Add indexes on columns used in RLS policies

**Functions:**
- Default to `SECURITY INVOKER`
- Always set `search_path = ''`
- Use fully qualified names for all database objects
- Prefer `IMMUTABLE` or `STABLE` over `VOLATILE`

### TypeScript (Frontend)

**Imports:**
- Use path aliases (`@/components`, `@/lib`) for internal imports
- Group imports: React → external → internal → types

**Components:**
- Functional components with TypeScript interfaces
- Props interfaces named `{ComponentName}Props`
- Use React Server Components by default, `"use client"` only when needed

**State Management:**
- Context providers in `src/providers/`
- Custom hooks in `src/hooks/`
- Prefer URL state (`nuqs`) for shareable state

### Python (Agent)

**Structure:**
- Type hints on all function signatures
- Docstrings for public functions
- Async/await for I/O operations

**Tools:**
- Use `@tool` decorator with `parse_docstring=True`
- Document args in docstring for automatic schema generation
- Return formatted strings, not raw data structures

**Prompts:**
- Store in `prompts.py`, not inline
- Use format strings for dynamic values
- Include clear instructions and examples

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ASSISTANT_ID=deep_research

# Server-side only
LANGGRAPH_API_URL=
LANGSMITH_API_KEY=
```

### Agent (.env)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
```

## Git Workflow

### Branch Naming

Feature branches are created by Spec Kit with auto-incrementing numbers:
- Format: `###-feature-name` (e.g., `001-user-auth`, `002-chat-history`)
- Non-feature branches: `fix/###-description`, `docs/description`, `chore/description`

### Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature (MINOR in SemVer) |
| `fix` | Bug fix (PATCH in SemVer) |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Build, CI, dependencies |
| `ci` | CI configuration |

**Scopes:**
| Scope | Description |
|-------|-------------|
| `frontend` | Next.js app changes |
| `agent` | Python agent changes |
| `db` | Database/migrations |
| `auth` | Authentication flow |
| `api` | API routes |
| `ui` | UI components |
| `deps` | Dependencies |

**Rules:**
- Use imperative mood: "add" not "added"
- Don't capitalize first letter
- No period at the end
- Max 50 characters for subject
- Reference specs in footer: `Spec: 001-feature-name`

### Pull Request Process

1. Ensure SDD workflow complete (spec → plan → tasks → implement)
2. All tasks in `tasks.md` marked `[x]`
3. Fill out PR template completely
4. Link to spec file
5. Pass all CI checks
6. Get at least one approval

## Governance

1. This constitution supersedes conflicting practices found elsewhere in the codebase
2. Amendments require documentation of rationale and migration plan
3. All code reviews must verify compliance with these principles
4. Complexity must be justified against the "Simplicity Over Complexity" principle

**Version**: 1.1.0 | **Ratified**: 2025-12-23 | **Last Amended**: 2025-12-23
