# API Contract: Agent Tools

**Feature Branch**: `004-matters-documents`  
**Date**: 2025-12-24  
**Status**: ✅ Implemented  
**Location**: `apps/agent/src/tools/`

## Overview

Five agent tools extend the deep agents framework with Isaacus-powered document intelligence and Supabase document access. These tools are available to the orchestrator and the Document Agent subagent.

| Tool                    | Purpose                                      | Status |
| ----------------------- | -------------------------------------------- | ------ |
| `isaacus_search`        | Semantic search + reranking across documents | ✅     |
| `isaacus_extract`       | Extractive QA with document citations        | ✅     |
| `isaacus_classify`      | Legal clause classification                  | ✅     |
| `get_document_text`     | Retrieve full document text from Supabase    | ✅     |
| `list_matter_documents` | List all documents in a matter               | ✅     |

## Tool: isaacus_search

Semantic search across documents in a matter using Isaacus Embedding and Reranking.

### Signature

```python
@tool(parse_docstring=True)
async def isaacus_search(
    matter_id: str,
    query: str,
    max_results: Annotated[int, InjectedToolArg] = 10,
) -> str:
    """Search documents in a matter using semantic similarity.

    Finds documents and excerpts that are semantically related to the query,
    even if they don't contain exact keyword matches. Uses legal-optimized
    embeddings for better relevance on Australian legal documents.

    Args:
        matter_id: The UUID of the matter to search within
        query: Natural language search query (e.g., "limitation period for contract claims")
        max_results: Maximum number of results to return (default: 10)

    Returns:
        Formatted string with ranked search results including document names,
        relevant excerpts, and similarity scores.
    """
```

### Implementation Flow

```
1. Validate user has access to matter
2. Generate query embedding via Isaacus Embed API
3. Call Supabase RPC: match_document_embeddings()
4. Rerank results via Isaacus Rerank API
5. Format results with citations
```

### Example Output

```
Found 3 relevant excerpts in matter M-2025-001:

1. [Contract Agreement.pdf, Page 12] (Relevance: 0.92)
   "The limitation period for any claim arising under this agreement
    shall be six (6) years from the date of breach..."

2. [Legal Advice Memo.docx, Section 4.2] (Relevance: 0.87)
   "Under the Limitation Act 1969 (NSW), the standard limitation
    period for contractual claims is six years..."

3. [Case Summary.txt] (Relevance: 0.81)
   "The court held that the limitation period had not yet commenced
    as the plaintiff was unaware of the breach until..."
```

### Error Handling

| Error             | Response                                                            |
| ----------------- | ------------------------------------------------------------------- |
| Matter not found  | "Error: Matter {matter_id} not found or you don't have access."     |
| No documents      | "No documents found in this matter. Upload documents first."        |
| No results        | "No relevant documents found for query: '{query}'"                  |
| Isaacus API error | "Search temporarily unavailable. Falling back to keyword search..." |

---

## Tool: isaacus_extract

Extract precise answers from documents using Isaacus Extractive QA.

### Signature

```python
@tool(parse_docstring=True)
async def isaacus_extract(
    document_id: str,
    question: str,
) -> str:
    """Extract a precise answer from a document.

    Uses extractive question answering to find and return the exact text
    that answers the question, with a citation to the source location.
    Ideal for finding specific clauses, dates, parties, or provisions.

    Args:
        document_id: The UUID of the document to extract from
        question: Specific question to answer (e.g., "What is the termination notice period?")

    Returns:
        The extracted answer with citation, or indication that no answer was found.
    """
```

### Implementation Flow

```
1. Validate user has access to document
2. Retrieve document extracted_text from Supabase
3. Call Isaacus Extract API with question + context
4. Format response with citation
```

### Example Output

```
Answer found in [Service Agreement.pdf]:

Question: "What is the termination notice period?"

Answer: "Either party may terminate this Agreement by providing ninety (90)
days written notice to the other party."

Source: Page 8, Section 12.1 (Termination)
Confidence: 0.94
```

### Multi-Document Variant

For questions spanning multiple documents, use `isaacus_search` first to identify relevant documents, then `isaacus_extract` on each.

### Error Handling

| Error              | Response                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| Document not found | "Error: Document {document_id} not found or you don't have access."                 |
| Not processed      | "Document is still being processed. Please wait and try again."                     |
| No answer found    | "No answer found for: '{question}'. The document may not contain this information." |

---

## Tool: isaacus_classify

Identify and extract clauses from legal documents using Isaacus Universal Classification.

### Signature

