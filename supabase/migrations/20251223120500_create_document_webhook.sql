-- Migration: Create document processing webhook trigger
-- Purpose: Automatically trigger Edge Function when new documents are inserted
-- Affected tables: public.documents
-- Special considerations: Requires Edge Function to be deployed first

-- NOTE: This migration is disabled because pg_net extension setup varies 
-- between Supabase environments. Document processing should be triggered
-- by calling the Edge Function directly from the frontend after upload.

-- The Edge Function can be called manually via:
-- POST https://<project-ref>.supabase.co/functions/v1/process-document

-- For production, consider using Supabase Database Webhooks in the dashboard
-- which handles pg_net configuration automatically.

