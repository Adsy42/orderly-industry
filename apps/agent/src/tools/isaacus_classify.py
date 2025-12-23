"""Isaacus classification tool for identifying legal clause types."""

import os
from typing import List, Optional

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
        description="Optional list of specific document IDs to analyze. If not provided, analyzes all matter documents.",
    )
    clause_types: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific clause types to look for. Defaults to common legal clauses.",
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


async def isaacus_classify(
    matter_id: str,
    document_ids: Optional[List[str]] = None,
    clause_types: Optional[List[str]] = None,
    supabase_client=None,  # Injected by agent context
) -> IsaacusClassifyOutput:
    """
    Identify and classify legal clauses in matter documents.

    This tool uses Isaacus classification models optimized for Australian legal
    documents to identify specific types of clauses (termination, indemnity,
    liability, etc.) and extract them with classifications.

    Args:
        matter_id: The UUID of the matter to analyze.
        document_ids: Optional list of specific document IDs to analyze.
        clause_types: Optional list of clause types to look for. Defaults to
                     common Australian legal clause types.
        supabase_client: Supabase client (injected by agent context).

    Returns:
        IsaacusClassifyOutput with identified clauses and their classifications.

    Example:
        >>> result = await isaacus_classify(
        ...     matter_id="uuid-here",
        ...     clause_types=["Termination", "Indemnity", "Limitation of Liability"]
        ... )
    """
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")

    types_to_search = clause_types or DEFAULT_CLAUSE_TYPES

    if not api_key:
        return IsaacusClassifyOutput(
            clauses=[],
            total_found=0,
            clause_types_searched=types_to_search,
        )

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        if supabase_client is None:
            return IsaacusClassifyOutput(
                clauses=[],
                total_found=0,
                clause_types_searched=types_to_search,
            )

        # Build query for document chunks
        query = (
            supabase_client.from_("document_embeddings")
            .select(
                "id, document_id, chunk_index, chunk_text, documents!inner(filename, matter_id)"
            )
            .eq("documents.matter_id", matter_id)
        )

        if document_ids:
            query = query.in_("document_id", document_ids)

        response = await query.limit(100).execute()

        if not response.data:
            return IsaacusClassifyOutput(
                clauses=[],
                total_found=0,
                clause_types_searched=types_to_search,
            )

        classified_clauses = []

        # Process chunks in batches to classify
        for chunk in response.data:
            chunk_text = chunk["chunk_text"]
            document_id = chunk["document_id"]
            filename = chunk.get("documents", {}).get("filename", "Unknown")

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
                    if classification.get("score", 0) > 0.6:  # Confidence threshold
                        classified_clauses.append(
                            ClassifiedClause(
                                clause_type=classification["label"],
                                confidence=classification["score"],
                                text_excerpt=chunk_text[
                                    :500
                                ],  # Truncate for response size
                                document_id=document_id,
                                filename=filename,
                            )
                        )
                        break  # Only take the top classification per chunk

            except Exception as e:
                print(f"Classification error for chunk: {e}")
                continue

        # Sort by confidence descending
        classified_clauses.sort(key=lambda c: c.confidence, reverse=True)

        return IsaacusClassifyOutput(
            clauses=classified_clauses,
            total_found=len(classified_clauses),
            clause_types_searched=types_to_search,
        )

    except Exception as e:
        print(f"Isaacus classify error: {e}")
        return IsaacusClassifyOutput(
            clauses=[],
            total_found=0,
            clause_types_searched=types_to_search,
        )
    finally:
        await client.close()


# Tool definition for LangGraph
ISAACUS_CLASSIFY_TOOL = {
    "name": "isaacus_classify",
    "description": """
Identify and classify legal clauses in matter documents.
Use this tool to find specific types of clauses like termination, indemnity,
confidentiality, limitation of liability, etc.

Returns a list of identified clauses with their type, confidence, excerpt,
and source document.

Default clause types searched: Termination, Indemnity, Limitation of Liability,
Confidentiality, Non-Compete, Force Majeure, Dispute Resolution, Governing Law,
Assignment, Warranty, Payment Terms, IP, Insurance, Notice, Amendment.
""".strip(),
    "input_schema": IsaacusClassifyInput,
    "func": isaacus_classify,
}
