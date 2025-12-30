-- Migration: Create document_embeddings table
-- Purpose: Store vector embeddings of document chunks for semantic search
-- Affected tables: public.document_embeddings
-- Special considerations: Requires pgvector extension, includes RLS policies

-- Enable pgvector extension for vector similarity search
create extension if not exists vector with schema extensions;

-- Create document_embeddings table
create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents (id) on delete cascade not null,
  chunk_index integer not null,
  chunk_text text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  
  -- Constraints
  constraint document_embeddings_unique unique (document_id, chunk_index),
  constraint document_embeddings_chunk_index_positive check (chunk_index >= 0)
);

-- Add table comment
comment on table public.document_embeddings is 'Vector embeddings of document chunks for semantic search using Isaacus.';

-- Create indexes for performance
create index document_embeddings_document_id_idx on public.document_embeddings using btree (document_id);

-- Create vector similarity search index (IVFFlat for approximate nearest neighbor)
-- Note: For production with more documents, consider HNSW index instead
create index document_embeddings_embedding_idx on public.document_embeddings 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Enable Row Level Security
alter table public.document_embeddings enable row level security;

-- RLS Policy: Users can view embeddings for documents in accessible matters
create policy "Users can view embeddings for accessible documents"
on public.document_embeddings
for select
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- Note: INSERT/UPDATE/DELETE operations are restricted to service role only
-- The processing pipeline will use service role to manage embeddings

-- Create function to match document embeddings by similarity
create or replace function public.match_document_embeddings(
  query_embedding vector(1536),
  matter_uuid uuid,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index integer,
  chunk_text text,
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
    de.id,
    de.document_id,
    de.chunk_index,
    de.chunk_text,
    d.filename,
    (1 - (de.embedding <=> query_embedding))::float as similarity
  from public.document_embeddings de
  join public.documents d on de.document_id = d.id
  where d.matter_id = matter_uuid
    and d.processing_status = 'ready'
    and (1 - (de.embedding <=> query_embedding)) > match_threshold
  order by de.embedding <=> query_embedding
  limit match_count;
end;
$$;

comment on function public.match_document_embeddings is 'Semantic similarity search for document chunks within a matter.';







