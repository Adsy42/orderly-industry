"""Isaacus semantic search tool with reranking for document queries within matters."""

import os
from typing import List

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient
from .list_matter_documents import get_matter_documents_list


class SearchResult(BaseModel):
    """A single search result from semantic search."""

    document_id: str = Field(description="UUID of the source document")
    filename: str = Field(description="Name of the source file")
    chunk_text: str = Field(description="The matching text excerpt")
    similarity: float = Field(description="Vector similarity score (0-1)")
    rerank_score: float | None = Field(
        default=None,
        description="Reranking score from Isaacus (0-1), higher is more relevant",
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
) -> dict:
    """Search for relevant document chunks within a matter using semantic similarity and AI reranking.

    This tool uses Isaacus embedding models optimized for legal documents
    to find the most relevant passages matching a natural language query.
    Results are reranked using Isaacus's universal classifier for improved accuracy.

    Args:
        matter_id: The UUID of the matter to search within.
        query: A natural language question or search query.
        max_results: Maximum number of results to return (1-20). Defaults to 5.
        threshold: Minimum similarity score (0-1) for results. Defaults to 0.3.

    Returns:
        A dictionary with matching document chunks and their sources.
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _isaacus_search_async(matter_id, query, max_results, threshold)
    )


async def _isaacus_search_async(
    matter_id: str,
    query: str,
    max_results: int = 5,
    threshold: float = 0.3,
) -> dict:
    """Internal async implementation of isaacus_search with reranking."""
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

        # Step 2: Vector search - get more candidates for reranking
        candidate_count = min(max_results * 3, 20)  # Get 3x for reranking
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{supabase_url}/rest/v1/rpc/match_document_embeddings",
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
                print(f"[Isaacus Search] Supabase RPC error: {response.status_code} - {error_detail}")
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

        print(f"[Isaacus Search] Found {len(candidates)} vector candidates")

        # Step 3: Rerank candidates if we have more than one
        reranked = False
        results = []

        if len(candidates) > 1:
            try:
                print(f"[Isaacus Search] Reranking {len(candidates)} candidates")
                rerank_results = await client.rerank(
                    query=query,
                    documents=[c["chunk_text"] for c in candidates],
                    model="kanon-universal-classifier",
                    top_k=max_results,
                )

                # Map rerank scores back to candidates
                results = []
                for r in rerank_results:
                    candidate = candidates[r["index"]]
                    results.append({
                        "document_id": candidate["document_id"],
                        "filename": candidate["filename"],
                        "chunk_text": candidate["chunk_text"],
                        "similarity": candidate["similarity"],
                        "rerank_score": r["score"],
                    })

                reranked = True
                print(f"[Isaacus Search] Reranking complete, top score: {results[0]['rerank_score']:.3f}")
            except Exception as e:
                print(f"[Isaacus Search] Reranking failed, using vector scores: {e}")
                # Fall back to vector similarity order
                results = [
                    {
                        "document_id": row["document_id"],
                        "filename": row["filename"],
                        "chunk_text": row["chunk_text"],
                        "similarity": row["similarity"],
                        "rerank_score": None,
                    }
                    for row in candidates[:max_results]
                ]
        else:
            # Single result, no reranking needed
            results = [
                {
                    "document_id": candidates[0]["document_id"],
                    "filename": candidates[0]["filename"],
                    "chunk_text": candidates[0]["chunk_text"],
                    "similarity": candidates[0]["similarity"],
                    "rerank_score": None,
                }
            ]

        return {
            "results": results,
            "total_found": len(results),
            "query": query,
            "matter_id": matter_id,
            "reranked": reranked,
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