```python
@tool(parse_docstring=True)
async def isaacus_classify(
    document_id: str,
    clause_types: Annotated[list[str] | None, InjectedToolArg] = None,
) -> str:
    """Identify and classify clauses in a legal document.

    Analyzes the document to find and categorize legal clauses without
    requiring training data. Can find standard clause types or search
    for custom clause descriptions.

    Args:
        document_id: The UUID of the document to analyze
        clause_types: Optional list of clause types to find. If not provided,
                      uses standard legal clause categories:
                      - termination
                      - indemnity
                      - limitation of liability
                      - confidentiality
                      - dispute resolution
                      - governing law
                      - force majeure
                      - assignment
                      - warranties
                      - payment terms

    Returns:
        Structured list of identified clauses with their locations and text.
    """
```

### Implementation Flow

```
1. Validate user has access to document
2. Retrieve document extracted_text from Supabase
3. Call Isaacus Classify API with text + labels
4. Format results by clause type with locations
```

### Example Output

```
Clause Analysis for [Master Services Agreement.pdf]:

✓ TERMINATION (Found: 2 clauses)
  • Section 12.1 (Page 8): "Either party may terminate this Agreement..."
  • Section 12.3 (Page 9): "Upon termination, the Client shall pay..."

✓ LIMITATION OF LIABILITY (Found: 1 clause)
  • Section 15.2 (Page 11): "In no event shall either party's total
    liability exceed the fees paid in the preceding 12 months..."

✓ CONFIDENTIALITY (Found: 1 clause)
  • Section 8 (Page 6): "Each party agrees to maintain the
    confidentiality of all Confidential Information..."

✗ FORCE MAJEURE - Not found
✗ INDEMNITY - Not found

Summary: Found 4 clauses across 3 categories.
```

### Custom Clause Types

```python
# Find specific clause types
result = await isaacus_classify(
    document_id="uuid",
    clause_types=["automatic renewal", "price escalation", "audit rights"]
)
```

### Error Handling

| Error              | Response                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Document not found | "Error: Document {document_id} not found or you don't have access."                         |
| Not a contract     | "This document does not appear to be a contract. Clause analysis works best on agreements." |
| No clauses found   | "No clauses matching the specified types were found in this document."                      |

---

## Document Agent Subagent

### Configuration

```python
document_agent = {
    "name": "document-agent",
    "description": """Analyze documents within a matter. Use for:
    - Searching across documents for specific information
    - Extracting precise answers from documents
    - Identifying and classifying contract clauses

    Delegate document-heavy tasks to this agent to keep main context clean.""",
    "system_prompt": DOCUMENT_AGENT_INSTRUCTIONS,
    "tools": [isaacus_search, isaacus_extract, isaacus_classify, think_tool],
}
```

### System Prompt

```python
DOCUMENT_AGENT_INSTRUCTIONS = """You are a Document Analysis Agent for Orderly,
a legal AI platform for Australian counsel.

Your role is to analyze legal documents within matters using specialized tools:

1. **isaacus_search**: Find relevant documents and excerpts using semantic search
2. **isaacus_extract**: Extract precise answers from specific documents
3. **isaacus_classify**: Identify and categorize clauses in contracts

## Guidelines

- Always start with `isaacus_search` to find relevant documents
- Use `isaacus_extract` for precise answers with citations
- Use `isaacus_classify` for contract analysis tasks
- Include document citations in all responses (document name, page, section)
- Use `think_tool` to plan your approach before diving into analysis
- If multiple documents are relevant, analyze each and synthesize findings

## Response Format

When providing answers:
- Lead with the answer
- Follow with supporting evidence from documents
- Include full citations for every claim
- Note if information spans multiple documents

## Australian Legal Context

- Documents may reference Australian legislation and case law
- Common contract types: service agreements, leases, employment contracts
- Standard clauses follow Australian contract law conventions
"""
```

### Delegation Example

When the orchestrator receives a document-related query:

```python
# Orchestrator delegates to Document Agent
await task(
    agent="document-agent",
    task="Search the Smith v Jones matter for all references to the limitation period and extract the relevant clauses."
)
```

---

## Isaacus Client Service

### Location

`apps/agent/src/services/isaacus_client.py`

### Interface

```python
class IsaacusClient:
    """Client for Isaacus Legal AI API."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.isaacus.com",
        max_retries: int = 3,
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.max_retries = max_retries
        self.client = httpx.AsyncClient(timeout=30.0)

    async def embed(
        self,
        texts: list[str],
        model: str = "legal-embed-v1",
    ) -> list[list[float]]:
        """Generate embeddings for texts."""
        ...

    async def rerank(
        self,
        query: str,
        documents: list[str],
        model: str = "legal-rerank-v1",
    ) -> list[dict]:
        """Rerank documents by relevance to query."""
        ...

    async def extract(
        self,
        question: str,
        context: str,
        model: str = "legal-extract-v1",
    ) -> dict:
        """Extract answer from context."""
        ...

    async def classify(
        self,
        text: str,
        labels: list[str],
        model: str = "legal-classify-v1",
    ) -> list[dict]:
        """Classify text into labels."""
        ...
```

