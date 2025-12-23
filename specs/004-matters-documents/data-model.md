# Data Model: Matters & Document Management Foundation

**Feature Branch**: `004-matters-documents`  
**Date**: 2025-12-23  
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│    profiles     │       │       matters       │       │    documents    │
│   (existing)    │       │                     │       │                 │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (uuid) PK    │───┐   │ id (uuid) PK        │───┐   │ id (uuid) PK    │
│ email           │   │   │ title               │   │   │ matter_id FK    │──┐
│ display_name    │   │   │ description         │   │   │ storage_path    │  │
│ avatar_url      │   │   │ matter_number       │   │   │ filename        │  │
│ created_at      │   │   │ status              │   │   │ file_type       │  │
│ updated_at      │   │   │ jurisdiction        │   │   │ file_size       │  │
└─────────────────┘   │   │ created_by FK       │◄──┘   │ mime_type       │  │
                      │   │ created_at          │       │ extracted_text  │  │
                      │   │ updated_at          │       │ processing_status│  │
                      │   └─────────────────────┘       │ error_message   │  │
                      │             │                   │ uploaded_by FK  │  │
                      │             │                   │ uploaded_at     │  │
                      │             │                   │ processed_at    │  │
                      │             ▼                   └─────────────────┘  │
                      │   ┌─────────────────────┐               │            │
                      │   │ matter_participants │               │            │
                      │   ├─────────────────────┤               ▼            │
                      │   │ id (uuid) PK        │       ┌─────────────────┐  │
                      │   │ matter_id FK        │◄──────│document_embeddings│ │
                      └──►│ user_id FK          │       ├─────────────────┤  │
                          │ role                │       │ id (uuid) PK    │  │
                          │ added_at            │       │ document_id FK  │◄─┘
                          └─────────────────────┘       │ chunk_index     │
                                                        │ chunk_text      │
                                                        │ embedding       │
                                                        │ created_at      │
                                                        └─────────────────┘
