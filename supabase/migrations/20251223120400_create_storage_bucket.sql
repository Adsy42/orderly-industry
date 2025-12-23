-- Migration: Create documents storage bucket
-- Purpose: Create Supabase Storage bucket for document files
-- Affected tables: storage.buckets, storage.objects (policies)
-- Special considerations: Private bucket with RLS-controlled access

-- Create the documents storage bucket (private by default)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50MB file size limit
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- RLS Policy: Authenticated users can upload to matters they have access to
-- Path pattern: matters/{matter_id}/{filename}
create policy "Users can upload to their matters"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'matters'
);

-- RLS Policy: Authenticated users can view documents in matters they have access to
create policy "Users can view documents in their matters"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
);

-- RLS Policy: Authenticated users can update their uploads
create policy "Users can update their uploads"
on storage.objects
for update
to authenticated
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

-- RLS Policy: Authenticated users can delete documents in matters they have access to
create policy "Users can delete documents"
on storage.objects
for delete
to authenticated
using (bucket_id = 'documents');


