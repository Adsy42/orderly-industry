# Implementation Plan: Natural Language to IQL Translation

**Branch**: `006-nl-iql-translation` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-nl-iql-translation/spec.md`

## Summary

Add natural language input mode to the IQL Query Builder that translates user's plain English descriptions into valid IQL syntax using an LLM-based translation service. The feature provides a mode toggle between natural language and direct IQL input, with translation prioritizing pre-optimized IQL templates when available. Translation results are displayed transparently so users can see the generated IQL query and learn the syntax over time.

## Technical Context

**Language/Version**: TypeScript 5.7, Next.js 15.4  
**Primary Dependencies**: OpenAI SDK (v6.15.0), React 19, Next.js App Router  
**Storage**: N/A (translation is stateless, no persistent storage required)  
**Testing**: Jest/Vitest (to be determined - existing test setup needs verification)  
**Target Platform**: Web browser (Next.js server-side API routes + React client components)  
**Project Type**: Web application (monorepo frontend app)  
**Performance Goals**: Translation completes within 2 seconds for 95% of queries (SC-003)  
**Constraints**: Must integrate with existing IQL validation logic, preserve existing IQL direct input functionality, translation must respect IQL operator precedence rules  
**Scale/Scope**: Frontend-only feature for IQL Query page, no database schema changes, single API endpoint addition

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Authentication-First ✓
- Translation API endpoint must authenticate requests (Supabase Auth via server-side client)
- No anonymous access to translation service

### Security by Default ✓
- Translation service runs server-side (Next.js API route)
- No sensitive data stored, translation is stateless
- API key (OPENAI_API_KEY) managed via environment variables

### Research Agent Patterns ✓
- N/A - This feature is frontend-only, no agent changes

### Simplicity Over Complexity ✓
- Single API endpoint for translation
- Reuse existing IQL validation logic
- Additive feature (preserves existing IQL direct input)
- Simple mode toggle UI pattern

**Gates Passed**: All constitution requirements met. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-nl-iql-translation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── iql/
│   │           ├── translate/
│   │           │   └── route.ts          # NEW: Translation API endpoint
│   │           ├── query/
│   │           │   └── route.ts          # EXISTING: IQL execution endpoint
│   │           └── templates/
│   │               └── route.ts          # EXISTING: Templates list endpoint
│   ├── components/
│   │   └── documents/
│   │       ├── iql-query-builder.tsx     # MODIFY: Add mode toggle + NL translation
│   │       ├── iql-results.tsx           # MODIFY: Display translated IQL query
│   │       └── iql-help.tsx              # EXISTING: Help component
│   └── lib/
│       ├── iql-validation.ts             # EXISTING: Validation logic (reuse)
│       ├── iql-templates.ts              # EXISTING: Template definitions (reference for translation)
│       └── isaacus.ts                    # EXISTING: Isaacus client utilities
```

**Structure Decision**: This is a frontend-only feature within the existing Next.js monorepo structure. The translation service is implemented as a Next.js API route following existing patterns (see `/api/iql/query/route.ts`). No new directories or structural changes needed - additions are made to existing IQL-related components and API routes.

## Complexity Tracking

> **No violations** - Feature is additive, follows existing patterns, no complexity justified.

## Phase 0: Outline & Research

**Status**: ✅ Complete

Research findings documented in [`research.md`](./research.md). Key decisions:

1. **LLM Translation**: GPT-4o-mini with JSON response format, structured prompt including full template list
2. **Template Matching**: Prompt-based semantic matching with `{IS clause that "..."}` fallback
3. **Error Handling**: Multi-layer with graceful degradation, user-friendly messages, fallback to IQL mode
4. **UI/UX**: Toggle buttons with mode indicators, translated IQL displayed in results header

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Generated Artifacts

1. **Data Model**: [`data-model.md`](./data-model.md)
   - Feature is stateless (no database schema changes)
   - Client-side state management in React components
   - Translation operations are on-demand API calls

2. **API Contracts**: [`contracts/iql-translate-api.md`](./contracts/iql-translate-api.md)
   - `POST /api/iql/translate` endpoint specification
   - Request/response schemas
   - Error handling patterns
   - Authentication requirements

3. **Quickstart Guide**: [`quickstart.md`](./quickstart.md)
   - User-facing documentation
   - Step-by-step usage instructions
   - Natural language examples
   - Tips and best practices

### Design Decisions

- **API Endpoint**: `/api/iql/translate` follows existing `/api/iql/query` pattern
- **Translation Service**: Server-side Next.js API route with OpenAI integration
- **UI Component**: Extend existing `IQLQueryBuilder` with mode toggle
- **State Management**: React component state (no persistence needed)
- **Validation**: Reuse existing `validateIQLQuery` from `iql-validation.ts`

---

## Phase 2: Implementation Tasks

**Status**: ⏳ Pending (Next: `/speckit.tasks`)

Implementation tasks will be generated by the `/speckit.tasks` command.
