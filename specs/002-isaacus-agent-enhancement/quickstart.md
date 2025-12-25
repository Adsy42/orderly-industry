# Quickstart: Isaacus Agent Enhancement

**Feature**: 002-isaacus-agent-enhancement  
**Date**: 2024-12-24

## Overview

This guide covers the implementation steps to enhance the Isaacus integration with:

1. Wiring up the IQL tool to the agent
2. Adding document context to chat messages
3. Updating agent instructions for tool selection

## Prerequisites

- Existing `isaacus_iql.py` tool (already implemented)
- Existing `iql-templates.ts` templates (already implemented)
- Access to Isaacus API (ISAACUS_API_KEY configured)
- Supabase project with documents table

---

## Step 1: Wire Up IQL Tool (5 minutes)

### Modify `apps/agent/src/tools/__init__.py`

**Add import**:

```python
from .isaacus_iql import (
    isaacus_iql,
    IsaacusIQLInput,
    IsaacusIQLOutput,
    IQLMatch,
    ISAACUS_IQL_TOOL,
)
```

**Add to ISAACUS_TOOLS**:

```python
ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,
    isaacus_search,
    isaacus_extract,
    isaacus_classify,
    isaacus_iql,  # <-- ADD THIS LINE
]
```

**Add to **all****:

```python
__all__ = [
    # ... existing exports ...
    "isaacus_iql",
    "IsaacusIQLInput",
    "IsaacusIQLOutput",
    "IQLMatch",
    "ISAACUS_IQL_TOOL",
]
```

---

## Step 2: Update Document Agent Instructions (30 minutes)

### Modify `apps/agent/src/agents/document_agent.py`

Add IQL tool to the tool selection table in `DOCUMENT_AGENT_INSTRUCTIONS`:

```python
DOCUMENT_AGENT_INSTRUCTIONS = """You are a Document Analyst...

## Tool Selection Strategy (CRITICAL)

| Query Type | Tool | When to Use |
|------------|------|-------------|
| List/inventory | `list_matter_documents` | "What documents are in this matter?" |
| Read entire doc | `get_document_text` | "Analyze this document", "Summarize" |
| Find content | `isaacus_search` | "Find references to indemnity" |
| Answer question | `isaacus_extract` | "What is the notice period?" |
| Categorize clauses | `isaacus_classify` | "What types of clauses are here?" |
| **Find specific clauses** | `isaacus_iql` | "Find termination clauses" |
| **Complex clause analysis** | `isaacus_iql` | "Find unilateral clauses obligating X" |

## IQL Tool Usage (isaacus_iql)

Use this tool for sophisticated legal document analysis with IQL queries:

**IQL Templates:**
- `{IS confidentiality clause}` - Find confidentiality clauses
- `{IS termination clause}` - Find termination clauses
- `{IS clause obligating "Customer"}` - Find clauses obligating a party
- `{IS clause that "limits liability"}` - Find clauses matching description

**IQL Operators:**
- `AND` - Both conditions: `{IS termination clause} AND {IS unilateral clause}`
- `OR` - Either condition: `{IS confidentiality clause} OR {IS non-compete clause}`
- `NOT` - Exclude: `NOT {IS boilerplate clause}`

**Score Interpretation (IMPORTANT):**
- IQL scores are PROBABILITIES: 0.92 = 92% confidence this is a match
- >0.7 = High confidence (show as definite match)
- 0.5-0.7 = Medium confidence (show as possible match)
- <0.5 = Low confidence (likely not a match)

## Context Awareness

The [CONTEXT] message may include:
- `matter_id`: Always present - the current matter
- `document_id`: Sometimes present - if user is viewing a specific document

**When document_id IS provided:**
- User is looking at a specific document
- Use `document_ids=[document_id]` when calling `isaacus_iql`
- Example: User viewing "Contract.pdf" asks "Find termination clauses"
  → Call isaacus_iql with document_ids filter

**When only matter_id is provided:**
- User is asking about the matter in general
- Omit document_ids to search ALL documents
- Example: User on matter overview asks "Find all confidentiality clauses"
  → Call isaacus_iql without document_ids filter
"""
```

---

## Step 3: Add Document Context to Frontend (1 hour)

### Modify `apps/frontend/src/providers/Thread.tsx`

Find the context message generation and enhance it:

**Before**:

```typescript
const contextMessage = `[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).`;
```

**After**:

```typescript
// Build context message with optional document info
const buildContextMessage = () => {
  let context = `[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).`;

  if (documentId && documentName) {
    context += `\nThe user is currently viewing document "${documentName}" (document_id: ${documentId}).`;
  }

  return context;
};

const contextMessage = buildContextMessage();
```

### Pass Document Info from Document Page

**Modify**: `apps/frontend/src/app/protected/matters/[matterId]/documents/[documentId]/page.tsx`

Ensure the document page passes document context to the thread provider:

```typescript
// In document viewer page component
const { documentId } = useParams();
const { data: document } = useDocument(documentId);

return (
  <ThreadProvider
    matterId={matterId}
    matterName={matter?.title}
    documentId={documentId}
    documentName={document?.filename}
  >
    {/* Document viewer content */}
  </ThreadProvider>
);
```

---

## Step 4: Test the Integration

### Test 1: IQL Tool Wiring

1. Start the agent locally: `cd apps/agent && langgraph dev`
2. In chat, ask: "Find all confidentiality clauses"
3. **Expected**: Agent uses `isaacus_iql` tool with query `{IS confidentiality clause}`

### Test 2: Document Context

1. Open a specific document in the viewer
2. Ask: "Find the termination clause"
3. **Expected**: Agent uses `isaacus_iql` with `document_ids=[current_doc_id]`

### Test 3: Matter-Wide Query

1. Go to matter overview (no specific document open)
2. Ask: "Find all indemnity clauses in this matter"
3. **Expected**: Agent uses `isaacus_iql` without document_ids (searches all)

### Test 4: Tool Selection

| Query                             | Expected Tool      |
| --------------------------------- | ------------------ |
| "Find termination clauses"        | `isaacus_iql`      |
| "What types of clauses are here?" | `isaacus_classify` |
| "Search for payment references"   | `isaacus_search`   |
| "What is the notice period?"      | `isaacus_extract`  |

---

## Verification Checklist

- [ ] `isaacus_iql` appears in agent tool list
- [ ] Agent selects IQL tool for clause-finding queries
- [ ] Document context appears in [CONTEXT] message when viewing doc
- [ ] Agent filters by document_id when context is provided
- [ ] Agent searches all docs when no document context
- [ ] IQL results show confidence scores
- [ ] High/medium/low confidence visually distinguished

---

## Troubleshooting

### IQL Tool Not Available

```
Error: Tool 'isaacus_iql' not found
```

**Fix**: Ensure import was added to `__init__.py` and tool is in `ISAACUS_TOOLS` list.

### Document Context Not Passed

```
Agent: "Which document are you asking about?"
```

**Fix**: Check that `documentId` and `documentName` are being passed to ThreadProvider.

### Agent Not Using IQL for Clause Queries

**Fix**: Update document agent instructions with clearer tool selection guidance.

---

## Next Steps

After basic integration is complete:

1. **Template-First UI**: Surface templates prominently in document viewer
2. **Confidence Indicators**: Add color coding for score ranges
3. **Saved Queries**: Enable saving successful IQL queries for reuse

