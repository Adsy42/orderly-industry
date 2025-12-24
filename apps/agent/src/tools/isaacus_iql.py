"""Isaacus IQL (Isaacus Query Language) tool for legal document analysis."""

import os
from typing import List, Optional

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class IQLMatch(BaseModel):
    """A match from an IQL query."""

    text: str = Field(description="The matching text excerpt")
    start_index: int = Field(description="Character position start")
    end_index: int = Field(description="Character position end")
    score: float = Field(description="Confidence score (0-1)")


class IsaacusIQLInput(BaseModel):
    """Input schema for the isaacus_iql tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    query: str = Field(
        description="IQL query string (e.g., '{IS confidentiality clause}')"
    )
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific document IDs to analyze. If not provided, analyzes all documents in the matter.",
    )
    model: Optional[str] = Field(
        default="kanon-universal-classifier",
        description="Classification model to use (kanon-universal-classifier or kanon-universal-classifier-mini)",
    )


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


@tool(parse_docstring=True)
def isaacus_iql(
    matter_id: str,
    query: str,
    document_ids: Optional[List[str]] = None,
    model: str = "kanon-universal-classifier",
) -> dict:
    """Execute an IQL (Isaacus Query Language) query against documents in a matter.

    Use this tool to analyze legal documents using IQL queries. IQL allows you to:
    - Use pre-built templates: {IS confidentiality clause}
    - Combine queries with operators: {IS clause 1} AND {IS clause 2}
    - Use comparison operators: {IS clause 1} > {IS clause 2}

    Examples:
    - "{IS confidentiality clause}" - Find confidentiality clauses
    - "{IS termination clause} AND {IS unilateral clause}" - Find unilateral termination clauses
    - "{IS clause obligating \"Customer\"}" - Find clauses obligating the Customer

    Args:
        matter_id: UUID of the matter containing the documents
        query: IQL query string
        document_ids: Optional list of specific document IDs to analyze
        model: Classification model to use

    Returns:
        Dictionary with query results including matches and scores for each document
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _isaacus_iql_async(matter_id, query, document_ids, model)
    )


async def _isaacus_iql_async(
    matter_id: str,
    query: str,
    document_ids: Optional[List[str]],
    model: str,
) -> dict:
    """Internal async implementation."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not supabase_url or not supabase_key:
        return {
            "error": "Supabase credentials not configured",
            "query": query,
            "document_results": [],
            "total_matches": 0,
            "average_score": 0.0,
        }

    import httpx

    async with httpx.AsyncClient() as client:
        # Get documents from matter
        query_url = f"{supabase_url}/rest/v1/documents"
        params = {
            "matter_id": f"eq.{matter_id}",
            "processing_status": "eq.ready",
            "select": "id,filename,extracted_text",
        }

        if document_ids:
            params["id"] = f"in.({','.join(document_ids)})"

        response = await client.get(
            query_url,
            params=params,
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
            },
        )

        if response.status_code != 200:
            return {
                "error": f"Failed to query documents: {response.status_code}",
                "query": query,
                "document_results": [],
                "total_matches": 0,
                "average_score": 0.0,
            }

        documents = response.json()

        if not documents:
            return {
                "error": "No ready documents found in this matter",
                "query": query,
                "document_results": [],
                "total_matches": 0,
                "average_score": 0.0,
            }

        # Execute IQL query on each document
        isaacus_client = IsaacusClient()
        document_results = []
        total_matches = 0
        total_score = 0.0

        for doc in documents:
            extracted_text = doc.get("extracted_text") or ""
            if not extracted_text.strip():
                continue

            try:
                result = await isaacus_client.classify_iql(query, extracted_text, model)
                matches = result.get("matches", [])
                score = result.get("score", 0.0)

                document_results.append(
                    {
                        "document_id": doc.get("id"),
                        "filename": doc.get("filename"),
                        "score": score,
                        "matches": matches,
                        "match_count": len(matches),
                    }
                )

                total_matches += len(matches)
                if matches:
                    total_score += sum(m.get("score", score) for m in matches)
            except Exception as e:
                document_results.append(
                    {
                        "document_id": doc.get("id"),
                        "filename": doc.get("filename"),
                        "error": str(e),
                        "score": 0.0,
                        "matches": [],
                        "match_count": 0,
                    }
                )

        await isaacus_client.close()

        average_score = total_score / total_matches if total_matches > 0 else 0.0

        return {
            "query": query,
            "document_results": document_results,
            "total_matches": total_matches,
            "average_score": average_score,
        }


# Export the tool function
ISAACUS_IQL_TOOL = isaacus_iql
