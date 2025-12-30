-- Migration: Create document_sections table
-- Purpose: Store hierarchical document structure for precise citations
-- Affected tables: public.document_sections
-- Special considerations: Tree structure with self-referencing foreign key

-- Create document_sections table (tree structure)
create table public.document_sections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents (id) on delete cascade not null,
  parent_section_id uuid references public.document_sections (id) on delete cascade,
  
  -- Section identity
  section_number text,           -- "7.2", "§ 512(c)", "III.A", etc.
  title text,                    -- Section heading text
  level int not null,            -- Hierarchy depth (1 = top level)
  sequence int not null,         -- Order within parent
  
  -- Full path for display and querying
  path text[] not null,          -- ['7. Miscellaneous', '7.2 Governing Law']
  
  -- Page location
  start_page int,
  end_page int,
  
  created_at timestamptz not null default now()
);

-- Add table comment
comment on table public.document_sections is 'Hierarchical sections within documents for precise citation and navigation.';

-- Create indexes for performance
create index idx_sections_document on public.document_sections using btree (document_id);
create index idx_sections_parent on public.document_sections using btree (parent_section_id);
create index idx_sections_path on public.document_sections using gin (path);
create index idx_sections_level on public.document_sections using btree (level);

-- Enable Row Level Security
alter table public.document_sections enable row level security;

-- RLS Policy: Users can view sections for documents in accessible matters
create policy "Users can view sections for accessible documents"
on public.document_sections
for select
to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = document_id
    and public.user_can_access_matter(d.matter_id)
  )
);

-- RLS Policy: Service role can insert/update/delete (for processing pipeline)
-- Note: INSERT/UPDATE/DELETE operations are restricted to service role only

-- Function to get section tree for a document
create or replace function public.get_section_tree(
  doc_uuid uuid
)
returns table (
  id uuid,
  parent_section_id uuid,
  section_number text,
  title text,
  level int,
  sequence int,
  path text[],
  start_page int,
  end_page int
)
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return query
  select 
    ds.id,
    ds.parent_section_id,
    ds.section_number,
    ds.title,
    ds.level,
    ds.sequence,
    ds.path,
    ds.start_page,
    ds.end_page
  from public.document_sections ds
  where ds.document_id = doc_uuid
  order by ds.path;
end;
$$;

comment on function public.get_section_tree is 'Get hierarchical section tree for a document, ordered by path.';




