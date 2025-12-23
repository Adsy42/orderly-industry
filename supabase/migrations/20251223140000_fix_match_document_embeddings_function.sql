-- Migration: Fix match_document_embeddings function
-- Problem: search_path = '' excludes extensions schema where pgvector operators are
-- Solution: Include 'extensions' in search_path for vector operations

-- Drop and recreate the function with correct search_path
drop function if exists public.match_document_embeddings(vector, uuid, double precision, integer);

-- Recreate function with proper search_path that includes extensions for pgvector operators
create or replace function public.match_document_embeddings(
  query_embedding vector,
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
set search_path = 'public', 'extensions'
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


