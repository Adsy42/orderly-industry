# API Contract: Document Processing & Search

**Feature**: 005-document-ingestion-grounding
**Date**: 2024-12-25

## Overview

Next.js API routes for document processing, structure retrieval, and hybrid search.

---

## POST /api/documents/process

Triggers document processing for an uploaded file.

### Request

```typescript
// Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json

// Body
{
  "document_id": string  // UUID of uploaded document
}
```

### Response

```typescript
// 202 Accepted - Processing started
{
  "success": true,
  "document_id": string,
  "status": "extracting",
  "message": "Document processing started"
}

// 400 Bad Request - Invalid input
{
  "success": false,
  "error": "Invalid document_id"
}

// 404 Not Found - Document not found or no access
{
  "success": false,
  "error": "Document not found"
}

// 409 Conflict - Already processing
{
  "success": false,
  "error": "Document is already being processed",
  "status": "extracting" | "structuring" | "embedding"
}
```

### Processing Flow

1. Validate document exists and user has access
2. Update status to `extracting`
3. Call Python agent `extract_document_structure` tool
4. Store sections and chunks in database
5. Generate embeddings via Isaacus
6. Update status to `ready`

### Error Handling

- On extraction error → status = `error`, message stored
- On embedding error → status = `error`, partial structure preserved
- Retry logic: 3 attempts with exponential backoff

---

## GET /api/documents/[id]/structure

Retrieves the hierarchical section tree for a document.

### Request

```typescript
// Headers
Authorization: Bearer<jwt_token>;

// Path parameters
id: string; // Document UUID
```

### Response

```typescript
// 200 OK
{
  "document_id": string,
  "filename": string,
  "structure_extracted": boolean,
  "sections": [
    {
      "id": string,
      "section_number": string | null,
      "title": string | null,
      "level": number,
      "path": string[],
      "start_page": number | null,
      "end_page": number | null,
      "children": [
        // Nested sections (recursive)
      ]
    }
  ]
}

// 404 Not Found
{
  "error": "Document not found"
}

// 503 Service Unavailable - Not yet processed
{
  "error": "Document structure not yet extracted",
  "status": "pending" | "extracting" | "structuring"
}
```

---

## POST /api/documents/search

Hybrid semantic + keyword search across matter documents.

### Request

```typescript
// Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json

// Body
{
  "matter_id": string,           // UUID of matter to search
  "query": string,               // Search query
  "options": {
    "semantic_weight": number,   // 0-1, default 0.7
    "match_count": number,       // Max results, default 20
    "match_threshold": number,   // Min score, default 0.5
    "include_context": boolean,  // Include parent section, default true
    "document_id": string        // Optional: limit to single document
  }
}
```

### Response

```typescript
// 200 OK
{
  "query": string,
  "matter_id": string,
  "results": [
    {
      "id": string,              // Chunk UUID
      "document_id": string,
      "filename": string,
      "content": string,         // Matched chunk text
      "score": number,           // Combined relevance score
      "citation": {
        "page": number,
        "section_path": string[],
        "paragraph_index": number | null,
        "formatted": string      // "Contract.pdf, p.12, § 7.2"
      },
      "parent_content": string | null,  // Section context
      "highlight": {
        "start": number,         // Highlight start in content
        "end": number            // Highlight end in content
      }
    }
  ],
  "total_count": number,
  "search_type": "hybrid" | "semantic" | "keyword"
}

// 400 Bad Request
{
  "error": "Invalid query or matter_id"
}

// 404 Not Found
{
  "error": "Matter not found or no access"
}
```

---

## GET /api/documents/[id]/sections/[sectionId]

Retrieves a section with its content and sibling context.

### Request

```typescript
// Headers
Authorization: Bearer<jwt_token>;

// Path parameters
id: string; // Document UUID
sectionId: string; // Section UUID
```

### Response

```typescript
// 200 OK
{
  "section": {
    "id": string,
    "section_number": string | null,
    "title": string | null,
    "level": number,
    "path": string[],
    "start_page": number,
    "end_page": number
  },
  "content": string,           // Section content (from section-level chunk)
  "chunks": [                  // Paragraph-level chunks in this section
    {
      "id": string,
      "content": string,
      "citation": Citation,
      "chunk_index": number
    }
  ],
  "siblings": {
    "previous": {
      "id": string,
      "title": string
    } | null,
    "next": {
      "id": string,
      "title": string
    } | null
  },
  "parent": {
    "id": string,
    "title": string,
    "path": string[]
  } | null
}

// 404 Not Found
{
  "error": "Section not found"
}
```

---

## GET /api/documents/[id]/chunks/[chunkId]

Retrieves a specific chunk with context for citation verification.

### Request

```typescript
// Headers
Authorization: Bearer<jwt_token>;

// Path parameters
id: string; // Document UUID
chunkId: string; // Chunk UUID
```

### Response

```typescript
// 200 OK
{
  "chunk": {
    "id": string,
    "content": string,
    "citation": Citation,
    "content_hash": string
  },
  "verified": boolean,        // Hash matches stored content
  "document": {
    "id": string,
    "filename": string,
    "storage_path": string    // For direct file access
  },
  "context": {
    "parent_content": string | null,
    "siblings": [
      {
        "id": string,
        "content": string,
        "chunk_index": number
      }
    ]
  }
}
```

---

## Common Types

### Citation

```typescript
interface Citation {
  page: number;
  section_path: string[];
  paragraph_index: number | null;
  heading: string | null;
  context_before: string | null;
  context_after: string | null;
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
```

---

## Authentication

All endpoints require:

1. Valid JWT token in Authorization header
2. User must have access to the matter (owner or participant)
3. RLS policies enforce access control at database level

---

## Rate Limits

| Endpoint      | Limit                        |
| ------------- | ---------------------------- |
| POST /process | 10 requests/minute per user  |
| POST /search  | 60 requests/minute per user  |
| GET endpoints | 120 requests/minute per user |

---

## Caching

| Endpoint           | Cache Strategy                                |
| ------------------ | --------------------------------------------- |
| GET /structure     | Cache for 1 hour, invalidate on re-processing |
| GET /sections/[id] | Cache for 1 hour                              |
| POST /search       | No cache (dynamic)                            |
| GET /chunks/[id]   | Cache for 24 hours (immutable content)        |
