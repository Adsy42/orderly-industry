# Agent Context Contract

**Feature**: 002-isaacus-agent-enhancement  
**Date**: 2024-12-24

## Overview

This document defines the contract for passing document context from the frontend to the agent through chat messages.

---

## Context Message Format

### Structure

Context is passed as a special message at the start of conversations or when context changes.

**Format**:

```text
[CONTEXT] The user has selected matter "{matter_name}" (matter_id: {matter_id}).
{optional_document_line}
```

**Document Line** (when viewing specific document):

```text
The user is currently viewing document "{document_name}" (document_id: {document_id}).
```

---

## Examples

### Matter-Level Context (No Specific Document)

When user is on matter overview or document list:

```text
[CONTEXT] The user has selected matter "Smith v. Jones" (matter_id: 25e70284-6124-4a2b-9c89-abc123def456).
```

### Document-Level Context (Viewing Specific Document)

When user is viewing a specific document:

```text
[CONTEXT] The user has selected matter "Smith v. Jones" (matter_id: 25e70284-6124-4a2b-9c89-abc123def456).
The user is currently viewing document "Service Agreement.pdf" (document_id: f47ac10b-58cc-4372-a567-0e02b2c3d479).
```

---

## Frontend Implementation

### Thread Provider Update

**File**: `apps/frontend/src/providers/Thread.tsx`

**Current Implementation** (matter context only):

```typescript
const contextMessage = `[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).`;
```

**Updated Implementation** (with document context):

```typescript
const contextMessage = documentId
  ? `[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).
The user is currently viewing document "${documentName}" (document_id: ${documentId}).`
  : `[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).`;
```

### Context Data Source

| Field          | Source                         | When Available          |
| -------------- | ------------------------------ | ----------------------- |
| `matterId`     | URL param `[matterId]`         | Always (required)       |
| `matterName`   | Fetched from `matters` table   | Always                  |
| `documentId`   | URL param `[documentId]`       | On document viewer page |
| `documentName` | Fetched from `documents` table | On document viewer page |

---

## Agent Implementation

### Parsing Context

**File**: `apps/agent/src/agents/document_agent.py`

**Pattern to Extract IDs**:

```python
import re

def parse_context(message: str) -> dict:
    """Extract matter_id and optional document_id from context message."""
    context = {"matter_id": None, "document_id": None}

    # Extract matter_id
    matter_match = re.search(r'matter_id:\s*([a-f0-9-]+)', message, re.IGNORECASE)
    if matter_match:
        context["matter_id"] = matter_match.group(1)

    # Extract document_id (optional)
    doc_match = re.search(r'document_id:\s*([a-f0-9-]+)', message, re.IGNORECASE)
    if doc_match:
        context["document_id"] = doc_match.group(1)

    return context
```

### Tool Selection Based on Context

**Agent Instructions Update**:

```text
## Context Awareness

The [CONTEXT] message may include:
- `matter_id`: Always present - the current matter scope
- `document_id`: Sometimes present - when user is viewing a specific document

**When document_id IS provided:**
- User is looking at a specific document
- Prefer tools that can target that document specifically:
  - `isaacus_iql` with `document_ids=[document_id]`
  - `get_document_text` with that document_id
  - `isaacus_extract` targeting that document

**When document_id is NOT provided:**
- User is asking about the matter in general
- Search/query across ALL documents in the matter:
  - `isaacus_iql` with `matter_id` only (all docs)
  - `isaacus_search` across matter embeddings
```

---

## Context Lifecycle

| User Action                    | Context State             | Agent Behavior            |
| ------------------------------ | ------------------------- | ------------------------- |
| Opens matter overview          | matter_id only            | Queries all documents     |
| Opens document viewer          | matter_id + document_id   | Targets specific document |
| Switches to different document | Updated document_id       | Targets new document      |
| Returns to matter overview     | matter_id only            | Queries all documents     |
| New chat message (same page)   | Previous context persists | Uses last known context   |

---

## Validation

### Required Fields

- `matter_id` must always be present
- `matter_id` must be a valid UUID format

### Optional Fields

- `document_id` may be absent
- When present, must be a valid UUID format
- `document_name` is for display only, agent should use `document_id`

---

## Error Handling

| Scenario                                      | Agent Response                                  |
| --------------------------------------------- | ----------------------------------------------- |
| No `[CONTEXT]` message found                  | Ask user which matter they're working with      |
| `matter_id` invalid or inaccessible           | Inform user matter not found                    |
| `document_id` provided but document not ready | Inform user document still processing           |
| `document_id` doesn't exist in matter         | List available documents, ask for clarification |





