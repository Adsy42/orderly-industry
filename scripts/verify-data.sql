-- Quick verification queries for document ingestion

-- 1. Check document status
SELECT 
  filename,
  processing_status,
  structure_extracted,
  extraction_quality,
  processed_at
FROM documents 
WHERE matter_id = '25e70284-6124-4ad5-925c-cf75aca8501b'
ORDER BY uploaded_at DESC;

-- 2. Check chunk counts
SELECT 
  d.filename,
  COUNT(dc.id) as chunk_count,
  AVG(LENGTH(dc.content)) as avg_chunk_size,
  MIN(dc.chunk_index) as first_idx,
  MAX(dc.chunk_index) as last_idx
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
WHERE d.matter_id = '25e70284-6124-4ad5-925c-cf75aca8501b'
GROUP BY d.id, d.filename;

-- 3. Sample chunk with citation
SELECT 
  chunk_index,
  chunk_level,
  LEFT(content, 100) as content_preview,
  citation,
  embedding_model
FROM document_chunks 
WHERE document_id = '3f8d8698-a421-488a-a697-a6e7553283a7'
ORDER BY chunk_index
LIMIT 3;

-- 4. Check if sections table exists and has data
SELECT COUNT(*) as section_count 
FROM document_sections 
WHERE document_id = '3f8d8698-a421-488a-a697-a6e7553283a7';

-- 5. Verify RLS policies
SELECT 
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('document_chunks', 'document_sections')
ORDER BY tablename, cmd;