```

## Tables

### 1. matters

Represents a legal case or project that organizes work.

| Column          | Type        | Constraints                   | Description                    |
| --------------- | ----------- | ----------------------------- | ------------------------------ |
| `id`            | uuid        | PK, default gen_random_uuid() | Primary key                    |
| `title`         | text        | NOT NULL, max 200 chars       | Matter title                   |
| `description`   | text        | max 2000 chars                | Optional description           |
| `matter_number` | text        | UNIQUE, NOT NULL              | Auto-generated "M-YYYY-NNN"    |
| `status`        | text        | NOT NULL, default 'active'    | 'active', 'closed', 'archived' |
| `jurisdiction`  | text        | default 'AU'                  | Default Australia              |
| `created_by`    | uuid        | FK profiles(id), NOT NULL     | Owner                          |
| `created_at`    | timestamptz | NOT NULL, default now()       | Creation timestamp             |
| `updated_at`    | timestamptz | NOT NULL, default now()       | Last update timestamp          |

**Indexes**:

- `matters_created_by_idx` on `created_by` (for RLS)
- `matters_status_idx` on `status` (for filtering)
- `matters_updated_at_idx` on `updated_at DESC` (for sorting)

**Triggers**:

- `set_matter_number` - Auto-generate matter_number on INSERT
- `update_matters_updated_at` - Update updated_at on UPDATE

---

### 2. documents

Represents an uploaded file within a matter.

| Column              | Type        | Constraints                                | Description                                            |
| ------------------- | ----------- | ------------------------------------------ | ------------------------------------------------------ |
| `id`                | uuid        | PK, default gen_random_uuid()              | Primary key                                            |
| `matter_id`         | uuid        | FK matters(id) ON DELETE CASCADE, NOT NULL | Parent matter                                          |
| `storage_path`      | text        | NOT NULL                                   | Path in Supabase Storage                               |
| `filename`          | text        | NOT NULL                                   | Original filename                                      |
| `file_type`         | text        | NOT NULL                                   | 'pdf', 'docx', 'txt'                                   |
| `file_size`         | bigint      | NOT NULL                                   | Size in bytes                                          |
| `mime_type`         | text        |                                            | MIME type                                              |
| `extracted_text`    | text        |                                            | Full extracted text                                    |
| `processing_status` | text        | NOT NULL, default 'pending'                | 'pending', 'extracting', 'embedding', 'ready', 'error' |
| `error_message`     | text        |                                            | Error details if failed                                |
| `uploaded_by`       | uuid        | FK profiles(id), NOT NULL                  | Uploader                                               |
| `uploaded_at`       | timestamptz | NOT NULL, default now()                    | Upload timestamp                                       |
| `processed_at`      | timestamptz |                                            | Processing completion timestamp                        |

**Indexes**:

- `documents_matter_id_idx` on `matter_id` (for RLS and queries)
- `documents_uploaded_by_idx` on `uploaded_by`
- `documents_processing_status_idx` on `processing_status`
- `documents_filename_search_idx` using GIN on `to_tsvector('english', filename)` (for search)
- `documents_text_search_idx` using GIN on `to_tsvector('english', extracted_text)` (for full-text search)

**Triggers**:

- `trigger_document_processing` - Notify Edge Function on INSERT

---

### 3. matter_participants

Represents a user's access to a matter.

| Column      | Type        | Constraints                                 | Description                     |
| ----------- | ----------- | ------------------------------------------- | ------------------------------- |
| `id`        | uuid        | PK, default gen_random_uuid()               | Primary key                     |
| `matter_id` | uuid        | FK matters(id) ON DELETE CASCADE, NOT NULL  | Matter                          |
| `user_id`   | uuid        | FK profiles(id) ON DELETE CASCADE, NOT NULL | User                            |
| `role`      | text        | NOT NULL                                    | 'counsel', 'client', 'observer' |
| `added_at`  | timestamptz | NOT NULL, default now()                     | When added                      |

**Constraints**:

- UNIQUE(matter_id, user_id) - One role per user per matter

**Indexes**:

- `matter_participants_matter_id_idx` on `matter_id`
- `matter_participants_user_id_idx` on `user_id` (for RLS)

---

### 4. document_embeddings

Represents vector embeddings of document chunks for semantic search.

| Column        | Type         | Constraints                                  | Description              |
| ------------- | ------------ | -------------------------------------------- | ------------------------ |
| `id`          | uuid         | PK, default gen_random_uuid()                | Primary key              |
| `document_id` | uuid         | FK documents(id) ON DELETE CASCADE, NOT NULL | Parent document          |
| `chunk_index` | integer      | NOT NULL                                     | Position in document     |
| `chunk_text`  | text         | NOT NULL                                     | Text of this chunk       |
| `embedding`   | vector(1792) | NOT NULL                                     | Isaacus embedding vector |
| `created_at`  | timestamptz  | NOT NULL, default now()                      | Creation timestamp       |

**Constraints**:

- UNIQUE(document_id, chunk_index) - One chunk per position

**Indexes**:

- `document_embeddings_document_id_idx` on `document_id`
- `document_embeddings_embedding_idx` using ivfflat on `embedding vector_cosine_ops` (for similarity search)

---

## Enums

### matter_status

- `active` - Matter is actively being worked on
- `closed` - Matter is complete but retained
- `archived` - Matter is archived for long-term storage

### document_status

- `pending` - Uploaded, waiting for processing
- `extracting` - Text extraction in progress
- `embedding` - Embedding generation in progress
- `ready` - Fully processed and searchable
- `error` - Processing failed

### participant_role

- `counsel` - Legal professional with full access
- `client` - Client with view + upload access
- `observer` - Read-only access

---

## Functions

### generate_matter_number()

Generates unique matter numbers in format "M-YYYY-NNN".

```sql
create or replace function public.generate_matter_number()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_number text;
begin
  new_number := 'M-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.matter_number_seq')::text, 3, '0');
  return new_number;
end;
$$;
```

### user_can_access_matter(matter_uuid)

Helper function to check matter access for RLS.

```sql
create or replace function public.user_can_access_matter(matter_uuid uuid)
returns boolean
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.matters
    where id = matter_uuid
    and created_by = (select auth.uid())
  ) or exists (
    select 1 from public.matter_participants
    where matter_id = matter_uuid
    and user_id = (select auth.uid())
  );
