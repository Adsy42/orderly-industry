-- Add PDF storage columns to documents table for converted DOCX files
-- This enables caching of PDF conversions for the document viewer

ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Add index for quick lookup of documents with PDFs
CREATE INDEX IF NOT EXISTS idx_documents_pdf_storage_path
ON public.documents(pdf_storage_path)
WHERE pdf_storage_path IS NOT NULL;

COMMENT ON COLUMN public.documents.pdf_storage_path IS 'Path to converted PDF in Supabase Storage (for DOCX files)';
COMMENT ON COLUMN public.documents.pdf_generated_at IS 'Timestamp when PDF was generated from source document';
