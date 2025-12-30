# Research: Natural Language to IQL Translation

**Feature**: 006-nl-iql-translation  
**Date**: 2025-01-27  
**Status**: Complete

## Research Objectives

1. Determine optimal LLM prompt structure for translating natural language to IQL syntax
2. Identify template matching and fallback strategies
3. Define error handling patterns for translation failures
4. Research UI/UX patterns for dual-mode input interfaces

---

## 1. LLM Prompt Engineering for IQL Translation

### Decision

Use structured JSON response format with OpenAI GPT-4o-mini, including comprehensive IQL template and operator documentation in system prompt.

### Rationale

- **JSON Response Format**: Ensures structured output that can be validated before use. Reduces parsing errors and enables better error handling.
- **GPT-4o-mini**: Cost-effective model with sufficient capability for structured translation tasks. Already in use for clause extraction (see `apps/frontend/src/lib/isaacus.ts`).
- **Template Documentation in Prompt**: Including full template list ensures LLM knows available options and can prefer templates over custom descriptions.
- **Temperature 0**: Deterministic output for consistency - important for query translation accuracy.

### Implementation Approach

```typescript
// Prompt structure
system: "You translate natural language legal queries to IQL syntax. 
         Use templates when available. Operators: AND, OR, NOT, >, <, +.
         Precedence: () → + → >, < → NOT → AND → OR"
user: "{natural_language_query}"
response_format: { type: "json_object" }
```

**Response Schema**:
```json
{
  "iql": "{IS confidentiality clause} AND {IS unilateral clause}",
  "explanation": "One-sided confidentiality clauses",
  "templates_used": ["confidentiality clause", "unilateral clause"],
  "confidence": 0.95
}
```

### Alternatives Considered

- **Few-shot examples**: Rejected - templates list + operator rules provide sufficient context
- **Multi-step translation**: Rejected - adds latency, single-step translation sufficient
- **Different LLM (Claude, Gemini)**: Rejected - OpenAI already integrated, GPT-4o-mini cost-effective

### References

- OpenAI Chat Completions API: https://platform.openai.com/docs/api-reference/chat
- Existing clause extraction pattern: `apps/frontend/src/lib/isaacus.ts` (extractClauseWithLLM function)

---

## 2. IQL Template Matching Strategies

### Decision

Use prompt-based template preference: LLM receives full template list with descriptions, instructed to prefer templates when natural language matches intent.

### Rationale

- **Prompt-Based Matching**: Leverages LLM's semantic understanding to match user intent to templates, more flexible than keyword matching
- **Template List from iql-templates.ts**: Single source of truth for available templates (already exists in codebase)
- **Fallback to `{IS clause that "..."}`**: Ensures all queries can be translated even when no template matches

### Template List Source

Templates are defined in `apps/frontend/src/lib/iql-templates.ts` and exposed via `/api/iql/templates`. Translation service will reference this same list to ensure consistency.

### Matching Priority

1. **Exact template match**: "termination clauses" → `{IS termination clause}`
2. **Combined templates**: "one-sided confidentiality" → `{IS confidentiality clause} AND {IS unilateral clause}`
3. **Parameterized templates**: "clauses obligating Customer" → `{IS clause obligating "Customer"}`
4. **Custom description fallback**: "data retention policies" → `{IS clause that "data retention policies"}`

### Alternatives Considered

- **Keyword matching**: Rejected - too rigid, misses semantic similarity
- **Embedding-based similarity**: Rejected - overkill, LLM provides semantic understanding
- **Template taxonomy/classification**: Rejected - adds complexity without clear benefit

### References

- IQL Templates documentation: https://docs.isaacus.com/iql/templates
- Existing template definitions: `apps/frontend/src/lib/iql-templates.ts`

---

## 3. Error Handling Patterns for LLM Translation

### Decision

Multi-layer error handling: translation API errors → IQL validation → user-friendly messages with fallback to manual IQL entry.

### Rationale

- **Translation API Errors**: LLM service failures (timeout, API error) should not block users - allow manual IQL entry
- **IQL Validation**: Validate translated queries using existing `validateIQLQuery` before execution
- **User-Friendly Messages**: Errors should guide users toward solutions (e.g., "Translation failed, try IQL syntax directly")
- **Fallback Pattern**: Always allow users to switch to IQL mode if translation fails