### Environment Variables

```
ISAACUS_API_KEY=your_api_key_here
ISAACUS_BASE_URL=https://api.isaacus.com  # optional, defaults to production
DEEPSEEK_API_KEY=your_deepseek_key  # optional, for OCR on scanned PDFs
```

---

## Tool: get_document_text

Retrieve the full extracted text of a document from Supabase.

### Signature

```python
@tool(parse_docstring=True)
async def get_document_text(
    document_id: str,
) -> str:
    """Retrieve the full text content of a document.

    Fetches the extracted text from a document stored in Supabase Storage.
    Uses the document_processor service to extract text from PDF, DOCX,
    or TXT files. Includes OCR fallback for scanned PDFs via DeepSeek.

    Args:
        document_id: The UUID of the document to retrieve

    Returns:
        The full extracted text content of the document, or an error message.
    """
```

### Implementation Flow

```
1. Validate user has access to document via matter membership
2. Fetch document record from Supabase
3. Download file from Supabase Storage
4. Extract text using DocumentProcessor:
   - PDF: PyMuPDF with DeepSeek OCR fallback
   - DOCX: python-docx with mammoth fallback
   - TXT: UTF-8 decode
5. Return extracted text
```

### Example Output

```
Document: Service_Agreement.pdf
Pages: 12

[Full text content of the document...]
```

### Error Handling

| Error              | Response                                                            |
| ------------------ | ------------------------------------------------------------------- |
| Document not found | "Error: Document {document_id} not found or you don't have access." |
| Download failed    | "Error: Could not download document from storage."                  |
| Extraction failed  | "Error: Could not extract text from document."                      |

---

## Tool: list_matter_documents

List all documents in a matter with their metadata.

### Signature

```python
@tool(parse_docstring=True)
async def list_matter_documents(
    matter_id: str,
) -> str:
    """List all documents in a matter.

    Retrieves metadata for all documents uploaded to a specific matter,
    including filename, file type, size, processing status, and upload date.

    Args:
        matter_id: The UUID of the matter to list documents for

    Returns:
        Formatted list of documents with their metadata.
    """
```

### Implementation Flow

```
1. Validate user has access to matter
2. Query documents table filtered by matter_id
3. Format results with metadata
```

### Example Output

```
Documents in matter M-2025-001 (3 total):

1. Service_Agreement.pdf
   - Type: application/pdf
   - Size: 245 KB
   - Status: ready
   - Uploaded: 2025-12-23 14:30:00

2. Employment_Contract.docx
   - Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
   - Size: 128 KB
   - Status: ready
   - Uploaded: 2025-12-23 15:45:00

3. Meeting_Notes.txt
   - Type: text/plain
   - Size: 4 KB
   - Status: ready
   - Uploaded: 2025-12-24 09:15:00
```

### Error Handling

| Error            | Response                                                        |
| ---------------- | --------------------------------------------------------------- |
| Matter not found | "Error: Matter {matter_id} not found or you don't have access." |
| No documents     | "No documents found in this matter."                            |

---

## DeepSeek OCR Service

### Location

`apps/agent/src/services/deepseek_ocr.py`

### Purpose

Provides OCR capability for scanned PDF documents when PyMuPDF's native text extraction yields insufficient content.

### Interface

```python
class DeepSeekOCR:
    """OCR service using DeepSeek's vision model."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com"
        )

    async def extract_text_from_images(
        self,
        images: list[bytes],
        language: str = "en",
    ) -> str:
        """Extract text from images using vision model."""
        ...
```

### Usage in DocumentProcessor

```python
async def _extract_pdf_pymupdf(self, content: bytes) -> str:
    # First pass: Native text extraction
    for page in doc:
        text = page.get_text().strip()
        if len(text) < MIN_TEXT_THRESHOLD:
            # Page needs OCR - render to image
            ocr_needed_pages.append((page_num, pixmap))

    # Second pass: OCR for pages with low text
    if ocr_needed_pages and self.ocr_service:
        ocr_text = await self.ocr_service.extract_text_from_images(images)
        # Merge OCR results with native text
```

### Environment Variables

```
DEEPSEEK_API_KEY=your_deepseek_key  # Required for OCR functionality
```
