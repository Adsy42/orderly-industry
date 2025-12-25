# Feature Specification: Document Ingestion & Legal Grounding

**Feature Branch**: `005-document-ingestion-grounding`  
**Created**: 2024-12-25  
**Status**: Draft  
**Target Market**: Australian Legal  
**Input**: User description: "Refactor document ingestion pipeline to use Next.js API routes with hierarchical document structure, structural citations, and Isaacus grounding for precision legal citations"

## Overview

This feature refactors the document ingestion pipeline from Supabase Edge Functions to Next.js API routes, implementing a tree-based document structure that enables precision legal citations. The new architecture supports:

1. **Hierarchical Document Structure** - Documents stored as trees (sections → paragraphs) rather than flat chunks
2. **Structural Citations** - Page, section path, and paragraph-level citations that survive re-extraction
3. **Document Normalization** - Clean markdown output for optimal LLM consumption
4. **Hybrid Search** - Combined vector similarity + keyword search for legal precision
5. **Parent-Child Retrieval** - Search small chunks, expand to parent sections for context

### Current State (Problems)

| Issue                         | Current Implementation        | Impact                                     |
| ----------------------------- | ----------------------------- | ------------------------------------------ |
| **Flat chunking**             | 2000-char chunks with overlap | No structural awareness, citations break   |
| **Character offsets**         | None stored                   | Cannot point to exact source locations     |
| **Edge Function**             | Supabase Deno runtime         | Limited libraries, no Python parsing tools |
| **Vector dimension**          | 1536 in schema                | Isaacus Kanon 2 uses 1792 dimensions       |
| **No hybrid search**          | Vector only                   | Misses exact legal terms like "§ 512(c)"   |
| **No document normalization** | Raw extracted text            | Noise in LLM context                       |

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  NEW INGESTION PIPELINE                      │
│                                                              │
│  Upload → Next.js API → Structure Parser → Hierarchical     │
│           Route         (unstructured)     Chunker          │
│                              ↓                               │
│                    Document Tree (sections + paragraphs)     │
│                              ↓                               │
│                    Isaacus Kanon 2 Embeddings               │
│                              ↓                               │
│              Supabase pgvector (with structural citations)   │
└─────────────────────────────────────────────────────────────┘
```

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload Documents with Automatic Structure Detection (Priority: P1)

As counsel, I want uploaded legal documents to be automatically parsed into their hierarchical structure (sections, subsections, paragraphs), so that the system can provide precise citations when answering questions.

**Why this priority**: Structural parsing is the foundation for all citation and grounding features. Without structure detection, precise citations are impossible.

**Independent Test**: Can be fully tested by uploading a contract and verifying that sections are detected and stored hierarchically. Delivers value by enabling structured navigation.

**Acceptance Scenarios**:

1. **Given** counsel uploads a PDF contract, **When** processing completes, **Then** the system extracts hierarchical sections (e.g., "7. Termination" → "7.1 For Convenience" → paragraphs)
2. **Given** counsel uploads a DOCX with headings, **When** processing completes, **Then** heading levels are preserved as section hierarchy
3. **Given** counsel uploads a document without clear structure, **When** processing completes, **Then** the system uses paragraph-level chunking as fallback
4. **Given** processing encounters an error, **When** the error is displayed, **Then** counsel sees a clear message indicating what failed
5. **Given** a document is being processed, **When** counsel views the matter, **Then** they see real-time status updates (extracting → structuring → embedding → ready)

---

### User Story 2 - Search with Precise Citations (Priority: P1)

As counsel, I want search results to include precise citations (document name, page number, section), so that I can quickly verify sources and reference them in legal work.

**Why this priority**: Precise citations are essential for legal work. Lawyers must cite sources accurately; vague references are unacceptable.

**Independent Test**: Can be fully tested by searching for a term and verifying that results include page number, section path, and clickable links to source.

**Acceptance Scenarios**:

1. **Given** counsel searches for "governing law", **When** results are displayed, **Then** each result shows document name, page number, and section path (e.g., "MSA.pdf, p.12, § 7.2 Governing Law")
2. **Given** counsel clicks a citation, **When** the document viewer opens, **Then** the relevant section is highlighted
3. **Given** counsel asks the AI a question, **When** the AI responds with information from documents, **Then** each fact includes an inline citation in legal format
4. **Given** counsel searches for a statute reference like "§ 52", **When** results are returned, **Then** exact matches appear first (hybrid search)
5. **Given** search returns no results, **When** the empty state is displayed, **Then** counsel sees helpful suggestions

---

### User Story 3 - AI Grounded Responses with Citations (Priority: P1)

As counsel, I want the AI to ground its responses in my uploaded documents and provide citations for every claim, so that I can trust the information and verify it myself.

**Why this priority**: Grounded responses with citations are the core value proposition. Hallucination without citation is unacceptable in legal contexts.

**Independent Test**: Can be fully tested by asking the AI a question about document contents and verifying that the response includes verifiable citations.

**Acceptance Scenarios**:

1. **Given** counsel asks "What is the notice period for termination?", **When** the AI responds, **Then** it includes the exact answer with citation (e.g., "30 days [Contract.pdf, p.8, § 5.2]")
2. **Given** counsel asks about information not in any document, **When** the AI responds, **Then** it clearly states "This information was not found in your documents"
3. **Given** counsel asks a question with multiple relevant sections, **When** the AI responds, **Then** it synthesizes information from all sections with separate citations for each
4. **Given** counsel clicks a citation in the AI response, **When** the viewer opens, **Then** the exact quoted text is highlighted in the source document
5. **Given** the AI makes a claim, **When** counsel verifies the citation, **Then** the source text matches the AI's summary

---

### User Story 4 - Document Normalization for LLM Context (Priority: P2)

As a system operator, I want documents to be normalized into clean markdown format, so that LLM context is optimized and token usage is efficient.

**Why this priority**: Clean markdown improves LLM comprehension and reduces token waste. However, the system works without this optimization.

**Independent Test**: Can be fully tested by uploading a document and viewing the normalized markdown output. Delivers value by improving AI response quality.

**Acceptance Scenarios**:

1. **Given** a PDF with headers, **When** normalization completes, **Then** headers are converted to markdown format (# Section, ## Subsection)
2. **Given** a document with tables, **When** normalization completes, **Then** tables are converted to markdown table format
3. **Given** a document with lists, **When** normalization completes, **Then** lists are properly formatted with - or 1. prefixes
4. **Given** a document with noise (headers, footers, page numbers), **When** normalization completes, **Then** noise is removed from the content

---

### User Story 5 - Parent-Child Context Expansion (Priority: P2)

As counsel, I want search results to include surrounding context from the parent section, so that I understand the full meaning of a matched paragraph.

**Why this priority**: Legal text often requires context to understand properly. A single paragraph may be ambiguous without its section heading.

**Independent Test**: Can be fully tested by searching and verifying that results include section context beyond the matched paragraph.

**Acceptance Scenarios**:

1. **Given** a search matches paragraph 7.2.3, **When** results are displayed, **Then** the parent section context (7.2) is included
2. **Given** counsel expands a search result, **When** the expansion opens, **Then** sibling paragraphs (7.2.1, 7.2.2, 7.2.4) are visible
3. **Given** the AI retrieves information from a paragraph, **When** building context for the response, **Then** it includes the full parent section for accurate understanding

---

### User Story 6 - Hybrid Search for Legal Terms (Priority: P2)

As counsel, I want to search for exact legal terms (statute numbers, case citations) and get exact matches, so that I don't miss critical references.

**Why this priority**: Legal research often requires exact term matching that pure semantic search misses.

**Independent Test**: Can be fully tested by searching for "§ 512(c)" or a case citation and verifying exact matches appear.

**Acceptance Scenarios**:

1. **Given** counsel searches for "§ 1782(a)", **When** results are returned, **Then** documents containing this exact reference appear first
2. **Given** counsel searches for a case citation like "Brown v. Board", **When** results are returned, **Then** exact matches are prioritized over semantic similarity
3. **Given** counsel searches with a natural language query, **When** results are returned, **Then** both semantic and keyword matches are considered

---

### Edge Cases

- What happens when a PDF is scanned (image-based) with no selectable text? (OCR via DeepSeek Vision, then process normally)
- What happens when document structure is ambiguous (e.g., inconsistent heading styles)? (Fall back to paragraph-level chunking)
- What happens when the same section number appears multiple times? (Include page number in citation to disambiguate)
- What happens when Isaacus API is unavailable during embedding? (Queue for retry, mark as "pending_embedding")
- What happens when document structure changes upon re-extraction? (Use content hash verification, flag for review if mismatch)
- What happens when a document exceeds 500 pages? (Process in batches, store structure incrementally)

## Requirements _(mandatory)_

### Functional Requirements

#### Document Ingestion Pipeline (Next.js API Routes)

- **FR-001**: System MUST process document uploads via Next.js API routes instead of Supabase Edge Functions
- **FR-002**: System MUST extract document structure using the `unstructured` Python library (via API endpoint or subprocess)
- **FR-003**: System MUST detect hierarchical sections from PDF/DOCX headings and preserve parent-child relationships
- **FR-004**: System MUST extract page numbers for each content block
- **FR-005**: System MUST store sections in a tree structure with parent references
- **FR-006**: System MUST generate normalized markdown from extracted content
- **FR-007**: System MUST support PDF, DOCX, and TXT file formats
- **FR-008**: System MUST fall back to OCR (DeepSeek Vision) for scanned PDFs with insufficient text

#### Hierarchical Storage Schema

- **FR-009**: System MUST store document sections with section_number, title, level, and parent reference
- **FR-010**: System MUST store chunks with structural citations: page, section_path, paragraph_index
- **FR-011**: System MUST store content hash for each chunk to detect source changes
- **FR-012**: System MUST support parent-child references between chunks (section-level and paragraph-level)
- **FR-013**: System MUST update embedding dimension from 1536 to 1792 (Isaacus Kanon 2)
- **FR-014**: System MUST store chunk_level field to distinguish section vs paragraph chunks

#### Citation System

- **FR-015**: System MUST generate citations in format: "Document.pdf, p.X, § Y.Z Section Title"
- **FR-016**: System MUST store citation metadata as JSONB for flexibility
- **FR-017**: System MUST verify citations via content hash before displaying
- **FR-018**: System MUST support citation click-through to source document with highlighting

#### Search & Retrieval

- **FR-019**: System MUST implement hybrid search combining vector similarity and keyword matching
- **FR-020**: System MUST use pg_trgm extension for keyword/fuzzy matching
- **FR-021**: System MUST support configurable weighting between semantic and keyword scores
- **FR-022**: System MUST expand search results to include parent section context
- **FR-023**: System MUST rerank results using Isaacus Reranking API

#### AI Grounding

- **FR-024**: System MUST include structural citations in all AI responses that reference documents
- **FR-025**: System MUST use Isaacus Extractive QA for precise answer extraction with character positions
- **FR-026**: System MUST map extracted answers back to structural citations
- **FR-027**: System MUST clearly indicate when information is not found in documents

### Key Entities

- **Document**: Represents an uploaded file. Extended with `normalized_markdown` and `structure_extracted` fields. Links to sections and chunks.

- **Document Section**: New entity representing a hierarchical section within a document. Contains section_number (e.g., "7.2"), title, level (1-6), parent_section reference, sequence order, and page range. Self-referencing for tree structure.

- **Document Chunk**: Extended version of document_embeddings. Contains content, embedding, chunk_level (section/paragraph), parent_chunk reference, and structured citation JSONB with page, section_path array, paragraph_index, and content_hash.

### API Endpoints (Next.js)

- **POST /api/documents/process**: Trigger document processing for an uploaded file. Accepts document_id. Returns processing job status.

- **GET /api/documents/[id]/structure**: Retrieve document section tree. Returns hierarchical sections with children.

- **POST /api/documents/search**: Hybrid search across matter documents. Accepts matter_id, query, options (semantic_weight, include_context). Returns ranked chunks with citations.

- **GET /api/documents/[id]/sections/[sectionId]**: Retrieve section content with children and sibling context.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of PDF/DOCX documents have section structure correctly extracted (verified against manual review of 20 documents)
- **SC-002**: Citations are accurate (page, section) for 98% of retrieved chunks (verified by click-through testing)
- **SC-003**: Hybrid search returns exact legal term matches (§ references, case citations) in top 3 results
- **SC-004**: AI responses include verifiable citations for 100% of factual claims about document contents
- **SC-005**: Document processing completes within 90 seconds for documents under 100 pages
- **SC-006**: Users can navigate from citation to highlighted source in under 2 seconds
- **SC-007**: Token usage for document context is reduced by 20% due to markdown normalization
- **SC-008**: Search relevance improves (measured by user click-through rate on top 3 results increasing by 30%)

## Assumptions

- Next.js API routes can call Python-based `unstructured` library (via subprocess or separate microservice)
- Isaacus Kanon 2 embedder dimension is 1792 (to be verified with API documentation)
- Existing document upload flow remains unchanged; only processing pipeline changes
- Supabase storage continues to store raw files; only processing moves to Next.js
- pg_trgm extension is available or can be enabled in Supabase
- Documents are primarily in English (Isaacus optimized for legal English)
- Hierarchical structure detection works best with properly formatted documents (H1, H2 headings)
- Fallback to paragraph-level chunking is acceptable for unstructured documents
- Processing can be async (user doesn't need to wait for completion)
- Existing RLS policies on documents table remain valid for new tables

## Out of Scope

- Real-time collaborative document editing
- Document version control / diff tracking
- Non-English document support
- Email and deposition document types (future enhancement)
- Custom user-defined section markers
- Bulk document re-processing UI