### Error Handling Flow

```
User enters NL → Translation API
  ├─ Success → Validate IQL → Execute
  ├─ Translation Error → Show error + suggest IQL mode
  ├─ Invalid IQL → Show validation error + suggest correction
  └─ Timeout → Show timeout message + allow retry or IQL mode
```

### Error Message Patterns

- **Translation Service Unavailable**: "Translation service is temporarily unavailable. Please use IQL syntax directly or try again later."
- **Invalid Translation**: "Could not translate your query. Please try rephrasing or use IQL syntax directly."
- **Validation Failed**: "The translated query is invalid: [error]. Please try rephrasing your search."
- **Timeout**: "Translation is taking longer than expected. Try again or use IQL syntax directly."

### Alternatives Considered

- **Retry on failure**: Rejected - adds complexity, better to allow user to switch modes
- **Cached translations**: Rejected - stateless service preferred, minimal benefit
- **Alternative LLM on failure**: Rejected - adds complexity and cost

### References

- Existing error handling: `apps/frontend/src/app/api/iql/query/route.ts` (lines 241-282)
- IQL validation: `apps/frontend/src/lib/iql-validation.ts`

---

## 4. UI/UX Patterns for Mode Toggle

### Decision

Toggle button/tabs near input field with clear mode indicators. Display translated IQL query in results header with copy/switch capability.

### Rationale

- **Visible Toggle**: Users should immediately see they can switch between modes
- **Mode Indicators**: Clear labeling ("Natural Language" vs "IQL") prevents confusion
- **Input Preservation**: Switching modes should preserve text (though may need re-translation)
- **Transparency**: Display translated IQL in results so users learn and verify

### UI Component Structure

```
┌─────────────────────────────────────┐
│ [Natural Language] [IQL] ← Toggle   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Enter your search...            │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Find Clauses]                      │
└─────────────────────────────────────┘

Results:
┌─────────────────────────────────────┐
│ Translated to: {IS conf} AND {IS...}│ ← Visible, clickable
│ [Copy] [Switch to IQL mode]         │
│                                     │
│ Results:                            │
│ ...                                 │
└─────────────────────────────────────┘
```

### Mode Switch Behavior

- **NL → IQL**: Preserve text, clear NL-specific validation errors
- **IQL → NL**: Preserve text, treat as natural language (may re-translate if executed)
- **State Management**: React state tracks current mode, stored in component (no persistence needed)

### Alternatives Considered

- **Dropdown selector**: Rejected - toggle/buttons more discoverable
- **Separate input fields**: Rejected - unnecessary duplication, confusing UX
- **Auto-detect mode**: Rejected - ambiguous input (could be valid IQL or NL), explicit choice clearer

### References

- Existing UI patterns: `apps/frontend/src/components/documents/iql-query-builder.tsx`
- Radix UI components available: Switch, Tabs (see `package.json` for available components)

---

## Implementation Notes

### API Endpoint Design

- **Path**: `/api/iql/translate`
- **Method**: POST
- **Auth**: Server-side Supabase client (authentication required)
- **Request**: `{ query: string }` (natural language input)
- **Response**: `{ iql: string, explanation?: string, templates_used?: string[], confidence?: number }`

### Integration Points

1. **Translation Service**: New `/api/iql/translate/route.ts`
2. **Query Builder Component**: Modify `iql-query-builder.tsx` to add mode toggle and translation call
3. **Results Display**: Modify `iql-results.tsx` to show translated IQL query
4. **Validation**: Reuse existing `validateIQLQuery` from `iql-validation.ts`

### Environment Variables

- `OPENAI_API_KEY` (already required for clause extraction)
- No new environment variables needed

---

## Open Questions Resolved

- ✅ **Translation service location**: Server-side API route (follows existing pattern)
- ✅ **LLM model choice**: GPT-4o-mini (cost-effective, already integrated)
- ✅ **Template list source**: Reference `iql-templates.ts` (single source of truth)
- ✅ **Error handling**: Multi-layer with graceful degradation
- ✅ **UI pattern**: Toggle buttons with clear mode indicators
- ✅ **State management**: React component state (no persistence needed)

