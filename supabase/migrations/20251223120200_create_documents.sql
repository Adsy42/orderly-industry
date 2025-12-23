-- Migration: Create documents table
-- Purpose: Store document metadata for files uploaded to matters
-- Affected tables: public.documents
-- Special considerations: Links to Supabase Storage, includes processing status

-- Create documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters (id) on delete cascade not null,
  storage_path text not null,
  filename text not null,
  file_type text not null,
  file_size bigint not null,
  mime_type text,
  extracted_text text,
  processing_status text not null default 'pending',
  error_message text,
  uploaded_by uuid references public.profiles (id) not null default auth.uid(),
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  
  -- Constraints
  constraint documents_file_type_valid check (file_type in ('pdf', 'docx', 'txt')),
  constraint documents_processing_status_valid check (
    processing_status in ('pending', 'extracting', 'embedding', 'ready', 'error')
  ),
  constraint documents_file_size_positive check (file_size > 0)
);

-- Add table comment
comment on table public.documents is 'Documents uploaded to matters, with metadata and processing status.';

-- Create indexes for performance
create index documents_matter_id_idx on public.documents using btree (matter_id);
create index documents_uploaded_by_idx on public.documents using btree (uploaded_by);
create index documents_processing_status_idx on public.documents using btree (processing_status);
create index documents_uploaded_at_idx on public.documents using btree (uploaded_at desc);

-- Create full-text search index on filename
create index documents_filename_search_idx on public.documents 
  using gin (to_tsvector('english', filename));

-- Create full-text search index on extracted text (for ready documents)
create index documents_text_search_idx on public.documents 
  using gin (to_tsvector('english', coalesce(extracted_text, '')));

-- Enable Row Level Security
alter table public.documents enable row level security;

-- RLS Policy: Users can view documents in matters they have access to
create policy "Users can view documents in accessible matters"
on public.documents
for select
to authenticated
using (public.user_can_access_matter(matter_id));

-- RLS Policy: Counsel and clients can upload documents
-- (Matter owners and participants with counsel/client role)
create policy "Counsel and clients can upload documents"
on public.documents
for insert
to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (
    exists (
      select 1 from public.matters
      where id = matter_id
      and created_by = (select auth.uid())
    )
    or exists (
      select 1 from public.matter_participants
      where matter_participants.matter_id = documents.matter_id
      and matter_participants.user_id = (select auth.uid())
      and matter_participants.role in ('counsel', 'client')
    )
  )
);

-- RLS Policy: Users with matter access can update document status
-- (needed for processing pipeline)
create policy "Users can update documents they have access to"
on public.documents
for update
to authenticated
using (public.user_can_access_matter(matter_id))
with check (public.user_can_access_matter(matter_id));

-- RLS Policy: Owners and counsel can delete documents
create policy "Owners and counsel can delete documents"
on public.documents
for delete
to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id
    and created_by = (select auth.uid())
  )
  or exists (
    select 1 from public.matter_participants
    where matter_participants.matter_id = documents.matter_id
    and matter_participants.user_id = (select auth.uid())
    and matter_participants.role = 'counsel'
  )
);

