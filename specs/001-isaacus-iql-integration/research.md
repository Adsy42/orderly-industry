# Research: Isaacus IQL Integration

**Feature**: 001-isaacus-iql-integration  
**Date**: 2024-12-24  
**Purpose**: Resolve technical unknowns for IQL API integration

## 1. Isaacus IQL API Endpoint

**Question**: What is the API endpoint and request format for executing IQL queries?

**Research Sources**:

- [Isaacus IQL Introduction](https://docs.isaacus.com/iql/introduction)
- [Isaacus IQL Templates](https://docs.isaacus.com/iql/templates)
- [Isaacus IQL Specification](https://docs.isaacus.com/iql/specification)
- Existing Isaacus API patterns in codebase (`/v1/embeddings`, `/v1/rerank`)

**Decision**: Use `/v1/classify` endpoint (following existing API pattern) with IQL query string and document text.

**Rationale**:

- Isaacus API follows RESTful pattern with `/v1/` prefix (see existing `/v1/embeddings` usage)
- IQL queries use classification models (`kanon-universal-classifier`, `kanon-universal-classifier-mini`)
- Classification endpoint is standard pattern for AI document analysis APIs
- Matches existing `IsaacusClient` service structure

**API Request Format** (inferred from patterns):

```json
POST /v1/classify
{
  "query": "{IS confidentiality clause}",
  "text": "<document text>",
  "model": "kanon-universal-classifier"
}
```

**API Response Format** (inferred):

```json
{
  "score": 0.85,
  "matches": [
    {
      "text": "<matching excerpt>",
      "start_index": 1234,
      "end_index": 1456,
      "score": 0.85
    }
  ]
}
```

**Alternatives Considered**:

- Custom `/v1/iql` endpoint - No evidence in docs, less likely
- `/v1/query` endpoint - Possible but classification is more specific
- GraphQL API - No evidence, Isaacus uses REST

**Implementation Notes**:

- Extend existing `IsaacusClient` class in `apps/agent/src/services/isaacus_client.py`
- Add `async def classify_iql(query: str, text: str, model: str = "kanon-universal-classifier")` method
- Handle chunking for large documents (exceed model context window)
- Support both `kanon-universal-classifier` and `kanon-universal-classifier-mini` models

---

## 2. IQL Query Syntax Parsing

**Question**: Should we parse and validate IQL syntax client-side or rely on Isaacus API validation?

**Decision**: Client-side syntax validation for better UX, with API fallback for complex cases.

**Rationale**:

- Immediate feedback improves user experience (FR-002)
- Basic syntax errors can be caught before API call (saves tokens/cost)
- Complex operator precedence validation may require API (FR-012)
- Isaacus API will validate anyway, but early validation reduces failed requests

**Validation Rules** (from IQL spec):

- Statements enclosed in `{}` (optional for standalone)
- Template format: `{IS <template name>}` or `{IS <template name> "<arg>"}`
- Operators: `AND`, `OR`, `NOT`, `>`, `<`, `+`
- Operator precedence: `()` → `+` → `>`, `<` → `NOT` → `AND` → `OR`
- Parentheses for grouping

**Implementation Notes**:

- Create `validateIQLQuery()` function in frontend
- Use regex for basic syntax checks (statement format, operator presence)
- For complex queries with nested operators, rely on API validation
- Display clear error messages with IQL syntax guidance

**Alternatives Considered**:

- Full client-side parser - Overkill, adds complexity
- No validation - Poor UX, wastes API calls
- Server-side only - Delayed feedback, worse UX

---

## 3. Document Chunking Strategy for Large Documents

**Question**: How should we handle documents larger than Isaacus model context window?

**Decision**: Chunk document using existing chunking logic (from `process-document` Edge Function), execute IQL query on each chunk, aggregate results.

**Rationale**:

- Edge case identified in spec (documents too large for context window)
- Existing chunking logic already in place (~500 tokens per chunk)
- IQL queries return scores per chunk, can aggregate (max for OR, min for AND)
- Maintains consistency with existing document processing patterns

**Chunking Approach**:

- Reuse chunking function from `supabase/functions/process-document/index.ts`
- Chunk size: ~500 tokens (matches existing embedding chunking)
- Overlap: 50 tokens between chunks (to avoid splitting clauses)
- Execute IQL query on each chunk sequentially
- Aggregate results: collect all matches with chunk context

**Result Aggregation**:

- For single statements: Return all matches with scores
- For AND queries: Return matches where all conditions met (min score)
- For OR queries: Return all matches (max score)
- Include chunk index and position in original document

**Alternatives Considered**:

- Reject large documents - Poor UX, limits functionality
- Single large query with truncation - Loses information
- Sliding window approach - More complex, similar results

---

## 4. IQL Template Management

**Question**: How should we manage the list of available IQL templates?

**Decision**: Hardcode template list in frontend based on Isaacus documentation, with API endpoint to refresh/validate.

**Rationale**:

- Templates are stable (from Isaacus docs, not user-generated)
- 15+ templates required (SC-004)
- Hardcoding provides offline access and fast loading
- API endpoint allows future dynamic updates if Isaacus adds templates

**Template Data Structure**:

```typescript
interface IQLTemplate {
  name: string;
  displayName: string;
  description: string;
  requiresParameter: boolean;
  parameterName?: string;
  example: string;
  modelTokens: {
    "kanon-universal-classifier": number;
    "kanon-universal-classifier-mini": number;
  };
}
```

**Implementation Notes**:

- Create `iql-templates.ts` constant file in frontend
- Include all templates from [Isaacus templates page](https://docs.isaacus.com/iql/templates)
- Categorize templates (clauses, parties, rights, obligations)
- API route `/api/iql/templates` returns template list (for future extensibility)

**Template Categories** (from docs):

- Clause Types: confidentiality, termination, indemnity, governing law, etc.
- Party-Specific: clause obligating, clause entitling
- Generic: clause, clause that, obligation, right

**Alternatives Considered**:

- Fetch from Isaacus API - No API endpoint exists, adds dependency
- Database storage - Overkill, templates are static
- User-defined templates - Out of scope for MVP

---

## 5. Saved Queries Storage

**Question**: What data should be stored for saved IQL queries?

**Decision**: Store query string, name, description, user ID, creation date, and optional document/matter context.

**Rationale**:

- FR-009 requires persistence across sessions
- User-scoped (Supabase Auth)
- Simple structure supports reuse across documents
- Optional matter/document context enables future "apply to all documents in matter" feature

**Database Schema** (draft):

```sql
create table public.saved_iql_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade not null,
  name text not null,
  description text,
  query_string text not null,
  matter_id uuid references public.matters (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint saved_iql_queries_name_not_empty check (char_length(trim(name)) > 0),
  constraint saved_iql_queries_query_not_empty check (char_length(trim(query_string)) > 0)
);
```

**Fields**:

- `id`: Primary key
- `user_id`: Owner (RLS scoped)
- `name`: User-friendly name (required)
- `description`: Optional notes
- `query_string`: IQL query text (required)
- `matter_id`: Optional context (nullable, for future "apply to matter" feature)
- `created_at`, `updated_at`: Timestamps

**Alternatives Considered**:

- Store in localStorage - Not persistent across devices, violates FR-009
- Store query parameters separately - Overcomplicates, query string is sufficient
- Include query results - Results are document-specific, shouldn't be saved

---

## 6. Error Handling and Retry Logic

**Question**: How should we handle Isaacus API failures and retries?

**Decision**: Reuse existing retry pattern from `IsaacusClient` (3 attempts with exponential backoff), with user-friendly error messages.

**Rationale**:

- Existing `IsaacusClient._request()` method has retry logic
- Consistent error handling across Isaacus API calls
- FR-010 requires graceful error handling
- SC-006 requires error messages within 5 seconds

**Error Categories**:

1. **API Unavailable** (5xx, network errors): Retry with backoff, show "Service temporarily unavailable"
2. **Invalid Query** (4xx, syntax errors): No retry, show syntax error with guidance
3. **Rate Limiting** (429): Retry with longer backoff, show "Rate limit exceeded"
4. **Authentication** (401): No retry, show "API key invalid" (admin message)

**User-Facing Messages**:

- Generic: "Unable to analyze document. Please try again."
- Syntax Error: "Invalid IQL query syntax. Check your query format."
- Timeout: "Query timed out. Try a simpler query or smaller document."
- Rate Limit: "Too many requests. Please wait a moment."

**Implementation Notes**:

- Extend `IsaacusClient._request()` retry logic (already exists)
- Frontend API routes catch errors and return user-friendly messages
- Log detailed errors server-side for debugging
- Show retry button in UI for transient failures

**Alternatives Considered**:

- No retries - Poor UX for transient failures
- Infinite retries - Could hang on persistent failures
- Custom retry per endpoint - Inconsistent, duplicates logic

---

## Summary of Decisions

| Decision                      | Rationale                                  | Impact                                |
| ----------------------------- | ------------------------------------------ | ------------------------------------- |
| Use `/v1/classify` endpoint   | Follows existing API patterns              | Low - standard REST endpoint          |
| Client-side syntax validation | Better UX, immediate feedback              | Medium - requires validation logic    |
| Chunk large documents         | Reuse existing chunking, aggregate results | Medium - chunking + aggregation logic |
| Hardcode template list        | Stable templates, fast loading             | Low - simple constant file            |
| Store queries in database     | Persistent, user-scoped, simple schema     | Low - standard table design           |
| Reuse existing retry logic    | Consistent error handling                  | Low - extends existing pattern        |

**All NEEDS CLARIFICATION items resolved.** Ready for Phase 1 design.
