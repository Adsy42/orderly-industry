"""Isaacus extractive QA tool for precise answer extraction with citations."""

import os
from typing import List, Optional

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class Citation(BaseModel):
    """A citation for an extracted answer."""

    document_id: str = Field(description="UUID of the source document")
    filename: str = Field(description="Name of the source file")
    text_excerpt: str = Field(description="The exact text containing the answer")
    position: Optional[str] = Field(
        default=None,
        description="Position indicator (e.g., chunk index)",
    )


class IsaacusExtractInput(BaseModel):
    """Input schema for the isaacus_extract tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    question: str = Field(description="The specific question to answer")
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific document IDs to search.",
    )


class IsaacusExtractOutput(BaseModel):
    """Output schema for the isaacus_extract tool."""

    answer: str = Field(
        description="The extracted answer or 'Not found' if no answer could be extracted"
    )
    confidence: float = Field(
        default=0.0,
        description="Confidence score for the answer (0-1)",
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Citations for where the answer was found",
    )
    question: str = Field(description="The original question")
    found: bool = Field(
        default=False,
        description="Whether an answer was found in the documents",
    )


@tool(parse_docstring=True)
def isaacus_extract(
    matter_id: str,
    question: str,
) -> dict:
    """Extract a precise answer from matter documents with citations.

    This tool uses Isaacus extractive QA models to find and extract the exact
    answer to a question from legal documents, along with citations showing
    where the answer was found.

    Args:
        matter_id: The UUID of the matter to search within.
        question: A specific question to answer from the documents.

    Returns:
        A dictionary with the answer, confidence score, and citations.
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(_isaacus_extract_async(matter_id, question))


async def _isaacus_extract_async(
    matter_id: str,
    question: str,
) -> dict:
    """Internal async implementation of isaacus_extract."""
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not api_key:
        return {
            "answer": "Unable to process: ISAACUS_API_KEY not configured",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }

    if not supabase_url or not supabase_key:
        return {
            "answer": "Unable to process: Supabase not configured",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        # First, perform a semantic search to find relevant chunks
        embeddings = await client.embed([question])
        if not embeddings:
            return {
                "answer": "Not found in the documents",
                "confidence": 0.0,
                "citations": [],
                "question": question,
                "found": False,
            }

        query_embedding = embeddings[0]

        # Get relevant chunks from the database
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
                    "match_threshold": 0.5,
                    "match_count": 10,
                },
            )

            if response.status_code != 200:
                return {
                    "answer": "Error querying documents",
                    "confidence": 0.0,
                    "citations": [],
                    "question": question,
                    "found": False,
                }

            chunks = response.json()

        if not chunks:
            return {
                "answer": "Not found in the documents",
                "confidence": 0.0,
                "citations": [],
                "question": question,
                "found": False,
            }

        # Combine relevant chunks into context
        context = "\n\n---\n\n".join(
            [
                f"[From: {chunk['filename']}]\n{chunk['chunk_text']}"
                for chunk in chunks[:5]  # Limit context size
            ]
        )

        # Use Isaacus extract to get the answer
        result = await client.extract(question=question, context=context)

        if result and result.get("answer"):
            answer_text = result["answer"]
            citations = []

            for chunk in chunks[:5]:
                if answer_text.lower() in chunk["chunk_text"].lower():
                    citations.append(
                        {
                            "document_id": chunk["document_id"],
                            "filename": chunk["filename"],
                            "text_excerpt": chunk["chunk_text"][:500],
                            "position": f"Chunk {chunk.get('chunk_index', 'N/A')}",
                        }
                    )

            # If no exact match, cite the top result
            if not citations and chunks:
                citations.append(
                    {
                        "document_id": chunks[0]["document_id"],
                        "filename": chunks[0]["filename"],
                        "text_excerpt": chunks[0]["chunk_text"][:500],
                        "position": f"Chunk {chunks[0].get('chunk_index', 'N/A')}",
                    }
                )

            return {
                "answer": answer_text,
                "confidence": result.get("confidence", 0.8),
                "citations": citations,
                "question": question,
                "found": True,
            }

        return {
            "answer": "Not found in the documents",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }

    except Exception as e:
        print(f"Isaacus extract error: {e}")
        return {
            "answer": f"Error: {e!s}",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }
    finally:
        await client.close()


# Export the tool function directly
ISAACUS_EXTRACT_TOOL = isaacus_extract
