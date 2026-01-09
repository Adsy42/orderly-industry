# Data Model: Isaacus IQL Integration

**Feature**: 001-isaacus-iql-integration  
**Date**: 2024-12-24

## Overview

This feature adds one new database table (`saved_iql_queries`) to persist user-created IQL queries for reuse. All other data (documents, users, matters) already exists in the system.

## Entities

### 1. Saved IQL Query

**Purpose**: Store user-created IQL queries for reuse across sessions and documents.

**Table**: `public.saved_iql_queries`

**Fields**:

| Column         | Type          | Constraints                                           | Description                                                    |
| -------------- | ------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| `id`           | `uuid`        | PRIMARY KEY, DEFAULT `gen_random_uuid()`              | Unique identifier                                              |
| `user_id`      | `uuid`        | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE       | Owner of the saved query                                       |
| `name`         | `text`        | NOT NULL, CHECK `char_length(trim(name)) > 0`         | User-friendly name for the query                               |
| `description`  | `text`        | NULL                                                  | Optional description/notes                                     |
| `query_string` | `text`        | NOT NULL, CHECK `char_length(trim(query_string)) > 0` | IQL query text (e.g., `{IS confidentiality clause}`)           |
| `matter_id`    | `uuid`        | NULL, FK → `matters(id)` ON DELETE SET NULL           | Optional matter context (for future "apply to matter" feature) |
| `created_at`   | `timestamptz` | NOT NULL, DEFAULT `now()`                             | Creation timestamp                                             |
| `updated_at`   | `timestamptz` | NOT NULL, DEFAULT `now()`                             | Last update timestamp                                          |

**Indexes**:

- `saved_iql_queries_user_id_idx` on `user_id` (for RLS and user queries)
- `saved_iql_queries_matter_id_idx` on `matter_id` (for matter-scoped queries, nullable)
- `saved_iql_queries_created_at_idx` on `created_at DESC` (for chronological listing)

**Row Level Security (RLS)**:

- **SELECT**: Users can only see their own saved queries
- **INSERT**: Users can create queries for themselves only
- **UPDATE**: Users can only update their own queries
- **DELETE**: Users can only delete their own queries

**Relationships**:

- `user_id` → `profiles.id` (many-to-one, CASCADE delete)
- `matter_id` → `matters.id` (many-to-one, SET NULL on delete, optional)

**State Transitions**: None (static entity, no status field)

**Validation Rules**:

- `name` must be non-empty after trimming whitespace
- `query_string` must be non-empty after trimming whitespace
- `query_string` should be valid IQL syntax (enforced by application, not DB)

---

## Existing Entities (Referenced)

### Documents (`public.documents`)

**Used By**: IQL queries execute against document `extracted_text` field.

**Relevant Fields**:

- `id`: Document identifier
- `extracted_text`: Text content for IQL analysis (already populated by existing processing)
- `processing_status`: Must be `'ready'` for IQL queries (text extraction complete)
- `matter_id`: Links document to matter

**No Changes Required**: Documents table already supports IQL query execution.

---

### Matters (`public.matters`)

**Used By**: Optional context for saved queries (future "apply to all documents in matter" feature).

**Relevant Fields**:

- `id`: Matter identifier
- `title`: Matter name (for display in saved queries UI)

**No Changes Required**: Matters table already exists.

---

### Profiles (`public.profiles`)

**Used By**: User ownership of saved queries via `user_id` foreign key.

**Relevant Fields**:

- `id`: User identifier (from Supabase Auth)

**No Changes Required**: Profiles table already exists.

---

## Query Result (Transient)

**Purpose**: Results from IQL query execution (not persisted, returned via API).

**Structure** (TypeScript interface):

```typescript
interface IQLQueryResult {
  query: string;
  documentId: string;
  score: number; // Overall score (0-1)
  matches: IQLMatch[];
  executedAt: string; // ISO timestamp
}

interface IQLMatch {
  text: string; // Excerpt of matching text
  startIndex: number; // Character position in document
  endIndex: number; // Character position in document
  score: number; // Confidence score (0-1) for this match
  chunkIndex?: number; // If document was chunked
}
```

**Storage**: Not stored in database. Results are ephemeral and generated on-demand.

---

## Migration Strategy

**New Migration**: `YYYYMMDDHHMMSS_create_saved_iql_queries.sql`

**Steps**:

1. Create `saved_iql_queries` table with all fields and constraints
2. Create indexes for performance
3. Enable RLS
4. Create RLS policies (SELECT, INSERT, UPDATE, DELETE for authenticated users)
5. Add table comment

**Rollback**: Drop table (CASCADE will handle foreign key cleanup)

**Data Migration**: None required (new feature, no existing data)

---

## RLS Policy Details

### SELECT Policy

```sql
CREATE POLICY "Users can view their own saved queries"
ON public.saved_iql_queries
FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);
```

### INSERT Policy

```sql
CREATE POLICY "Users can create saved queries for themselves"
ON public.saved_iql_queries
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);
```

### UPDATE Policy

```sql
CREATE POLICY "Users can update their own saved queries"
ON public.saved_iql_queries
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);
```

### DELETE Policy

```sql
CREATE POLICY "Users can delete their own saved queries"
ON public.saved_iql_queries
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);
```

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns indexed
2. **RLS**: Use `(select auth.uid())` pattern for performance (not `auth.uid()`)
3. **Query String Length**: No explicit limit, but application should validate reasonable length (< 10KB)
4. **List Queries**: Use `created_at DESC` index for chronological listing

---

## Future Extensions (Out of Scope)

- Query execution history (track which queries were run on which documents)
- Shared queries (allow users to share queries with team)
- Query templates (user-defined templates, not just Isaacus templates)
- Matter-scoped query execution (apply query to all documents in matter)





