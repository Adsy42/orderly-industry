-- Migration: Fix embedding dimension for Isaacus kanon-2-embedder
-- Purpose: Change vector dimension from 1536 to 1792 to match Isaacus embedding model
-- Affected tables: public.document_embeddings, public.match_document_embeddings function
-- Special considerations: This will invalidate existing embeddings - documents need reprocessing

-- Step 1: Drop the existing vector index (required before altering column)
drop index if exists public.document_embeddings_embedding_idx;

-- Step 2: Alter the embedding column dimension from 1536 to 1792
-- Note: This requires the column to be empty or embeddings to be re-generated
alter table public.document_embeddings 
  alter column embedding type vector(1792);

-- Step 3: Recreate the vector similarity index with correct dimension
create index document_embeddings_embedding_idx on public.document_embeddings 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Step 4: Drop and recreate the match function with correct dimension
drop function if exists public.match_document_embeddings(vector(1536), uuid, float, int);

create or replace function public.match_document_embeddings(
  query_embedding vector(1792),
  matter_uuid uuid,
  match_threshold float default 0.5,
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

comment on function public.match_document_embeddings is 'Semantic similarity search for document chunks within a matter. Uses Isaacus kanon-2-embedder (1792 dimensions).';

-- Step 5: Mark all documents as needing reprocessing
-- This is necessary because existing embeddings have wrong dimension
update public.documents
set processing_status = 'pending',
    processed_at = null,
    error_message = 'Reprocessing required: embedding dimension changed from 1536 to 1792'
where processing_status = 'ready';

-- Step 6: Clear any existing embeddings (they have wrong dimension)
truncate public.document_embeddings;





