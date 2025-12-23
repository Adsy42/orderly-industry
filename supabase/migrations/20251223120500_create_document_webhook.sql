-- Migration: Create document processing webhook trigger
-- Purpose: Automatically trigger Edge Function when new documents are inserted
-- Affected tables: public.documents
-- Special considerations: Requires Edge Function to be deployed first

-- Note: This creates a database function and trigger that will send
-- an HTTP request to the Edge Function when a document is inserted.
-- The actual HTTP call is handled by Supabase's pg_net extension.

-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net with schema extensions;

-- Create function to trigger document processing via HTTP
create or replace function public.trigger_document_processing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  edge_function_url text;
  payload jsonb;
begin
  -- Construct the Edge Function URL
  -- This will be the project's Edge Function endpoint
  edge_function_url := current_setting('app.settings.edge_function_url', true);
  
  -- If URL not configured, skip (for local development)
  if edge_function_url is null or edge_function_url = '' then
    return new;
  end if;
  
  -- Construct webhook payload
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'documents',
    'record', jsonb_build_object(
      'id', new.id,
      'matter_id', new.matter_id,
      'storage_path', new.storage_path,
      'filename', new.filename,
      'file_type', new.file_type,
      'processing_status', new.processing_status
    )
  );
  
  -- Send async HTTP request to Edge Function
  -- Note: pg_net handles this asynchronously
  perform net.http_post(
    url := edge_function_url || '/functions/v1/process-document',
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
  
  return new;
end;
$$;

comment on function public.trigger_document_processing is 
  'Sends HTTP request to Edge Function to process newly uploaded documents.';

-- Create trigger to call the function on document insert
-- Only trigger for documents in pending status
create trigger on_document_insert
  after insert on public.documents
  for each row
  when (new.processing_status = 'pending')
  execute function public.trigger_document_processing();

comment on trigger on_document_insert on public.documents is
  'Triggers document processing Edge Function when a new document is inserted.';

