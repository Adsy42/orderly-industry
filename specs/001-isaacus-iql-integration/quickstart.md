# Quickstart: Isaacus IQL Integration

**Feature**: 001-isaacus-iql-integration  
**Date**: 2024-12-24

## Overview

This feature enables users to analyze legal documents using Isaacus IQL (Isaacus Query Language). Users can execute IQL queries against uploaded documents to identify specific clauses, obligations, and rights.

## Prerequisites

- Document uploaded and processed (status = 'ready')
- Isaacus API key configured (`ISAACUS_API_KEY` environment variable)
- User authenticated (Supabase Auth)

## User Flow

### 1. Access IQL Query Interface

Navigate to a document's IQL analysis page:

```
/protected/matters/[matterId]/documents/[documentId]/iql
```

### 2. Execute a Simple Query

**Option A: Use a Template**

1. Click "Select Template" button
2. Choose a template (e.g., "Confidentiality Clause")
3. Click "Run Query"
4. View results with confidence scores

**Option B: Write Custom Query**

1. Enter IQL query in text input: `{IS confidentiality clause}`
2. Click "Execute Query"
3. View results

### 3. View Results

Results display:

- Overall confidence score (0-1)
- Matching text excerpts
- Character positions in document
- Click excerpt to navigate to document section

### 4. Save Query (Optional)

1. After executing query, click "Save Query"
2. Enter name and optional description
3. Query saved for future reuse

### 5. Use Saved Query

1. Click "Saved Queries" button
2. Select a saved query
3. Click "Apply to Document"
4. Results displayed

## IQL Query Examples

### Simple Template Query

```
{IS confidentiality clause}
```

### Parameterized Template

```
{IS clause obligating "Customer"}
```

### Complex Query with AND

```
{IS confidentiality clause} AND {IS unilateral clause}
```

### Complex Query with OR

```
{IS confidentiality clause} OR {IS non-compete clause}
```

### Comparison Query

```
{IS clause obligating "Customer"} > {IS clause obligating "Supplier"}
```

## API Usage

### Execute Query (cURL)

```bash
curl -X POST http://localhost:3000/api/iql/query \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "documentId": "123e4567-e89b-12d3-a456-426614174000",
    "query": "{IS confidentiality clause}"
  }'
```

### List Templates

```bash
curl http://localhost:3000/api/iql/templates \
  -H "Cookie: sb-access-token=..."
```

### Save Query

```bash
curl -X POST http://localhost:3000/api/iql/saved \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "name": "Find Confidentiality Clauses",
    "queryString": "{IS confidentiality clause}"
  }'
```

## Developer Setup

### 1. Environment Variables

Ensure Isaacus API key is configured:

```bash
# Frontend (.env.local)
ISAACUS_API_KEY=your_api_key_here
ISAACUS_BASE_URL=https://api.isaacus.com
```

### 2. Database Migration

Run migration to create `saved_iql_queries` table:

```bash
supabase migration up
```

### 3. Frontend Components

Key components:

- `IQLQueryBuilder`: Query input and execution
- `IQLTemplateSelector`: Template picker
- `IQLResults`: Results display
- `SavedQueries`: Saved queries list

### 4. API Routes

API routes in `apps/frontend/src/app/api/iql/`:

- `query/route.ts`: Execute IQL query
- `templates/route.ts`: List templates
- `saved/route.ts`: CRUD for saved queries

### 5. Agent Tool (Optional)

IQL query tool for agent:

```python
from apps.agent.src.tools.isaacus_iql import isaacus_iql_query

# In agent graph
result = await isaacus_iql_query(
    matter_id="...",
    document_id="...",
    query="{IS confidentiality clause}"
)
```

## Testing

### Manual Testing

1. Upload a test document (PDF/DOCX)
2. Wait for processing to complete
3. Navigate to IQL query page
4. Execute template query
5. Verify results display correctly
6. Save query and verify persistence

### API Testing

Use provided cURL examples or Postman collection.

## Troubleshooting

### "Document not ready" Error

- Check document `processing_status` in database
- Wait for text extraction to complete

### "Invalid IQL query syntax" Error

- Verify query format: `{IS template name}` or `{IS template "parameter"}`
- Check operator syntax (AND, OR, NOT)
- Review IQL specification for valid syntax

### "Isaacus API unavailable" Error

- Verify `ISAACUS_API_KEY` is set
- Check Isaacus API status
- Review API error logs

### No Results Returned

- Verify document has text content
- Try simpler query
- Check confidence score threshold (default: 0.5)

## Next Steps

After basic IQL queries work:

1. Add query history tracking
2. Implement "apply to all documents in matter"
3. Add query result export (CSV/JSON)
4. Create query templates UI for power users