end;
$$;
```

### match_document_embeddings(query_embedding, matter_uuid, match_threshold, match_count)

Similarity search for document chunks.

```sql
create or replace function public.match_document_embeddings(
  query_embedding vector(1792),
  matter_uuid uuid,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  document_id uuid,
  chunk_text text,
  similarity float
)
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return query
  select
    de.id,
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  join public.documents d on de.document_id = d.id
  where d.matter_id = matter_uuid
    and 1 - (de.embedding <=> query_embedding) > match_threshold
  order by de.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## Row Level Security Policies

### matters

```sql
-- SELECT: Owner or participant can view
create policy "Users can view matters they own or participate in"
on public.matters for select to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.matter_participants
    where matter_id = id and user_id = (select auth.uid())
  )
);

-- INSERT: Any authenticated user can create
create policy "Authenticated users can create matters"
on public.matters for insert to authenticated
with check (created_by = (select auth.uid()));

-- UPDATE: Only owner can update
create policy "Owners can update their matters"
on public.matters for update to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- DELETE: Only owner can delete
create policy "Owners can delete their matters"
on public.matters for delete to authenticated
using (created_by = (select auth.uid()));
```

### documents

```sql
-- SELECT: Users with matter access can view documents
create policy "Users can view documents in accessible matters"
on public.documents for select to authenticated
using (public.user_can_access_matter(matter_id));

-- INSERT: Users with counsel/client role can upload
create policy "Counsel and clients can upload documents"
on public.documents for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (
    exists (
      select 1 from public.matters
      where id = matter_id and created_by = (select auth.uid())
    )
    or exists (
      select 1 from public.matter_participants
      where matter_id = documents.matter_id
      and user_id = (select auth.uid())
      and role in ('counsel', 'client')
    )
  )
);

-- UPDATE: System updates only (for processing status)
create policy "System can update document status"
on public.documents for update to authenticated
using (public.user_can_access_matter(matter_id))
with check (public.user_can_access_matter(matter_id));

-- DELETE: Owner or counsel can delete
create policy "Owners and counsel can delete documents"
on public.documents for delete to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id and created_by = (select auth.uid())
  )
  or exists (
    select 1 from public.matter_participants
    where matter_id = documents.matter_id
    and user_id = (select auth.uid())
    and role = 'counsel'
  )
);
```

### matter_participants

```sql
-- SELECT: Participants can see other participants
create policy "Participants can view other participants"
on public.matter_participants for select to authenticated
using (public.user_can_access_matter(matter_id));

-- INSERT: Only matter owner can add participants
create policy "Owners can add participants"
on public.matter_participants for insert to authenticated
with check (
  exists (
    select 1 from public.matters
    where id = matter_id and created_by = (select auth.uid())
  )
);

-- UPDATE: Only owner can change roles
create policy "Owners can update participant roles"
on public.matter_participants for update to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id and created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.matters
    where id = matter_id and created_by = (select auth.uid())
  )
);

-- DELETE: Owner can remove participants
create policy "Owners can remove participants"
on public.matter_participants for delete to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id and created_by = (select auth.uid())
  )
);
```

### document_embeddings

```sql
-- SELECT: Inherit from document access
create policy "Users can view embeddings for accessible documents"
on public.document_embeddings for select to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- INSERT/UPDATE/DELETE: System only (via service role)
-- No authenticated user policies for write operations
```

---

## Storage Bucket

### documents

```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- RLS for storage.objects
create policy "Users can upload to their matters"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'matters'
  -- Additional validation via application layer
);

create policy "Users can view documents in their matters"
on storage.objects for select to authenticated
using (
  bucket_id = 'documents'
  -- Access validated at document record level
);

create policy "Users can delete their uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'documents');
```

---

## Migration Order

1. `20251223120000_create_matters.sql` - Matters table + sequence + functions
2. `20251223120100_create_documents.sql` - Documents table + triggers
3. `20251223120200_create_matter_participants.sql` - Participants table
4. `20251223120300_create_document_embeddings.sql` - Embeddings + pgvector
5. `20251223120400_create_storage_bucket.sql` - Storage bucket + policies
