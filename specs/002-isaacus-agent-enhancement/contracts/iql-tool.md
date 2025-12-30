# IQL Tool Contract

**Feature**: 002-isaacus-agent-enhancement  
**Date**: 2024-12-24

## Overview

This document defines the contract for the `isaacus_iql` agent tool that enables IQL-based legal document analysis.

---

## Tool Definition

### Name

`isaacus_iql`

### Description

Execute an IQL (Isaacus Query Language) query against documents in a matter. Use this tool to analyze legal documents using IQL queries for clause identification, obligation analysis, and complex legal criteria matching.

---

## Input Schema

```python
class IsaacusIQLInput(BaseModel):
    """Input schema for the isaacus_iql tool."""

    matter_id: str = Field(
        description="UUID of the matter containing the documents"
    )
    query: str = Field(
        description="IQL query string (e.g., '{IS confidentiality clause}')"
    )
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific document IDs to analyze. "
                    "If not provided, analyzes all documents in the matter."
    )
    model: Optional[str] = Field(
        default="kanon-universal-classifier",
        description="Classification model: kanon-universal-classifier (more accurate) "
                    "or kanon-universal-classifier-mini (faster)"
    )
```

### Parameters

| Parameter      | Type          | Required | Default                      | Description                        |
| -------------- | ------------- | -------- | ---------------------------- | ---------------------------------- |
| `matter_id`    | string (UUID) | Yes      | -                            | Matter containing target documents |
| `query`        | string        | Yes      | -                            | IQL query to execute               |
| `document_ids` | string[]      | No       | null                         | Specific docs to analyze           |
| `model`        | string        | No       | `kanon-universal-classifier` | Isaacus model to use               |

---

## Output Schema

```python
class IsaacusIQLOutput(BaseModel):
    """Output schema for the isaacus_iql tool."""

    query: str = Field(description="The IQL query that was executed")
    document_results: List[dict] = Field(
        description="Results for each document analyzed"
    )
    total_matches: int = Field(
        description="Total number of matches across all documents"
    )
    average_score: float = Field(
        description="Average confidence score across all matches"
    )
```

### Document Result Structure

```python
{
    "document_id": str,       # UUID of the document
    "filename": str,          # Document filename
    "score": float,           # Overall score for this document (0-1)
    "matches": [
        {
            "text": str,          # Matching text excerpt
            "start_index": int,   # Character position start
            "end_index": int,     # Character position end
            "score": float,       # Match confidence (0-1)
        }
    ],
    "match_count": int,       # Number of matches in this document
    "error": Optional[str],   # Error message if processing failed
}
```

---

## IQL Query Syntax

### Basic Templates

| Template      | Example                               | Description                       |
| ------------- | ------------------------------------- | --------------------------------- |
| Simple        | `{IS confidentiality clause}`         | Find confidentiality clauses      |
| Parameterized | `{IS clause obligating "Customer"}`   | Find clauses obligating party     |
| Custom        | `{IS clause that "limits liability"}` | Find clauses matching description |

### Operators

| Operator | Meaning                    | Example       |
| -------- | -------------------------- | ------------- |
| `AND`    | Both conditions must match | `{A} AND {B}` |
| `OR`     | Either condition matches   | `{A} OR {B}`  |
| `NOT`    | Inverts score (1 - score)  | `NOT {A}`     |
| `>`      | A more relevant than B     | `{A} > {B}`   |
| `<`      | A less relevant than B     | `{A} < {B}`   |
| `+`      | Average scores             | `{A} + {B}`   |

### Score Semantics

| Operator | Score Calculation |
| -------- | ----------------- |
| `AND`    | min(A, B)         |
| `OR`     | max(A, B)         |
| `NOT`    | 1 - A             |
| `>`      | (A - B + 1) / 2   |
| `+`      | mean(A, B, ...)   |

---

## Usage Examples

### Example 1: Simple Clause Search

**Input**:

```json
{
  "matter_id": "25e70284-6124-4a2b-9c89-abc123def456",
  "query": "{IS confidentiality clause}"
}
```

**Output**:

```json
{
  "query": "{IS confidentiality clause}",
  "document_results": [
    {
      "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "filename": "Service Agreement.pdf",
      "score": 0.92,
      "matches": [
        {
          "text": "The parties agree to maintain the confidentiality of all proprietary information...",
          "start_index": 1234,
          "end_index": 1456,
          "score": 0.92
        }
      ],
      "match_count": 1
    }
  ],
  "total_matches": 1,
  "average_score": 0.92
}
```

### Example 2: Document-Specific Query

**Input** (with document filter):

```json
{
  "matter_id": "25e70284-6124-4a2b-9c89-abc123def456",
  "query": "{IS termination clause} AND {IS unilateral clause}",
  "document_ids": ["f47ac10b-58cc-4372-a567-0e02b2c3d479"]
}
```

### Example 3: Parameterized Template

**Input**:

```json
{
  "matter_id": "25e70284-6124-4a2b-9c89-abc123def456",
  "query": "{IS clause obligating \"Customer\"}"
}
```

---

## Error Handling

| Error                  | Response                                               |
| ---------------------- | ------------------------------------------------------ |
| Invalid matter_id      | `{"error": "Invalid matter ID format"}`                |
| No documents in matter | `{"error": "No ready documents found in this matter"}` |
| Invalid IQL syntax     | `{"error": "Invalid IQL query syntax: [details]"}`     |
| Isaacus API error      | `{"error": "Isaacus API error: [details]"}`            |
| Document not ready     | Document included in results with `error` field        |

---

## Agent Instructions

### When to Use `isaacus_iql`

Use this tool when users ask to:

- **Find specific clause types**: "Find termination clauses"
- **Search with criteria**: "Find clauses obligating the Customer"
- **Complex analysis**: "Find unilateral clauses that limit liability"
- **Compare relevance**: "Which is more about confidentiality?"

### When NOT to Use (Use Other Tools)

| User Intent                        | Better Tool         |
| ---------------------------------- | ------------------- |
| "What types of clauses are here?"  | `isaacus_classify`  |
| "Search for references to payment" | `isaacus_search`    |
| "What is the notice period?"       | `isaacus_extract`   |
| "Show me the full document"        | `get_document_text` |

### Using Document Context

```text
When [CONTEXT] includes document_id:
  → Use document_ids=[document_id] to target that specific document

When [CONTEXT] has matter_id only:
  → Omit document_ids to search all documents in matter
```

---

## Integration

### Wiring in ISAACUS_TOOLS

**File**: `apps/agent/src/tools/__init__.py`

```python
from .isaacus_iql import (
    isaacus_iql,
    IsaacusIQLInput,
    IsaacusIQLOutput,
    IQLMatch,
)

ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,
    isaacus_search,
    isaacus_extract,
    isaacus_classify,
    isaacus_iql,  # ADD THIS
]

__all__ = [
    # ... existing exports ...
    "isaacus_iql",
    "IsaacusIQLInput",
    "IsaacusIQLOutput",
    "IQLMatch",
]
```



