"""Isaacus classification tool for identifying legal clause types."""

import os
from typing import List, Optional

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient

# Default Australian legal clause types
DEFAULT_CLAUSE_TYPES = [
    "Termination",
    "Indemnity",
    "Limitation of Liability",
    "Confidentiality",
    "Non-Compete",
    "Force Majeure",
    "Dispute Resolution",
    "Governing Law",
    "Assignment",
    "Warranty",
    "Payment Terms",
    "Intellectual Property",
    "Insurance",
    "Notice",
    "Amendment",
]


class ClassifiedClause(BaseModel):
    """A classified clause from a document."""

    clause_type: str = Field(description="The type/category of the clause")
    confidence: float = Field(description="Classification confidence (0-1)")
    text_excerpt: str = Field(description="The clause text")
    document_id: str = Field(description="UUID of the source document")
    filename: str = Field(description="Name of the source file")


class IsaacusClassifyInput(BaseModel):
    """Input schema for the isaacus_classify tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific document IDs to analyze.",
    )
    clause_types: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific clause types to look for.",
    )


class IsaacusClassifyOutput(BaseModel):
    """Output schema for the isaacus_classify tool."""

    clauses: List[ClassifiedClause] = Field(
        default_factory=list,
        description="List of identified and classified clauses",
    )
    total_found: int = Field(
        default=0,
        description="Total number of clauses identified",
    )
    clause_types_searched: List[str] = Field(
        default_factory=list,
        description="The clause types that were searched for",
    )


@tool(parse_docstring=True)
def isaacus_classify(
    matter_id: str,
    clause_types: Optional[str] = None,
) -> dict:
    """Identify and classify legal clauses in matter documents.

    This tool uses Isaacus classification models optimized for Australian legal
    documents to identify specific types of clauses (termination, indemnity,
    liability, etc.) and extract them with classifications.

    Args:
        matter_id: The UUID of the matter to analyze.
        clause_types: Comma-separated list of clause types to look for. Defaults to common legal clauses.

    Returns:
        A dictionary with identified clauses and their classifications.
    """
    import asyncio

    # Parse clause types from comma-separated string
    types_list = None
    if clause_types:
        types_list = [t.strip() for t in clause_types.split(",")]

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(_isaacus_classify_async(matter_id, types_list))


async def _isaacus_classify_async(
    matter_id: str,
    clause_types: Optional[List[str]] = None,
) -> dict:
    """Internal async implementation of isaacus_classify."""
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    types_to_search = clause_types or DEFAULT_CLAUSE_TYPES

    if not api_key:
        return {
            "clauses": [],
            "total_found": 0,
            "clause_types_searched": types_to_search,
            "error": "ISAACUS_API_KEY not configured",
        }

    if not supabase_url or not supabase_key:
        return {
            "clauses": [],
            "total_found": 0,
            "clause_types_searched": types_to_search,
            "error": "Supabase not configured",
        }

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        # Get document chunks from Supabase
        async with httpx.AsyncClient() as http_client:
            # Get documents for the matter first
            docs_response = await http_client.get(
                f"{supabase_url}/rest/v1/documents",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={"matter_id": f"eq.{matter_id}", "select": "id,filename"},
            )

            if docs_response.status_code != 200:
                return {
                    "clauses": [],
                    "total_found": 0,
                    "clause_types_searched": types_to_search,
                    "error": "Error fetching documents",
                }

            documents = docs_response.json()
            if not documents:
                return {
                    "clauses": [],
                    "total_found": 0,
                    "clause_types_searched": types_to_search,
                }

            doc_ids = [d["id"] for d in documents]
            doc_map = {d["id"]: d["filename"] for d in documents}

            # Get chunks for these documents
            chunks_response = await http_client.get(
                f"{supabase_url}/rest/v1/document_embeddings",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={
                    "document_id": f"in.({','.join(doc_ids)})",
                    "select": "id,document_id,chunk_index,chunk_text",
                    "limit": "100",
                },
            )

            if chunks_response.status_code != 200:
                return {
                    "clauses": [],
                    "total_found": 0,
                    "clause_types_searched": types_to_search,
                    "error": "Error fetching document chunks",
                }

            chunks = chunks_response.json()

        if not chunks:
            return {
                "clauses": [],
                "total_found": 0,
                "clause_types_searched": types_to_search,
            }

        classified_clauses = []

        # Process chunks to classify
        for chunk in chunks:
            chunk_text = chunk["chunk_text"]
            document_id = chunk["document_id"]
            filename = doc_map.get(document_id, "Unknown")

            # Skip very short chunks
            if len(chunk_text) < 50:
                continue

            # Classify this chunk against our clause types
            try:
                classifications = await client.classify(
                    text=chunk_text,
                    labels=types_to_search,
                )

                # Find the best matching classification above threshold
                for classification in classifications:
                    if classification.get("score", 0) > 0.6:
                        classified_clauses.append(
                            {
                                "clause_type": classification["label"],
                                "confidence": classification["score"],
                                "text_excerpt": chunk_text[:500],
                                "document_id": document_id,
                                "filename": filename,
                            }
                        )
                        break

            except Exception as e:
                print(f"Classification error for chunk: {e}")
                continue

        # Sort by confidence descending
        classified_clauses.sort(key=lambda c: c["confidence"], reverse=True)

        return {
            "clauses": classified_clauses,
            "total_found": len(classified_clauses),
            "clause_types_searched": types_to_search,
        }

    except Exception as e:
        print(f"Isaacus classify error: {e}")
        return {
            "clauses": [],
            "total_found": 0,
            "clause_types_searched": types_to_search,
            "error": str(e),
        }
    finally:
        await client.close()


# Export the tool function directly
ISAACUS_CLASSIFY_TOOL = isaacus_classify
