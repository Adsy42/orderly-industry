"""Isaacus semantic search tool with reranking for document queries within matters.

Enhanced with hierarchical citations and parent context expansion for legal grounding.
"""

import os
from typing import Any, List

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient
from .list_matter_documents import get_matter_documents_list


class Citation(BaseModel):
    """Structural citation for precise legal referencing."""

    page: int | None = Field(default=None, description="Page number in source document")
    section_path: list[str] = Field(
        default_factory=list, description="Path through section hierarchy"
    )
    paragraph_index: int | None = Field(
        default=None, description="Paragraph index within section"
    )
    heading: str | None = Field(default=None, description="Section heading text")
    formatted: str = Field(
        default="",
        description="Formatted citation string, e.g., 'Contract.pdf, p.12, § 7.2'",
    )


class SearchResult(BaseModel):
    """A single search result from semantic search with citation."""

    document_id: str = Field(description="UUID of the source document")
    chunk_id: str = Field(description="UUID of the specific chunk for permalink")
    filename: str = Field(description="Name of the source file")
    chunk_text: str = Field(description="The matching text excerpt")
    similarity: float = Field(description="Vector similarity score (0-1)")
    rerank_score: float | None = Field(
        default=None,
        description="Reranking score from Isaacus (0-1), higher is more relevant",
    )
    citation: Citation | None = Field(
        default=None,
        description="Structural citation for this result",
    )
    parent_content: str | None = Field(
        default=None,
        description="Parent section content for additional context",
    )


class IsaacusSearchInput(BaseModel):
    """Input schema for the isaacus_search tool."""

    matter_id: str = Field(description="UUID of the matter to search within")
    query: str = Field(description="Natural language search query")
    max_results: int = Field(
        default=5,
        description="Maximum number of results to return (1-20)",
        ge=1,
        le=20,
    )
    threshold: float = Field(
        default=0.3,
        description="Minimum similarity threshold (0-1), lower values return more results",
        ge=0,
        le=1,
    )
    semantic_weight: float = Field(
        default=0.7,
        description="Balance between semantic (1.0) and keyword (0.0) search. Use lower values for exact legal terms.",
        ge=0,
        le=1,
    )
    include_context: bool = Field(
        default=True,
        description="Include parent section content for additional context",
    )


class IsaacusSearchOutput(BaseModel):
    """Output schema for the isaacus_search tool."""

    results: List[SearchResult] = Field(
        default_factory=list,
        description="List of matching document chunks",
    )
    total_found: int = Field(
        default=0,
        description="Total number of results found",
    )
    query: str = Field(description="The original search query")
    matter_id: str = Field(description="The matter that was searched")
    reranked: bool = Field(
        default=False,
        description="Whether results were reranked by Isaacus",
    )


