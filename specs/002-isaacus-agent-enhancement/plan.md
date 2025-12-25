# Implementation Plan: Isaacus Agent Enhancement

**Branch**: `002-isaacus-agent-enhancement` | **Date**: 2024-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-isaacus-agent-enhancement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the Isaacus integration to enable conversational IQL analysis and document-aware context. The existing `isaacus_iql.py` tool needs to be wired into the agent's `ISAACUS_TOOLS` list. The frontend needs to pass `document_id` in chat context when users are viewing specific documents. Agent instructions need updating to guide tool selection between IQL (clause finding), search (content retrieval), and extract (question answering). The UI should prioritize templates for easy one-click analysis.

## Technical Context

**Language/Version**:

- Frontend: TypeScript 5.x, Next.js 15, React 19
- Agent: Python 3.11+, LangGraph, LangChain

**Primary Dependencies**:

- Frontend: Next.js 15, Supabase SSR, LangGraph SDK
- Agent: isaacus SDK, deepagents, langchain, httpx

**Storage**:

- PostgreSQL (Supabase) - existing `documents`, `saved_iql_queries` tables
- No new tables required for this feature

**Testing**:

- Frontend: Jest/Vitest for unit tests
- Agent: pytest for tool tests

**Target Platform**:

- Web application (Next.js on Vercel)
- Agent on LangSmith

**Project Type**: Monorepo (apps/frontend + apps/agent)

**Performance Goals**:

- IQL analysis results within 10 seconds for documents under 50 pages (SC-001)
- Template-based analysis in single click (SC-006)

**Constraints**:

- Must use existing IsaacusClient for IQL (not langchain-isaacus)
- Document context must update in real-time when user navigates
- Agent must intelligently choose between IQL, search, and extract tools

**Scale/Scope**:

- 15+ IQL templates already defined in frontend
- Single document or all-matter queries supported
- Existing authentication flow (Supabase Auth)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Monorepo Architecture ✅

- **Status**: PASS
- **Rationale**: Changes span `apps/frontend/` (context passing, templates UI) and `apps/agent/` (IQL tool wiring, instructions). No new applications.

### II. Authentication-First ✅

- **Status**: PASS
- **Rationale**: All IQL queries scoped to authenticated users via existing Supabase Auth. Document context passed through authenticated chat sessions.

### III. Security by Default ✅

- **Status**: PASS
- **Rationale**: No new database tables. Existing RLS policies on `documents` and `saved_iql_queries` tables remain in effect. Agent validates JWT on every request.

### IV. Research Agent Patterns ✅

- **Status**: PASS
- **Rationale**: IQL tool extends document-agent sub-agent's capabilities. Follows existing delegation pattern: orchestrator → document-agent → IQL tool.

### V. Simplicity Over Complexity ✅

- **Status**: PASS
- **Rationale**: Primary change is wiring existing tool (`isaacus_iql.py`) into `ISAACUS_TOOLS`. Context passing is a simple addition to existing message structure. No new abstractions required.

**Gate Result**: ✅ **PASS** - All constitution checks satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/002-isaacus-agent-enhancement/
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
│       ├── providers/
│       │   └── Thread.tsx                    # MODIFY: Add document context to messages
│       ├── app/
│       │   └── protected/
│       │       └── matters/
│       │           └── [matterId]/
│       │               └── documents/
│       │                   └── [documentId]/
│       │                       └── page.tsx  # MODIFY: Pass document_id to chat context
│       └── components/
│           └── documents/
│               ├── iql-template-selector.tsx # EXISTING: Template picker UI
│               └── iql-results.tsx           # EXISTING: Results display with confidence
│
└── agent/
    └── src/
        ├── tools/
        │   ├── __init__.py                   # MODIFY: Add isaacus_iql to ISAACUS_TOOLS
        │   └── isaacus_iql.py                # EXISTING: IQL tool (just needs wiring)
        └── agents/
            └── document_agent.py             # MODIFY: Add IQL tool selection guidance
```

**Structure Decision**: Extends existing monorepo structure. No new files required - only modifications to wire up existing `isaacus_iql.py` and add document context passing.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitution checks passed.
