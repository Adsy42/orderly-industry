# IQL Translation API Contract

**Feature**: 006-nl-iql-translation  
**Date**: 2025-01-27  
**Base Path**: `/api/iql/translate`

## Authentication

All endpoints require Supabase authentication via cookie-based session. JWT token validated server-side.

**Headers**:

- `Cookie`: Supabase session cookie (automatic via Next.js middleware)
- `Content-Type`: `application/json`

---

## 1. Translate Natural Language to IQL

Translates a natural language clause search description into valid IQL syntax.

**Endpoint**: `POST /api/iql/translate`

**Request Body**:

```typescript
{
  query: string; // Natural language description (e.g., "one-sided confidentiality clauses")
}
```

**Response** (200 OK):

```typescript
{
  iql: string; // Translated IQL query (e.g., "{IS confidentiality clause} AND {IS unilateral clause}")
  explanation?: string; // Optional human-readable explanation of the translation
  templates_used?: string[]; // Optional array of template names used in translation
  confidence?: number; // Optional confidence score (0-1) if provided by translation service
}
```

**Error Responses**:

- **400 Bad Request**: Invalid request body

  ```json
  {
    "error": "Query is required",
    "details": "Request body must include a 'query' field"
  }
  ```

- **401 Unauthorized**: User not authenticated

  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

- **500 Internal Server Error**: Translation service error

  ```json
  {
    "error": "Translation failed",
    "message": "Could not translate query. Please try rephrasing or use IQL syntax directly.",
    "details": "OpenAI API unavailable" // Only in development
  }
  ```

- **504 Gateway Timeout**: Translation service timeout

  ```json
  {
    "error": "Translation timeout",
    "message": "Translation is taking longer than expected. Try again or use IQL syntax directly."
  }
  ```

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/iql/translate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "query": "one-sided confidentiality clauses"
  }'
```

**Example Response**:

```json
{
  "iql": "{IS confidentiality clause} AND {IS unilateral clause}",
  "explanation": "Combines confidentiality clause template with unilateral clause template to find one-sided confidentiality provisions",
  "templates_used": ["confidentiality clause", "unilateral clause"],
  "confidence": 0.95
}
```

---

## Error Response Format

All error responses follow this structure:

```typescript
{
  error: string; // Human-readable error message
  message?: string; // Optional user-friendly message
  details?: string; // Optional additional details (only in development)
  [key: string]: any; // Additional error-specific fields
}
```

---

## Rate Limiting

No explicit rate limiting in MVP. Translation service (OpenAI API) may enforce rate limits. Frontend should handle rate limit errors gracefully.

---

## Versioning

No versioning in MVP. All endpoints under `/api/iql` prefix.

