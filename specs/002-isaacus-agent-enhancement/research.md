# Research: Isaacus Agent Enhancement

**Feature**: 002-isaacus-agent-enhancement  
**Date**: 2024-12-24

## Overview

This document captures research findings for implementing the Isaacus agent enhancement feature. All "NEEDS CLARIFICATION" items from the technical context have been resolved.

---

## 1. Isaacus Score Interpretation

**Decision**: IQL/Universal Classifier scores are calibrated probabilities; Embedder scores are relative (ranking only).

**Rationale**:

- Isaacus documentation states: "Isaacus' universal classifiers' scores have been calibrated to be interpreted as probabilities"
- Embedder scores "have not been calibrated to be interpreted as probabilities, only as relative measures of similarity"
- This means IQL results can use thresholds (>0.5 = match, >0.7 = high confidence) while search results should only be ranked, not thresholded

**Implications**:

- IQL results: Show percentage confidence, use color coding (green >70%, yellow 50-70%, red <50%)
- Search results: Show as ranked list without percentage, use ordinal indicators (1st, 2nd, 3rd)

**Alternatives Considered**:

- Treating both as probabilities - REJECTED: Would mislead users about search result meaning

---

## 2. IQL Tool vs Classify Tool Selection

**Decision**: Agent uses heuristics to choose between `isaacus_iql` (powerful, IQL syntax) and `isaacus_classify` (simple, label-based).

**Rationale**:

- `isaacus_classify`: Best for "What types of clauses are in this document?" - categorizes with predefined labels
- `isaacus_iql`: Best for "Find clauses that obligate the Customer" - complex queries with parameters/operators
- Selection based on query complexity and specificity

**Heuristics for Agent**:
| User Intent | Tool | Example Query |
|-------------|------|---------------|
| Categorize clauses | `isaacus_classify` | "What clauses are here?" |
| Find specific clause type | `isaacus_iql` | "Find termination clauses" |
| Complex criteria | `isaacus_iql` | "Find unilateral clauses obligating X" |
| Compare clause relevance | `isaacus_iql` | "Which is more about confidentiality?" |
| Search for content | `isaacus_search` | "Find references to payment terms" |
| Answer specific question | `isaacus_extract` | "What is the notice period?" |

**Alternatives Considered**:

- Always use IQL - REJECTED: Overkill for simple categorization
- Let user choose - REJECTED: Adds friction, violates "90% can use without training" goal

---

## 3. Document Context Passing

**Decision**: Pass `document_id` in chat context message when user is viewing a specific document; omit when on matter overview.

**Rationale**:

- Existing `[CONTEXT]` message format already passes `matter_id`
- Extending to include `document_id` is minimal change
- Real-time updates when navigating between documents

**Implementation Pattern**:

```typescript
// When viewing specific document:
`[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}). 
The user is currently viewing document "${documentName}" (document_id: ${documentId}).`
// When on matter overview (no specific document):
`[CONTEXT] The user has selected matter "${matterName}" (matter_id: ${matterId}).`;
```

**Alternatives Considered**:

- Separate metadata field - REJECTED: Requires agent changes to parse
- Query parameter - REJECTED: Lost on page refresh, not agent-accessible

---

## 4. Template-First UI Approach

**Decision**: Prioritize template picker in UI; hide advanced query builder behind "Advanced" toggle.

**Rationale**:

- Spec requires "90% of users can successfully analyze a document using templates without any training"
- Templates already exist in `iql-templates.ts` (15+ templates)
- Advanced IQL syntax is power-user territory

**UI Layout**:

```
┌─────────────────────────────────────────┐
│ Quick Analysis Templates (visible)      │
│ [Confidentiality] [Termination] [...]   │
├─────────────────────────────────────────┤
│ [⚙️ Advanced Query Builder] (collapsed) │
└─────────────────────────────────────────┘
```

**Alternatives Considered**:

- Full query builder visible - REJECTED: Overwhelms non-technical users
- Templates only, no advanced - REJECTED: Power users need full capability

---

## 5. LangChain Isaacus Integration

**Decision**: Keep custom `IsaacusClient` for IQL/classify/extract; optionally add `langchain-isaacus` for embeddings only.

**Rationale**:

- `langchain-isaacus` package only provides `IsaacusEmbeddings` - LangChain-compatible embeddings
- It does NOT include IQL, extract, classify, or rerank functionality
- Custom `IsaacusClient` already works and supports all Isaacus features
- Adding `langchain-isaacus` is optional optimization, not required

**Alternatives Considered**:

- Replace all with langchain-isaacus - REJECTED: Package doesn't support IQL
- Build custom LangChain wrapper - REJECTED: Over-engineering, existing client works

---

## 6. Existing Code Status

**Finding**: The `isaacus_iql.py` tool is complete and functional but not wired into `ISAACUS_TOOLS`.

**Current State**:

```python
# apps/agent/src/tools/__init__.py - CURRENT
ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,
    isaacus_search,
    isaacus_extract,
    isaacus_classify,
    # isaacus_iql is MISSING!
]
```

**Required Change**:

```python
# apps/agent/src/tools/__init__.py - AFTER
from .isaacus_iql import isaacus_iql, IsaacusIQLInput, IsaacusIQLOutput

ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,
    isaacus_search,
    isaacus_extract,
    isaacus_classify,
    isaacus_iql,  # ADD THIS
]
```

---

## Summary

All technical decisions resolved. The implementation is straightforward:

1. **Wire up IQL tool** - Add `isaacus_iql` to `ISAACUS_TOOLS` (5 min)
2. **Update agent instructions** - Add IQL tool selection guidance (30 min)
3. **Pass document context** - Extend `[CONTEXT]` message with `document_id` (1 hr)
4. **Update agent to use document context** - Filter by `document_ids` when provided (30 min)
5. **Template-first UI** - Templates already exist, just need to surface prominently (1 hr)

No blocking unknowns remain.



