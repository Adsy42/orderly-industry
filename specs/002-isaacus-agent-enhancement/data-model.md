# Data Model: Isaacus Agent Enhancement

**Feature**: 002-isaacus-agent-enhancement  
**Date**: 2024-12-24

## Overview

This feature does NOT require any new database tables. It extends existing functionality by:

1. Wiring up an existing agent tool (`isaacus_iql`)
2. Passing additional context (document_id) through existing chat message flow
3. Updating agent instructions for tool selection

All data entities are transient (passed in API calls) or already exist in the database.

---

## Existing Entities (Referenced)

### Documents (`public.documents`)

**Used By**: IQL queries execute against document `extracted_text` field.

**Relevant Fields**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Document identifier - passed as `document_id` in context |
| `matter_id` | uuid | Matter this document belongs to |
| `filename` | text | Document name for display |
| `extracted_text` | text | Full text content for IQL analysis |
| `processing_status` | text | Must be `'ready'` for IQL queries |

**No Changes Required**: Documents table already supports IQL query execution.

---

### Saved IQL Queries (`public.saved_iql_queries`)

**Used By**: User-saved queries for reuse across documents.

**Relevant Fields**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Saved query identifier |
| `user_id` | uuid | Owner of the saved query |
| `name` | text | User-friendly name |
| `query_string` | text | IQL query text |
| `matter_id` | uuid | Optional matter context |

**No Changes Required**: Table already exists from 001-isaacus-iql-integration.

---

## Transient Data Structures

### Chat Context Message

**Purpose**: Passes matter and document context to the agent in each conversation.

**Structure** (String format in chat):

```text
[CONTEXT] The user has selected matter "{matter_name}" (matter_id: {matter_id}).
The user is currently viewing document "{document_name}" (document_id: {document_id}).
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matter_id` | UUID | Yes | Current matter ID |
| `matter_name` | string | Yes | Matter display name |
| `document_id` | UUID | No | Current document ID (when viewing specific doc) |
| `document_name` | string | No | Document filename (when viewing specific doc) |

**Variations**:

- **Matter-level context** (no specific document):
  ```text
  [CONTEXT] The user has selected matter "Test Case" (matter_id: abc123...).
  ```
- **Document-level context** (viewing specific document):
  ```text
  [CONTEXT] The user has selected matter "Test Case" (matter_id: abc123...).
  The user is currently viewing document "Service Agreement.pdf" (document_id: def456...).
  ```

---

### IQL Query Result

**Purpose**: Results from IQL query execution via `isaacus_iql` tool.

**Structure** (TypeScript interface for frontend display):

```typescript
interface IQLQueryResult {
  query: string;
  document_results: DocumentIQLResult[];
  total_matches: number;
  average_score: number;
}

interface DocumentIQLResult {
  document_id: string;
  filename: string;
  score: number; // Calibrated probability (0-1)
  matches: IQLMatch[];
  match_count: number;
  error?: string;
}

interface IQLMatch {
  text: string; // Matching text excerpt
  start_index: number; // Character position start
  end_index: number; // Character position end
  score: number; // Confidence score (0-1)
}
```

**Score Interpretation**:
| Score Range | Meaning | UI Indicator |
|-------------|---------|--------------|
| ≥ 0.70 | High confidence | 🟢 Green |
| 0.50 - 0.69 | Medium confidence | 🟡 Yellow |
| < 0.50 | Low confidence | 🔴 Red |

---

### IQL Template

**Purpose**: Pre-built query templates for one-click analysis.

**Structure** (Already exists in `iql-templates.ts`):

```typescript
interface IQLTemplate {
  name: string; // Template identifier
  displayName: string; // Human-readable name
  description: string; // What this template finds
  requiresParameter: boolean;
  parameterName?: string; // e.g., "party name"
  example: string; // e.g., '{IS confidentiality clause}'
  modelTokens: {
    "kanon-universal-classifier": number;
    "kanon-universal-classifier-mini": number;
  };
  category: string; // e.g., "Clauses", "Rights", "Parties"
}
```

**No Changes Required**: Templates already defined with 15+ entries.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERACTION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User views document in UI                                               │
│     └─► Frontend captures document_id from URL                              │
│                                                                              │
│  2. User sends chat message                                                 │
│     └─► Frontend injects [CONTEXT] with matter_id + document_id            │
│                                                                              │
│  3. Agent receives message                                                  │
│     └─► Agent parses [CONTEXT] for IDs                                     │
│     └─► Agent selects appropriate tool based on query intent               │
│                                                                              │
│  4. IQL tool executes                                                       │
│     └─► Fetches document(s) from Supabase                                  │
│     └─► Calls Isaacus Universal Classifier API                             │
│     └─► Returns scored matches                                             │
│                                                                              │
│  5. Results displayed                                                       │
│     └─► Frontend shows matches with confidence indicators                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy

**No migrations required** - this feature uses existing tables only.

---

## Future Extensions (Out of Scope)

- Query execution history tracking
- Shared queries between users
- Matter-scoped IQL execution (all docs at once)
- IQL query builder wizard



