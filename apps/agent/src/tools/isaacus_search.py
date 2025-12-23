"""Isaacus semantic search tool for document queries within matters."""

import os
from typing import List

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class SearchResult(BaseModel):
    """A single search result from semantic search."""

    document_id: str = Field(description="UUID of the source document")
    filename: str = Field(description="Name of the source file")
    chunk_text: str = Field(description="The matching text excerpt")
    similarity: float = Field(description="Similarity score (0-1)")


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
        default=0.5,
        description="Minimum similarity threshold (0-1)",
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


@tool(parse_docstring=True)
def isaacus_search(
    matter_id: str,
    query: str,
    max_results: int = 5,
    threshold: float = 0.5,
) -> dict:
    """Search for relevant document chunks within a matter using semantic similarity.

    This tool uses Isaacus embedding models optimized for Australian legal documents
    to find the most relevant passages matching a natural language query.

    Args:
        matter_id: The UUID of the matter to search within.
        query: A natural language question or search query.
        max_results: Maximum number of results to return (1-20). Defaults to 5.
        threshold: Minimum similarity score (0-1) for results. Defaults to 0.5.

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
    threshold: float = 0.5,
) -> dict:
    """Internal async implementation of isaacus_search."""
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
            "error": "ISAACUS_API_KEY not configured",
        }

    if not supabase_url or not supabase_key:
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "error": "Supabase credentials not configured",
        }

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        # Generate embedding for the query
        embeddings = await client.embed([query])
        if not embeddings or len(embeddings) == 0:
            return {
                "results": [],
                "total_found": 0,
                "query": query,
                "matter_id": matter_id,
                "error": "Failed to generate query embedding",
            }

        query_embedding = embeddings[0]

        # Call Supabase RPC function to find similar documents
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{supabase_url}/rest/v1/rpc/match_document_embeddings",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "query_embedding": query_embedding,
                    "matter_uuid": matter_id,
                    "match_threshold": threshold,
                    "match_count": max_results,
                },
            )

            if response.status_code != 200:
                return {
                    "results": [],
                    "total_found": 0,
                    "query": query,
                    "matter_id": matter_id,
                    "error": f"Supabase RPC error: {response.status_code}",
                }

            data = response.json()

            if data:
                results = [
                    {
                        "document_id": row["document_id"],
                        "filename": row["filename"],
                        "chunk_text": row["chunk_text"],
                        "similarity": row["similarity"],
                    }
                    for row in data
                ]

                return {
                    "results": results,
                    "total_found": len(results),
                    "query": query,
                    "matter_id": matter_id,
                }

            return {
                "results": [],
                "total_found": 0,
                "query": query,
                "matter_id": matter_id,
            }

    except Exception as e:
        print(f"Isaacus search error: {e}")
        return {
            "results": [],
            "total_found": 0,
            "query": query,
            "matter_id": matter_id,
            "error": str(e),
        }
    finally:
        await client.close()


# Export the tool function directly - no dict wrapper needed
ISAACUS_SEARCH_TOOL = isaacus_search
