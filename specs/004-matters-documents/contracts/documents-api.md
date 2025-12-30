# API Contract: Documents

**Feature Branch**: `004-matters-documents`  
**Date**: 2025-12-23  
**Base Path**: Supabase Auto-generated REST API (`/rest/v1/documents`)

## Overview

Documents are managed via Supabase REST API for metadata and Supabase Storage for file content. The upload flow uses the Supabase UI Dropzone component which handles Storage uploads directly.

## Document Upload Flow

```
┌──────────┐      ┌──────────────┐      ┌─────────────────┐      ┌─────────────┐
│  Client  │      │   Supabase   │      │    Supabase     │      │    Edge     │
│ (Browser)│      │   Storage    │      │    Database     │      │  Function   │
└────┬─────┘      └──────┬───────┘      └────────┬────────┘      └──────┬──────┘
     │                   │                       │                      │
     │ 1. Upload file    │                       │                      │
     │──────────────────>│                       │                      │
     │                   │                       │                      │
     │ 2. File stored    │                       │                      │
     │<──────────────────│                       │                      │
     │                   │                       │                      │
     │ 3. Create document record                 │                      │
     │──────────────────────────────────────────>│                      │
     │                   │                       │                      │
     │                   │    4. Trigger event   │                      │
     │                   │──────────────────────────────────────────────>│
     │                   │                       │                      │
     │                   │                       │   5. Extract text    │
     │                   │                       │<─────────────────────│
     │                   │                       │                      │
     │                   │                       │   6. Generate embed  │
     │                   │                       │      (Isaacus API)   │
     │                   │                       │<─────────────────────│
     │                   │                       │                      │
     │                   │    7. Update status   │                      │
     │                   │<──────────────────────│                      │
     │                   │                       │                      │
```

## Storage Endpoints

### Upload Document

Uses Supabase Storage API directly via `useSupabaseUpload` hook.

**Bucket**: `documents`  
**Path Pattern**: `matters/{matter_id}/{filename}`

**TypeScript Usage**:

```typescript
// Using Supabase UI Dropzone hook
const uploadProps = useSupabaseUpload({
  bucketName: "documents",
  path: `matters/${matterId}`,
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  maxFiles: 10,
  maxFileSize: 50 * 1000 * 1000, // 50MB
});

// After upload, create document record
const createDocumentRecord = async (file: UploadedFile) => {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      matter_id: matterId,
      storage_path: `matters/${matterId}/${file.name}`,
      filename: file.name,
      file_type: getFileExtension(file.name),
      file_size: file.size,
      mime_type: file.type,
      processing_status: "pending",
    })
    .select()
    .single();

  return { data, error };
};
```

### Download Document

```typescript
const { data, error } = await supabase.storage
  .from("documents")
  .download(document.storage_path);

// Or get signed URL for preview
const { data: urlData } = await supabase.storage
  .from("documents")
  .createSignedUrl(document.storage_path, 3600); // 1 hour expiry
```

---

## Database Endpoints

### List Documents in Matter

**Request**:

```
GET /rest/v1/documents?matter_id=eq.{matterId}&select=*&order=uploaded_at.desc
```

**Response** (200 OK):

```json
[
  {
    "id": "uuid",
    "matter_id": "uuid",
    "storage_path": "matters/uuid/contract.pdf",
    "filename": "contract.pdf",
    "file_type": "pdf",
    "file_size": 1048576,
    "mime_type": "application/pdf",
    "processing_status": "ready",
    "error_message": null,
    "uploaded_by": "uuid",
    "uploaded_at": "2025-12-23T10:00:00Z",
    "processed_at": "2025-12-23T10:01:00Z"
  }
]
```

**TypeScript Usage**:

```typescript
const { data, error } = await supabase
  .from("documents")
  .select("*")
  .eq("matter_id", matterId)
  .order("uploaded_at", { ascending: false });
```

---

### Get Document with Extracted Text

```typescript
const { data, error } = await supabase
  .from("documents")
  .select("*, extracted_text")
  .eq("id", documentId)
  .single();
```

---

### Delete Document

```typescript
// 1. Delete storage file
const { error: storageError } = await supabase.storage
  .from("documents")
  .remove([document.storage_path]);

// 2. Delete database record (cascades to embeddings)
const { error: dbError } = await supabase
  .from("documents")
  .delete()
  .eq("id", documentId);
```

---

### Search Documents (Full-Text)

```typescript
const { data, error } = await supabase
  .from("documents")
  .select("*")
  .eq("matter_id", matterId)
  .textSearch("extracted_text", searchQuery, {
    type: "websearch",
    config: "english",
  });
```

---

### Search Documents (Semantic via RPC)

```typescript
// First, get query embedding from Isaacus (via API route)
const embeddingResponse = await fetch("/api/embed", {
  method: "POST",
  body: JSON.stringify({ text: searchQuery }),
});
const { embedding } = await embeddingResponse.json();

// Then search using RPC
const { data, error } = await supabase.rpc("match_document_embeddings", {
  query_embedding: embedding,
  matter_uuid: matterId,
  match_threshold: 0.7,
  match_count: 10,
});
```

**Response**:

```json
[
  {
    "id": "uuid",
    "document_id": "uuid",
    "chunk_text": "The limitation period shall be...",
    "similarity": 0.89
  }
]
```

---

## Edge Function: Document Processor

**Path**: `/functions/v1/process-document`  
**Trigger**: Database webhook on `documents` INSERT

### Request (Webhook Payload)

```json
{
  "type": "INSERT",
  "table": "documents",
  "record": {
    "id": "uuid",
    "storage_path": "matters/uuid/contract.pdf",
    "file_type": "pdf",
    "processing_status": "pending"
  }
}
```

### Processing Steps

1. **Update status**: `extracting`
2. **Download file** from Storage
3. **Extract text** using pypdf/python-docx
4. **Update status**: `embedding`
5. **Chunk text** into ~500 token segments
6. **Generate embeddings** via Isaacus API
7. **Store embeddings** in `document_embeddings`
8. **Update document**: status = `ready`, extracted_text, processed_at

### Error Handling

If any step fails:

- Set `processing_status` = `error`
- Set `error_message` with details
- Log to observability

---

## TypeScript Types

```typescript
interface Document {
  id: string;
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: "pdf" | "docx" | "txt";
  file_size: number;
  mime_type: string | null;
  extracted_text: string | null;
  processing_status: "pending" | "extracting" | "embedding" | "ready" | "error";
  error_message: string | null;
  uploaded_by: string;
  uploaded_at: string;
  processed_at: string | null;
}

interface DocumentEmbedding {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[];
  created_at: string;
}

interface SemanticSearchResult {
  id: string;
  document_id: string;
  chunk_text: string;
  similarity: number;
}

interface CreateDocumentInput {
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
}
```

---

## Error Responses

| Status | Code       | Description                 |
| ------ | ---------- | --------------------------- |
| 400    | `PGRST102` | Invalid request body        |
| 401    | `PGRST301` | Missing or invalid JWT      |
| 403    | `PGRST301` | No access to matter         |
| 404    | `PGRST116` | Document not found          |
| 413    | -          | File too large (50MB limit) |
| 415    | -          | Unsupported file type       |



