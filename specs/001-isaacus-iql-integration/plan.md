# Implementation Plan: Isaacus IQL Legal Document Analysis

**Branch**: `001-isaacus-iql-integration` | **Date**: 2024-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-isaacus-iql-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Integrate Isaacus IQL (Isaacus Query Language) capabilities to enable users to analyze legal documents using AI-powered queries. Users can execute IQL statements, use pre-built templates, and combine queries with logical operators to identify specific clauses, obligations, and rights in legal documents. The feature leverages existing document processing infrastructure (text extraction) and adds on-demand IQL query execution via Isaacus API, with results displayed in the frontend and saved queries persisted for reuse.

## Technical Context

**Language/Version**:

- Frontend: TypeScript 5.x, Next.js 15, React 19
- Backend/API: TypeScript (Next.js API routes), Python 3.11+ (for agent tools)
- Database: PostgreSQL (Supabase)

**Primary Dependencies**:

- Frontend: Next.js 15, React 19, Supabase SSR client
- API: Isaacus API (IQL classification endpoint - NEEDS CLARIFICATION)
- Database: Supabase PostgreSQL with existing `documents` table
- Agent: Python `IsaacusClient` service (extend existing)

**Storage**:

- PostgreSQL (Supabase): `documents` table (existing), new `saved_iql_queries` table
- Supabase Storage: Document files (existing)

**Testing**:

- Frontend: Jest/Vitest (unit), Playwright (E2E) - NEEDS CLARIFICATION
- API: Jest/Vitest for API routes
- Agent: pytest for Python tools

**Target Platform**:

- Web application (Next.js on Vercel)
- Agent tools (Python on LangSmith)

**Project Type**: Monorepo web application (frontend + agent)

**Performance Goals**:

- IQL query results within 30 seconds for documents under 50 pages (SC-001)
- API error messages displayed within 5 seconds (SC-006)
- Export results within 3 clicks (SC-007)

**Constraints**:

- Must reuse existing document text extraction (no upload flow changes)
- IQL queries execute on-demand using `extracted_text` from `documents` table
- All queries scoped to authenticated users (Supabase Auth)
- Must handle documents larger than Isaacus context window (chunking required)

**Scale/Scope**:

- Support 15+ pre-built IQL templates
- Saved queries per user (unbounded, but indexed for performance)
- Query history tracking (optional, not in MVP)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Monorepo Architecture ✅

- **Status**: PASS
- **Rationale**: Feature adds to existing `apps/frontend/` (IQL query UI) and `apps/agent/` (IQL tool extension). No new applications required.

### II. Authentication-First ✅

- **Status**: PASS
- **Rationale**: All IQL queries scoped to authenticated users. Saved queries use `uploaded_by` foreign key to `profiles`. API routes validate Supabase JWT.

### III. Security by Default ✅

- **Status**: PASS
- **Rationale**: New `saved_iql_queries` table will have RLS enabled. All queries scoped to user via `(select auth.uid())`. API routes validate tokens server-side.

### IV. Research Agent Patterns ⚠️

- **Status**: CONDITIONAL PASS
- **Rationale**: IQL queries are document analysis tools, not research delegation. This extends the Document Agent capabilities. No violation of orchestration patterns.

### V. Simplicity Over Complexity ✅

- **Status**: PASS
- **Rationale**: Reuses existing document processing, text extraction, and Isaacus API client patterns. No new infrastructure required. On-demand query execution (no preprocessing complexity).

**Gate Result**: ✅ **PASS** - All constitution checks satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/001-isaacus-iql-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   └── iql/              # NEW: IQL query API routes
│       │   │       ├── query/route.ts        # Execute IQL query
│       │   │       ├── templates/route.ts    # List available templates
│       │   │       └── saved/route.ts         # CRUD for saved queries
│       │   └── protected/
│       │       └── matters/
│       │           └── [matterId]/
│       │               └── documents/
│       │                   └── [documentId]/
│       │                       └── iql/       # NEW: IQL query interface page
│       └── components/
│           └── documents/
│               ├── iql-query-builder.tsx      # NEW: IQL query input UI
│               ├── iql-template-selector.tsx  # NEW: Template picker
│               ├── iql-results.tsx            # NEW: Results display
│               └── saved-queries.tsx          # NEW: Saved queries list
│
└── agent/
    └── src/
        ├── services/
        │   └── isaacus_client.py      # EXTEND: Add IQL query method
        └── tools/
            └── isaacus_iql.py         # NEW: IQL query tool for agent

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_create_saved_iql_queries.sql  # NEW: Saved queries table
```

**Structure Decision**: Extends existing monorepo structure. Frontend adds IQL query UI components and API routes. Agent extends `IsaacusClient` and adds IQL tool. Database adds one new table for saved queries. No new applications or major restructuring required.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution checks passed.
