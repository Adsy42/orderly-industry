# API Contract: Python Agent Tools

**Feature**: 005-document-ingestion-grounding
**Date**: 2024-12-25

## Overview

New and enhanced Python agent tools for document structure extraction and grounded search.

---

## extract_document_structure

Extracts hierarchical structure from a document using the `unstructured` library.

### Tool Definition

```python
@tool(parse_docstring=True)
async def extract_document_structure(
    document_id: str,
    file_content: bytes,
    file_type: str,
) -> dict:
    """Extract hierarchical structure from a legal document.

    Parses PDF, DOCX, or TXT files to detect sections, headings,
    and paragraphs. Returns a tree structure suitable for storage
    and citation generation.

    Args:
        document_id: UUID of the document in Supabase
        file_content: Raw bytes of the document file
        file_type: File extension (pdf, docx, txt)

    Returns:
        Dictionary containing:
        - sections: List of hierarchical section objects
        - chunks: List of paragraph-level chunks with citations
        - normalized_markdown: Clean markdown text
        - extraction_quality: Confidence score 0-1
    """
```

### Input Schema

```python
{
    "document_id": str,      # UUID
    "file_content": bytes,   # Base64-encoded in JSON transport
    "file_type": str         # "pdf" | "docx" | "txt"
}
```

### Output Schema

```python
{
    "document_id": str,
    "sections": [
        {
            "id": str,                    # Generated UUID
            "parent_id": str | None,      # Parent section ID
            "section_number": str | None, # "7.2", "§ 512(c)", etc.
            "title": str | None,          # Section heading
            "level": int,                 # 1-6 hierarchy depth
            "sequence": int,              # Order within parent
            "path": list[str],            # ["7. Misc", "7.2 Governing Law"]
            "start_page": int | None,
            "end_page": int | None,
            "content": str                # Section text for section-level chunk
        }
    ],
    "chunks": [
        {
            "id": str,                    # Generated UUID
            "section_id": str | None,     # Associated section
            "parent_chunk_id": str | None,# Parent (section-level) chunk
            "chunk_level": str,           # "section" | "paragraph"
            "chunk_index": int,           # Order in document
            "content": str,               # Chunk text
            "content_hash": str,          # SHA-256 hash
            "citation": {
                "page": int,
                "section_path": list[str],
                "paragraph_index": int | None,
                "heading": str | None,
                "context_before": str | None,
                "context_after": str | None
            }
        }
    ],
    "normalized_markdown": str,           # Full document as clean markdown
    "extraction_quality": float,          # 0-1 confidence score
    "page_count": int,
    "error": str | None                   # Error message if partial failure
}
```

### Implementation Notes

```python
from unstructured.partition.auto import partition
from unstructured.documents.elements import Title, NarrativeText, ListItem

async def extract_document_structure(
    document_id: str,
    file_content: bytes,
    file_type: str
) -> dict:
    # 1. Parse with unstructured
    elements = partition(
        file=io.BytesIO(file_content),
        content_type=get_mime_type(file_type),
        strategy="hi_res",
        include_page_breaks=True,
        include_metadata=True,
    )

    # 2. Build section tree from Title elements
    sections = build_section_tree(elements)

    # 3. Create chunks with citations
    chunks = create_chunks_with_citations(elements, sections)

    # 4. Generate normalized markdown
    markdown = generate_normalized_markdown(elements)

    # 5. Calculate quality score
    quality = calculate_extraction_quality(elements, sections)

    return {
        "document_id": document_id,
        "sections": sections,
        "chunks": chunks,
        "normalized_markdown": markdown,
        "extraction_quality": quality,
        "page_count": get_page_count(elements),
        "error": None
    }
```

---

## isaacus_search (ENHANCED)

Enhanced semantic search with hybrid capabilities and citation formatting.

### Tool Definition

```python
@tool(parse_docstring=True)
async def isaacus_search(
    matter_id: str,
    query: str,
    max_results: int = 10,
    include_context: bool = True,
    semantic_weight: float = 0.7,
) -> str:
    """Search documents within a matter using hybrid semantic + keyword search.

    Combines Isaacus embedding similarity with keyword matching for
    legal term precision. Returns results with formatted citations.

    Args:
        matter_id: UUID of the matter to search
        query: Natural language or keyword search query
        max_results: Maximum number of results to return (default 10)
        include_context: Include parent section context (default True)
        semantic_weight: Balance between semantic (1.0) and keyword (0.0) search

    Returns:
        Formatted search results with citations for each match.
    """
```

### Output Format

```
Found 5 relevant sections in 3 documents:

1. **Master Services Agreement.pdf, p.12, § 7.2 Governing Law** (Score: 0.92)
   > "The governing law shall be the laws of the State of Delaware,
   > without regard to conflict of law principles."

   Context: This clause appears in the Miscellaneous section and establishes
   Delaware as the jurisdiction for dispute resolution.

2. **NDA Agreement.pdf, p.4, § 5.1 Choice of Law** (Score: 0.87)
   > "This Agreement shall be governed by the laws of Australia."

   Context: Standard choice of law provision in confidentiality agreement.

[... more results ...]
```

