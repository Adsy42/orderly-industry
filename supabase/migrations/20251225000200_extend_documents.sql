-- Migration: Extend documents table with normalization and structure fields
-- Purpose: Add fields for normalized markdown and structure extraction tracking
-- Affected tables: public.documents
-- Special considerations: Updates processing_status constraint

-- Step 1: Add new columns to documents table
alter table public.documents
  add column if not exists normalized_markdown text,
  add column if not exists structure_extracted boolean not null default false,
  add column if not exists extraction_quality float;

-- Step 2: Update processing_status constraint to include 'structuring' state
alter table public.documents drop constraint if exists documents_processing_status_valid;
alter table public.documents add constraint documents_processing_status_valid check (
  processing_status in ('pending', 'extracting', 'structuring', 'embedding', 'ready', 'error')
);

-- Step 3: Add comment for new columns
comment on column public.documents.normalized_markdown is 'Clean markdown representation of document for LLM context.';
comment on column public.documents.structure_extracted is 'Whether hierarchical structure has been extracted.';
comment on column public.documents.extraction_quality is 'Confidence score (0-1) for structure extraction quality.';

-- Step 4: Create index for structure_extracted filtering
create index if not exists idx_documents_structure_extracted 
  on public.documents using btree (structure_extracted) 
  where structure_extracted = false;






