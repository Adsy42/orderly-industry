-- Migration: Create hybrid search infrastructure
-- Purpose: Enable combined vector + keyword search for legal precision
-- Affected tables: public.document_chunks
-- Special considerations: Requires pg_trgm extension

-- Step 1: Enable pg_trgm extension for trigram similarity search
create extension if not exists pg_trgm with schema extensions;

-- Step 2: Create trigram index on content for keyword matching
create index if not exists idx_chunks_content_trgm 
  on public.document_chunks 
  using gin (content extensions.gin_trgm_ops);

-- Step 3: Drop and recreate vector index with HNSW for better performance
drop index if exists document_embeddings_embedding_idx;
drop index if exists idx_chunks_embedding;

create index idx_chunks_embedding_hnsw 
  on public.document_chunks 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Step 4: Create hybrid search function
create or replace function public.hybrid_search_chunks(
  query_embedding vector(1792),
  query_text text,
  matter_uuid uuid,
  semantic_weight float default 0.7,
  match_threshold float default 0.5,
  match_count int default 20,
  include_context boolean default true
)
returns table (
  id uuid,
  document_id uuid,
  section_id uuid,
  parent_chunk_id uuid,
  content text,
  citation jsonb,
  filename text,
  score float,
  parent_content text
)
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return query
  with semantic_scores as (
    select 
      dc.id,
      (1 - (dc.embedding <=> query_embedding)) as semantic_score
    from public.document_chunks dc
    join public.documents d on dc.document_id = d.id
    where d.matter_id = matter_uuid
      and d.processing_status = 'ready'
      and dc.chunk_level = 'paragraph'
  ),
  keyword_scores as (
    select 
      dc.id,
      extensions.similarity(dc.content, query_text) as keyword_score
    from public.document_chunks dc
    join public.documents d on dc.document_id = d.id
    where d.matter_id = matter_uuid
      and d.processing_status = 'ready'
      and dc.chunk_level = 'paragraph'
      and dc.content % query_text
  ),
  scored_chunks as (
    select 
      dc.id,
      dc.document_id,
      dc.section_id,
      dc.parent_chunk_id,
      dc.content,
      dc.citation,
      d.filename,
      (
        coalesce(ss.semantic_score, 0) * semantic_weight +
        coalesce(ks.keyword_score, 0) * (1 - semantic_weight)
      ) as combined_score
    from public.document_chunks dc
    join public.documents d on dc.document_id = d.id
    left join semantic_scores ss on dc.id = ss.id
    left join keyword_scores ks on dc.id = ks.id
    where d.matter_id = matter_uuid
      and d.processing_status = 'ready'
      and dc.chunk_level = 'paragraph'
      and (ss.semantic_score is not null or ks.keyword_score is not null)
  )
  select 
    sc.id,
    sc.document_id,
    sc.section_id,
    sc.parent_chunk_id,
    sc.content,
    sc.citation,
    sc.filename,
    sc.combined_score as score,
    case 
      when include_context and sc.parent_chunk_id is not null 
      then parent.content 
      else null 
    end as parent_content
  from scored_chunks sc
  left join public.document_chunks parent on sc.parent_chunk_id = parent.id
  where sc.combined_score > match_threshold
  order by sc.combined_score desc
  limit match_count;
end;
$$;

comment on function public.hybrid_search_chunks is 
  'Hybrid semantic + keyword search for document chunks. Combines vector similarity with trigram matching for precise legal term retrieval.';

-- Step 5: Grant execute permission
grant execute on function public.hybrid_search_chunks to authenticated;
grant execute on function public.get_section_tree to authenticated;
grant execute on function public.get_chunk_with_context to authenticated;
grant execute on function public.match_document_chunks to authenticated;

