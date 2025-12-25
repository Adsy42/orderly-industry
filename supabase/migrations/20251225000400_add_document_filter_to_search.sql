-- Migration: Add document_ids filter to hybrid search
-- Purpose: Allow filtering search by specific documents (multi-select UI)
-- Affected functions: public.hybrid_search_chunks

-- Drop and recreate with new parameter
create or replace function public.hybrid_search_chunks(
  query_embedding vector(1792),
  query_text text,
  matter_uuid uuid,
  document_uuids uuid[] default null,  -- NEW: Optional array of document IDs to filter
  semantic_weight float default 0.7,
  match_threshold float default 0.5,
  match_count int default 20,
  include_context boolean default true
)
returns table (
  chunk_id uuid,        -- Renamed from 'id' for clarity
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
      -- Filter by document_ids if provided
      and (document_uuids is null or d.id = any(document_uuids))
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
      -- Filter by document_ids if provided
      and (document_uuids is null or d.id = any(document_uuids))
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
      -- Filter by document_ids if provided
      and (document_uuids is null or d.id = any(document_uuids))
  )
  select 
    sc.id as chunk_id,  -- Output as chunk_id for clarity
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
  'Hybrid semantic + keyword search for document chunks. Combines vector similarity with trigram matching for precise legal term retrieval. Supports filtering by specific document IDs.';

