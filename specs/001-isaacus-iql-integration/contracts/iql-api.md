# IQL API Contracts

**Feature**: 001-isaacus-iql-integration  
**Date**: 2024-12-24  
**Base Path**: `/api/iql`

## Authentication

All endpoints require Supabase authentication via cookie-based session. JWT token validated server-side.

**Headers**:

- `Cookie`: Supabase session cookie (automatic via Next.js middleware)

---

## 1. Execute IQL Query

Execute an IQL query against a document.

**Endpoint**: `POST /api/iql/query`

**Request Body**:

```typescript
{
  documentId: string; // UUID of document to query
  query: string; // IQL query string (e.g., "{IS confidentiality clause}")
  model?: "kanon-universal-classifier" | "kanon-universal-classifier-mini"; // Optional, defaults to kanon-universal-classifier
}
```

**Response** (200 OK):

```typescript
{
  query: string;
  documentId: string;
  documentName: string;
  score: number; // Overall confidence score (0-1)
  matches: Array<{
    text: string; // Excerpt of matching text
    startIndex: number; // Character position in document
    endIndex: number; // Character position in document
    score: number; // Confidence score for this match (0-1)
    chunkIndex?: number; // If document was chunked
  }>;
  executedAt: string; // ISO 8601 timestamp
  model: string; // Model used for classification
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request body or IQL syntax

  ```json
  {
    "error": "Invalid IQL query syntax",
    "details": "Expected statement in curly brackets"
  }
  ```

- **404 Not Found**: Document not found or user doesn't have access

  ```json
  {
    "error": "Document not found"
  }
  ```

- **422 Unprocessable Entity**: Document not ready for querying (processing_status != 'ready')

  ```json
  {
    "error": "Document not ready",
    "status": "extracting"
  }
  ```

- **500 Internal Server Error**: Isaacus API error or internal failure
  ```json
  {
    "error": "Failed to execute IQL query",
    "message": "Isaacus API unavailable"
  }
  ```

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/iql/query \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "documentId": "123e4567-e89b-12d3-a456-426614174000",
    "query": "{IS confidentiality clause}",
    "model": "kanon-universal-classifier"
  }'
```

**Example Response**:

```json
{
  "query": "{IS confidentiality clause}",
  "documentId": "123e4567-e89b-12d3-a456-426614174000",
  "documentName": "Service Agreement.pdf",
  "score": 0.85,
  "matches": [
    {
      "text": "The parties agree to maintain the confidentiality of all proprietary information disclosed during the term of this agreement...",
      "startIndex": 1234,
      "endIndex": 1456,
      "score": 0.85
    }
  ],
  "executedAt": "2024-12-24T10:30:00Z",
  "model": "kanon-universal-classifier"
}
```

---

## 2. List IQL Templates

Get list of available IQL templates.

**Endpoint**: `GET /api/iql/templates`

**Query Parameters**: None

**Response** (200 OK):

```typescript
{
  templates: Array<{
    name: string; // Template identifier (e.g., "confidentiality clause")
    displayName: string; // Human-readable name
    description: string; // Template description
    requiresParameter: boolean; // Whether template needs a parameter
    parameterName?: string; // Parameter name if required (e.g., "party name")
    example: string; // Example IQL query
    modelTokens: {
      "kanon-universal-classifier": number;
      "kanon-universal-classifier-mini": number;
    };
    category?: string; // Optional category (e.g., "Clauses", "Parties")
  }>;
}
```

**Error Responses**:

- **500 Internal Server Error**: Failed to load templates
  ```json
  {
    "error": "Failed to load templates"
  }
  ```

**Example Request**:

```bash
curl http://localhost:3000/api/iql/templates \
  -H "Cookie: sb-access-token=..."
```

**Example Response**:

```json
{
  "templates": [
    {
      "name": "confidentiality clause",
      "displayName": "Confidentiality Clause",
      "description": "A contractual provision that restricts the use of confidential information",
      "requiresParameter": false,
      "example": "{IS confidentiality clause}",
      "modelTokens": {
        "kanon-universal-classifier": 26,
        "kanon-universal-classifier-mini": 22
      },
      "category": "Clauses"
    },
    {
      "name": "clause obligating",
      "displayName": "Clause Obligating Party",
      "description": "A contractual provision that imposes a legal duty on a party",
      "requiresParameter": true,
      "parameterName": "party name",
      "example": "{IS clause obligating \"Customer\"}",
      "modelTokens": {
        "kanon-universal-classifier": 31,
        "kanon-universal-classifier-mini": 24
      },
      "category": "Parties"
    }
  ]
}
```

---

## 3. List Saved Queries

Get user's saved IQL queries.

**Endpoint**: `GET /api/iql/saved`

**Query Parameters**:

- `matterId` (optional, string): Filter by matter ID

**Response** (200 OK):

```typescript
{
  queries: Array<{
    id: string; // UUID
    name: string;
    description: string | null;
    queryString: string;
    matterId: string | null;
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  }>;
}
```

**Error Responses**:

- **500 Internal Server Error**: Database error
  ```json
  {
    "error": "Failed to load saved queries"
  }
  ```

**Example Request**:

```bash
curl http://localhost:3000/api/iql/saved?matterId=123e4567-e89b-12d3-a456-426614174000 \
  -H "Cookie: sb-access-token=..."
```

---

## 4. Create Saved Query

Save an IQL query for reuse.

**Endpoint**: `POST /api/iql/saved`

**Request Body**:

```typescript
{
  name: string; // Required, non-empty
  description?: string; // Optional
  queryString: string; // Required, valid IQL syntax
  matterId?: string; // Optional UUID
}
```

**Response** (201 Created):

```typescript
{
  id: string; // UUID
  name: string;
  description: string | null;
  queryString: string;
  matterId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request body

  ```json
  {
    "error": "Name is required"
  }
  ```

- **422 Unprocessable Entity**: Invalid IQL syntax
  ```json
  {
    "error": "Invalid IQL query syntax"
  }
  ```

---

## 5. Update Saved Query

Update an existing saved query.

**Endpoint**: `PATCH /api/iql/saved/:id`

**Path Parameters**:

- `id` (string, UUID): Saved query ID

**Request Body** (all fields optional):

```typescript
{
  name?: string;
  description?: string | null;
  queryString?: string;
  matterId?: string | null;
}
```

**Response** (200 OK):

```typescript
{
  id: string;
  name: string;
  description: string | null;
  queryString: string;
  matterId: string | null;
  createdAt: string;
  updatedAt: string; // Updated timestamp
}
```

**Error Responses**:

- **403 Forbidden**: User doesn't own this query

  ```json
  {
    "error": "Access denied"
  }
  ```

- **404 Not Found**: Query doesn't exist
  ```json
  {
    "error": "Saved query not found"
  }
  ```

---

## 6. Delete Saved Query

Delete a saved query.

**Endpoint**: `DELETE /api/iql/saved/:id`

**Path Parameters**:

- `id` (string, UUID): Saved query ID

**Response** (204 No Content): Empty body

**Error Responses**:

- **403 Forbidden**: User doesn't own this query
- **404 Not Found**: Query doesn't exist

---

## Error Response Format

All error responses follow this structure:

```typescript
{
  error: string; // Human-readable error message
  details?: string; // Optional additional details
  [key: string]: any; // Additional error-specific fields
}
```

---

## Rate Limiting

No explicit rate limiting in MVP. Isaacus API may enforce rate limits (handled via retry logic).

---

## Versioning

No versioning in MVP. All endpoints under `/api/iql` prefix.