@tool(parse_docstring=True)
def isaacus_search(
    matter_id: str,
    query: str,
    max_results: int = 5,
    threshold: float = 0.3,
    semantic_weight: float = 0.7,
    include_context: bool = True,
) -> dict:
    """Search for relevant document chunks within a matter using hybrid semantic + keyword search.

    This tool uses Isaacus embedding models optimized for legal documents
    to find the most relevant passages matching a natural language query.
    Results are reranked using Isaacus's universal classifier for improved accuracy.

    **Returns results with precise citations** in legal format: [Document.pdf, p.X, § Y.Z]

    Args:
        matter_id: The UUID of the matter to search within.
        query: A natural language question or search query.
        max_results: Maximum number of results to return (1-20). Defaults to 5.
        threshold: Minimum similarity score (0-1) for results. Defaults to 0.3.
        semantic_weight: Balance between semantic (1.0) and keyword (0.0) search. Use 0.3 for exact legal terms like "§ 512(c)". Defaults to 0.7.
        include_context: Include parent section content for additional context. Defaults to True.

    Returns:
        A dictionary with matching document chunks, their sources, and formatted citations.
        Each result includes a `citation` object with page, section_path, and formatted string.
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _isaacus_search_async(
            matter_id, query, max_results, threshold, semantic_weight, include_context
        )
    )


async def _isaacus_search_async(
    matter_id: str,
    query: str,
    max_results: int = 5,
    threshold: float = 0.3,
    semantic_weight: float = 0.7,
    include_context: bool = True,
) -> dict:
    """Internal async implementation of isaacus_search with hybrid search and citations."""
    # Check for required env vars
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not api_key:
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "reranked": False,
            "error": "ISAACUS_API_KEY not configured",
        }

    if not supabase_url or not supabase_key:
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "reranked": False,
            "error": "Supabase credentials not configured",
        }

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        # Step 1: Generate embedding for the query using retrieval/query task
        embeddings = await client.embed([query], task="retrieval/query")
        if not embeddings or len(embeddings) == 0:
            return {
                "results": [],
                "total_found": 0,
                "query": query,
                "matter_id": matter_id,
                "reranked": False,
                "error": "Failed to generate query embedding",
            }

        query_embedding = embeddings[0]
        print(f"[Isaacus Search] Query embedding dimension: {len(query_embedding)}")

        # Format embedding as string for pgvector
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Step 2: Hybrid search - try new function first, fallback to legacy
        candidate_count = min(max_results * 3, 20)  # Get 3x for reranking

        async with httpx.AsyncClient() as http_client:
            # Try hybrid search function first (new schema)
            response = await http_client.post(
                f"{supabase_url}/rest/v1/rpc/hybrid_search_chunks",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "query_embedding": embedding_str,
                    "query_text": query,
                    "matter_uuid": matter_id,
                    "semantic_weight": semantic_weight,
                    "match_threshold": threshold,
                    "match_count": candidate_count,
                    "include_context": include_context,
                },
            )

            # If hybrid search fails, fallback to legacy function
            if response.status_code != 200:
                print("[Isaacus Search] Hybrid search not available, using legacy")
                response = await http_client.post(
                    f"{supabase_url}/rest/v1/rpc/match_document_chunks",
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "query_embedding": embedding_str,
                        "matter_uuid": matter_id,
                        "match_threshold": threshold,
                        "match_count": candidate_count,
                    },
                )

            if response.status_code != 200:
                error_detail = response.text
                print(
                    f"[Isaacus Search] Supabase RPC error: {response.status_code} - {error_detail}"
                )
                return {
                    "results": [],
                    "total_found": 0,
                    "query": query,
                    "matter_id": matter_id,
                    "reranked": False,
                    "error": f"Supabase RPC error: {response.status_code}",
                }

            candidates = response.json()

        if not candidates:
            # No results found - provide smart fallback
            return await _handle_no_results(matter_id, query)

        print(f"[Isaacus Search] Found {len(candidates)} candidates")

        # Step 3: Rerank candidates if we have more than one
        reranked = False
        results = []

        # Get chunk text field (supports both old and new schema)
        def get_chunk_text(c: dict) -> str:
            return c.get("content") or c.get("chunk_text") or ""

        if len(candidates) > 1:
            try:
                print(f"[Isaacus Search] Reranking {len(candidates)} candidates")
                rerank_results = await client.rerank(
                    query=query,
                    documents=[get_chunk_text(c) for c in candidates],
                    model="kanon-universal-classifier",
                    top_k=max_results,
                )

                # Map rerank scores back to candidates and format citations
                results = []
                for r in rerank_results:
                    candidate = candidates[r["index"]]
                    result = _format_search_result(candidate, r["score"])
                    results.append(result)

                reranked = True
                print(
                    f"[Isaacus Search] Reranking complete, top score: {results[0]['rerank_score']:.3f}"
                )
            except Exception as e:
                print(f"[Isaacus Search] Reranking failed, using scores: {e}")
                # Fall back to score order
                results = [
                    _format_search_result(row, None) for row in candidates[:max_results]
                ]
        else:
            # Single result, no reranking needed
            results = [_format_search_result(candidates[0], None)]

        # Add citation usage hint for the agent
        citation_hint = (
            "CITATION FORMAT: For each result, use the 'citation.permalink' in markdown links. "
            "Example: 'According to [Contract.pdf, p.12, § 7.2](cite:doc-id#chunk-id), the clause states...'"
        )

        return {
            "results": results,
            "total_found": len(results),
            "query": query,
            "matter_id": matter_id,
            "reranked": reranked,
            "_citation_hint": citation_hint,
        }

    except Exception as e:
        print(f"[Isaacus Search] Error: {e}")
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "reranked": False,
            "error": str(e),
        }
    finally:
        await client.close()


def _format_search_result(
    candidate: dict[str, Any], rerank_score: float | None
) -> dict:
    """Format a search result with citation from candidate data."""
    # Get chunk ID (new schema uses chunk_id, old uses id)
    chunk_id = candidate.get("chunk_id") or candidate.get("id") or ""

    # Get chunk text (supports both old and new schema)
    chunk_text = candidate.get("content") or candidate.get("chunk_text") or ""

    # Get similarity/score (supports both old and new schema)
    similarity = candidate.get("similarity") or candidate.get("score") or 0.0

    # Get citation data if available (new schema)
    citation_data = candidate.get("citation") or {}
    filename = candidate.get("filename", "Document")
    document_id = candidate.get("document_id", "")

    # Format citation string
    citation_parts = [filename]
    page = citation_data.get("page")
    if page:
        citation_parts.append(f"p.{page}")

    section_path = citation_data.get("section_path") or []
    if section_path:
        last_section = section_path[-1] if section_path else ""
        # Extract section number if present
        import re

        section_match = re.match(r"^(\d+\.?)+", last_section)
        if section_match:
            citation_parts.append(f"§ {section_match.group(0)}")
        elif last_section:
            # Use first few words of heading
            short_heading = " ".join(last_section.split()[:3])
            citation_parts.append(short_heading)

    formatted_citation = ", ".join(citation_parts)

    # Create permalink format: cite:document_id#chunk_id
    permalink = f"cite:{document_id}#{chunk_id}" if chunk_id else f"cite:{document_id}"

    # Create ready-to-use markdown citation
    markdown_citation = f"[{formatted_citation}]({permalink})"

    return {
        "document_id": document_id,
        "chunk_id": chunk_id,
        "filename": filename,
        "chunk_text": chunk_text,
        "similarity": similarity,
        "rerank_score": rerank_score,
        "citation": {
            "page": page,
            "section_path": section_path,
            "paragraph_index": citation_data.get("paragraph_index"),
            "heading": citation_data.get("heading"),
            "formatted": formatted_citation,
            "permalink": permalink,
            "markdown": markdown_citation,  # Ready-to-use markdown link
        },
        "parent_content": candidate.get("parent_content"),
    }


async def _handle_no_results(matter_id: str, query: str) -> dict:
    """Handle case when no search results are found."""
    available_docs = await get_matter_documents_list(matter_id)

    if available_docs:
        ready_docs = [
            {"filename": doc["filename"], "status": doc["processing_status"]}
            for doc in available_docs
            if doc["processing_status"] == "ready"
        ]
        processing_docs = [
            {"filename": doc["filename"], "status": doc["processing_status"]}
            for doc in available_docs
            if doc["processing_status"] in ["pending", "extracting", "embedding"]
        ]

        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "reranked": False,
            "available_documents": ready_docs,
            "processing_documents": processing_docs,
            "hint": (
                f"No content matched your query '{query}'. "
                f"There are {len(ready_docs)} searchable document(s) in this matter. "
                "Try a different search query, or use list_matter_documents to see all files."
            )
            if ready_docs
            else (
                f"Documents are still being processed ({len(processing_docs)} pending). "
                "Please wait for processing to complete before searching."
            ),
        }
    else:
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "reranked": False,
            "available_documents": [],
            "hint": "No documents have been uploaded to this matter yet.",
        }


# Export the tool function directly
ISAACUS_SEARCH_TOOL = isaacus_search
