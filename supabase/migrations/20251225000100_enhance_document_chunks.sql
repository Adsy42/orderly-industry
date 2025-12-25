-- Migration: Enhance document_embeddings → document_chunks
-- Purpose: Add hierarchical structure, citations, and parent-child relationships
-- Affected tables: public.document_embeddings → public.document_chunks
-- Special considerations: Renames table, adds new columns for citations

-- Step 1: Rename table from document_embeddings to document_chunks
alter table if exists public.document_embeddings rename to document_chunks;

-- Step 2: Rename chunk_text column to content
alter table public.document_chunks rename column chunk_text to content;

-- Step 3: Add new columns for hierarchical structure and citations
alter table public.document_chunks
  add column if not exists section_id uuid references public.document_sections(id) on delete set null,
  add column if not exists parent_chunk_id uuid references public.document_chunks(id) on delete set null,
  add column if not exists chunk_level text not null default 'paragraph',
  add column if not exists content_hash text,
  add column if not exists embedding_model text not null default 'kanon-2',
  add column if not exists citation jsonb not null default '{}';

-- Step 4: Add constraints
alter table public.document_chunks
  add constraint chunks_level_valid check (chunk_level in ('section', 'paragraph'));

-- Step 5: Update unique constraint name
alter table public.document_chunks 
  drop constraint if exists document_embeddings_unique;
alter table public.document_chunks
  add constraint document_chunks_unique unique (document_id, chunk_index);

-- Step 6: Create new indexes
create index if not exists idx_chunks_section on public.document_chunks using btree (section_id);
create index if not exists idx_chunks_parent on public.document_chunks using btree (parent_chunk_id);
create index if not exists idx_chunks_level on public.document_chunks using btree (chunk_level);
create index if not exists idx_chunks_citation on public.document_chunks using gin (citation);

-- Step 7: Rename existing indexes
alter index if exists document_embeddings_document_id_idx rename to idx_chunks_document;

-- Step 8: Update table comment
comment on table public.document_chunks is 'Embedded document chunks with hierarchical structure and precise citations for legal grounding.';

-- Step 9: Update RLS policies (drop old, create new)
drop policy if exists "Users can view embeddings for accessible documents" on public.document_chunks;
drop policy if exists "Users can insert chunks for accessible documents" on public.document_chunks;
drop policy if exists "Users can update chunks for accessible documents" on public.document_chunks;
drop policy if exists "Users can delete chunks for accessible documents" on public.document_chunks;

-- SELECT policy
create policy "Users can view chunks for accessible documents"
on public.document_chunks
for select
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- INSERT policy (needed for document processing)
create policy "Users can insert chunks for accessible documents"
on public.document_chunks
for insert
to authenticated
with check (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- UPDATE policy (for future chunk updates)
create policy "Users can update chunks for accessible documents"
on public.document_chunks
for update
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
)
with check (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- DELETE policy (for document deletion cascade)
create policy "Users can delete chunks for accessible documents"
on public.document_chunks
for delete
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- Step 10: Function to get chunk with context
create or replace function public.get_chunk_with_context(
  chunk_uuid uuid
)
returns table (
  chunk_id uuid,
  content text,
  citation jsonb,
  parent_content text,
  sibling_chunks jsonb
)
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return query
  select 
    dc.id as chunk_id,
    dc.content,
    dc.citation,
    parent.content as parent_content,
    (
      select jsonb_agg(jsonb_build_object(
        'id', sib.id,
        'content', sib.content,
        'citation', sib.citation,
        'chunk_index', sib.chunk_index
      ) order by sib.chunk_index)
      from public.document_chunks sib
      where sib.section_id = dc.section_id
        and sib.chunk_level = 'paragraph'
        and abs(sib.chunk_index - dc.chunk_index) <= 2
        and sib.id != dc.id
    ) as sibling_chunks
  from public.document_chunks dc
  left join public.document_chunks parent on dc.parent_chunk_id = parent.id
  where dc.id = chunk_uuid;
end;
$$;

comment on function public.get_chunk_with_context is 'Get a chunk with parent section and sibling context for expanded retrieval.';

-- Step 11: Update existing match function to use new table name
-- Drop old function with old table reference
drop function if exists public.match_document_embeddings(vector(1792), uuid, float, int);

-- Recreate with new name pointing to document_chunks
create or replace function public.match_document_chunks(
  query_embedding vector(1792),
  matter_uuid uuid,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index integer,
  content text,
  filename text,
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
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    d.filename,
    (1 - (dc.embedding <=> query_embedding))::float as similarity
  from public.document_chunks dc
  join public.documents d on dc.document_id = d.id
  where d.matter_id = matter_uuid
    and d.processing_status = 'ready'
    and (1 - (dc.embedding <=> query_embedding)) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

comment on function public.match_document_chunks is 'Semantic similarity search for document chunks within a matter.';