### Enhanced Implementation

```python
async def isaacus_search(
    matter_id: str,
    query: str,
    max_results: int = 10,
    include_context: bool = True,
    semantic_weight: float = 0.7,
) -> str:
    # 1. Generate query embedding
    isaacus = IsaacusClient()
    query_embedding = await isaacus.embed([query], task="retrieval/query")

    # 2. Call hybrid search function
    supabase = get_supabase_client()
    results = await supabase.rpc(
        "hybrid_search_chunks",
        {
            "query_embedding": query_embedding[0],
            "query_text": query,
            "matter_uuid": matter_id,
            "semantic_weight": semantic_weight,
            "match_count": max_results * 2,  # Get extra for reranking
            "include_context": include_context,
        }
    ).execute()

    # 3. Rerank with Isaacus
    if results.data:
        reranked = await isaacus.rerank(
            query=query,
            documents=[r["content"] for r in results.data],
            top_k=max_results,
        )
        results.data = [results.data[r["index"]] for r in reranked]

    # 4. Format with citations
    return format_search_results(results.data, query)
```

---

## isaacus_extract (ENHANCED)

Enhanced extractive QA with structural citation mapping.

### Tool Definition

```python
@tool(parse_docstring=True)
async def isaacus_extract(
    document_id: str,
    question: str,
) -> str:
    """Extract a precise answer from a document with citation.

    Uses Isaacus Extractive QA to find the exact text span that
    answers the question, then maps it to structural citation.

    Args:
        document_id: UUID of the document to search
        question: Question to answer from the document

    Returns:
        Extracted answer with precise citation (document, page, section).
    """
```

### Output Format

```
**Answer**: 30 days prior written notice

**Citation**: Master Services Agreement.pdf, p.8, § 5.2 Termination for Convenience

**Exact Quote**:
> "Either party may terminate this Agreement for any reason upon
> thirty (30) days prior written notice to the other party."

**Confidence**: 94%
```

### Enhanced Implementation

```python
async def isaacus_extract(
    document_id: str,
    question: str,
) -> str:
    # 1. Get document chunks
    supabase = get_supabase_client()
    chunks = await supabase.from_("document_chunks") \
        .select("id, content, citation") \
        .eq("document_id", document_id) \
        .eq("chunk_level", "paragraph") \
        .execute()

    # 2. Search for relevant chunks
    isaacus = IsaacusClient()
    query_embedding = await isaacus.embed([question], task="retrieval/query")

    relevant_chunks = await supabase.rpc(
        "hybrid_search_chunks",
        {
            "query_embedding": query_embedding[0],
            "query_text": question,
            "match_count": 5,
        }
    ).execute()

    # 3. Extract answer from top chunks
    combined_context = "\n\n".join([c["content"] for c in relevant_chunks.data])
    extraction = await isaacus.extract(
        question=question,
        context=combined_context,
    )

    # 4. Map to structural citation
    citation = find_citation_for_answer(
        answer=extraction["answer"],
        chunks=relevant_chunks.data,
    )

    # 5. Format response
    return format_extraction_result(extraction, citation)
```

---

## Common Utilities

### Citation Formatter

```python
def format_citation(citation: dict, filename: str) -> str:
    """Format citation in legal style.

    Examples:
        - "Contract.pdf, p.12, § 7.2 Governing Law"
        - "Brief.pdf, p.5, Part III.A"
        - "Statute.pdf, p.1, § 512(c)(1)"
    """
    parts = [filename]

    if citation.get("page"):
        parts.append(f"p.{citation['page']}")

    if citation.get("section_path"):
        section = citation["section_path"][-1]
        parts.append(f"§ {section}" if "." in section else section)

    return ", ".join(parts)
```

### Content Hash Verification

```python
import hashlib

def verify_content_hash(content: str, stored_hash: str) -> bool:
    """Verify chunk content matches stored hash."""
    computed = hashlib.sha256(content.encode()).hexdigest()
    return computed == stored_hash

def generate_content_hash(content: str) -> str:
    """Generate SHA-256 hash for content."""
    return hashlib.sha256(content.encode()).hexdigest()
```

---

## Error Handling

### Extraction Errors

```python
class ExtractionError(Exception):
    """Document extraction failed."""
    pass

class StructureDetectionError(Exception):
    """Could not detect document structure."""
    pass

class CitationMappingError(Exception):
    """Could not map answer to citation."""
    pass
```

### Graceful Degradation

1. **Structure detection fails** → Fall back to paragraph chunking
2. **OCR fails** → Mark as unprocessable, return error
3. **Isaacus API unavailable** → Queue for retry, partial processing
4. **Citation mapping fails** → Return answer without precise citation

---

## Agent Context Update

The Document Agent should be updated to include these tools:

```python
# agents/document_agent.py

DOCUMENT_AGENT_TOOLS = [
    extract_document_structure,  # NEW
    isaacus_search,              # ENHANCED
    isaacus_extract,             # ENHANCED
    isaacus_classify,            # EXISTING
    get_document_text,           # EXISTING
    list_matter_documents,       # EXISTING
]
```





