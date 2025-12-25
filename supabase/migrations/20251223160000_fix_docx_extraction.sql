-- Migration: Fix DOCX extraction
-- Purpose: Re-process DOCX documents with improved extraction
-- Previous extraction was broken, now uses JSZip for proper XML parsing

-- Mark all DOCX documents for reprocessing
-- The new Edge Function will extract text properly using JSZip
update public.documents
set 
  processing_status = 'pending',
  processed_at = null,
  extracted_text = null,
  error_message = 'Reprocessing required: improved DOCX text extraction'
where file_type in ('docx', 'doc')
  and processing_status in ('ready', 'error');

-- Clear embeddings for DOCX documents (they'll be regenerated)
delete from public.document_embeddings
where document_id in (
  select id from public.documents
  where file_type in ('docx', 'doc')
    and processing_status = 'pending'
);

comment on table public.documents is 'Legal documents with improved DOCX/PDF text extraction. DOCX uses JSZip for proper XML parsing, PDF supports OCR fallback.';





