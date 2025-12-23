"""Isaacus semantic search tool for document queries within matters."""

import os
from typing import List, Optional
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


async def isaacus_search(
    matter_id: str,
    query: str,
    max_results: int = 5,
    threshold: float = 0.5,
    supabase_client=None,  # Injected by agent context
) -> IsaacusSearchOutput:
    """
    Search for relevant document chunks within a matter using semantic similarity.
    
    This tool uses Isaacus embedding models optimized for Australian legal documents
    to find the most relevant passages matching a natural language query.
    
    Args:
        matter_id: The UUID of the matter to search within.
        query: A natural language question or search query.
        max_results: Maximum number of results to return (1-20).
        threshold: Minimum similarity score (0-1) for results.
        supabase_client: Supabase client (injected by agent context).
        
    Returns:
        IsaacusSearchOutput with matching document chunks and their sources.
        
    Example:
        >>> results = await isaacus_search(
        ...     matter_id="uuid-here",
        ...     query="What are the termination clauses?",
        ...     max_results=5
        ... )
    """
    # Initialize Isaacus client
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    
    if not api_key:
        return IsaacusSearchOutput(
            results=[],
            total_found=0,
            query=query,
            matter_id=matter_id,
        )
    
    client = IsaacusClient(api_key=api_key, base_url=base_url)
    
    try:
        # Generate embedding for the query
        embeddings = await client.embed([query])
        if not embeddings or len(embeddings) == 0:
            return IsaacusSearchOutput(
                results=[],
                total_found=0,
                query=query,
                matter_id=matter_id,
            )
        
        query_embedding = embeddings[0]
        
        # Call the Supabase RPC function to find similar documents
        if supabase_client is None:
            # Fallback - should be injected by agent context
            return IsaacusSearchOutput(
                results=[],
                total_found=0,
                query=query,
                matter_id=matter_id,
            )
        
        response = await supabase_client.rpc(
            "match_document_embeddings",
            {
                "query_embedding": query_embedding,
                "matter_uuid": matter_id,
                "match_threshold": threshold,
                "match_count": max_results,
            },
        ).execute()
        
        if response.data:
            results = [
                SearchResult(
                    document_id=row["document_id"],
                    filename=row["filename"],
                    chunk_text=row["chunk_text"],
                    similarity=row["similarity"],
                )
                for row in response.data
            ]
            
            return IsaacusSearchOutput(
                results=results,
                total_found=len(results),
                query=query,
                matter_id=matter_id,
            )
        
        return IsaacusSearchOutput(
            results=[],
            total_found=0,
            query=query,
            matter_id=matter_id,
        )
        
    except Exception as e:
        # Log error but don't expose internal details
        print(f"Isaacus search error: {e}")
        return IsaacusSearchOutput(
            results=[],
            total_found=0,
            query=query,
            matter_id=matter_id,
        )
    finally:
        await client.close()


# Tool definition for LangGraph
ISAACUS_SEARCH_TOOL = {
    "name": "isaacus_search",
    "description": """
Search for relevant document excerpts within a matter using semantic similarity.
Use this tool when the user asks questions about documents in a specific matter.
The search uses Isaacus AI models optimized for Australian legal documents.

Returns ranked results with document names, excerpts, and similarity scores.
""".strip(),
    "input_schema": IsaacusSearchInput,
    "func": isaacus_search,
}

