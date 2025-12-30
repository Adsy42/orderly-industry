# Technical Plan Prompt

Use this prompt to create a technical implementation plan for a specified feature.

## Context

You are planning implementation for the Deep Research Agent with this tech stack:

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend Agent**: Python 3.11+, LangGraph, LangChain
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth with JWT validation
- **Deployment**: Vercel (frontend), LangSmith (agent)

## Instructions

Given a feature specification, create a technical plan:

### 1. Technical Context

- Affected components (frontend, agent, database)
- Integration points with existing systems
- External dependencies

### 2. Constitution Compliance Check

Review against `.specify/memory/constitution.md`:

- [ ] Follows monorepo structure
- [ ] Authentication-first (all endpoints secured)
- [ ] RLS enabled on new tables
- [ ] Uses approved tech stack
- [ ] Follows simplicity principle

### 3. Data Model Changes

If database changes needed:

- New tables with schema
- Migrations required
- RLS policies
- Indexes

### 4. API/Contract Changes

- New endpoints or tools
- Request/response schemas
- Authentication requirements

### 5. Frontend Changes

- New components needed
- State management approach
- Routing changes

### 6. Agent Changes

- New tools or prompts
- Sub-agent modifications
- Workflow changes

### 7. Research & Decisions

Document any research needed:

- Decision: [what was chosen]
- Rationale: [why chosen]
- Alternatives: [what else considered]

### 8. Implementation Order

1. Phase 1: [Foundation work]
2. Phase 2: [Core implementation]
3. Phase 3: [Integration & polish]

## Guidelines

**DO:**

- Reference existing patterns in codebase
- Follow constitution principles
- Consider security implications
- Plan for testability

**DON'T:**

- Over-engineer simple features
- Add unnecessary abstractions
- Ignore existing conventions
- Skip RLS policies

## Reference Documents

- Constitution: `.specify/memory/constitution.md`
- Agent Architecture: `.specify/specs/agent-architecture.md`
- Auth Flow: `.specify/specs/authentication-flow.md`
- Database Schema: `.specify/specs/database-schema.md`
- Frontend UI: `.specify/specs/frontend-chat-ui.md`
- Cursor Rules: `.cursor/rules/`



