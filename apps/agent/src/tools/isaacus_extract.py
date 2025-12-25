"""Isaacus extractive QA tool with reranking for precise answer extraction.

Enhanced with structural citations in legal format for AI grounding.
"""

import os
import re
from typing import List, Optional

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class Citation(BaseModel):
    """A citation for an extracted answer with legal formatting."""

    document_id: str = Field(description="UUID of the source document")
    chunk_id: str = Field(description="UUID of the specific chunk for permalink")
    filename: str = Field(description="Name of the source file")
    text_excerpt: str = Field(description="The exact text containing the answer")
    position: Optional[str] = Field(
        default=None,
        description="Position indicator (e.g., chunk index)",
    )
    relevance_score: Optional[float] = Field(
        default=None,
        description="Reranking relevance score (0-1)",
    )
    # New structural citation fields
    page: Optional[int] = Field(
        default=None,
        description="Page number in source document",
    )
    section_path: List[str] = Field(
        default_factory=list,
        description="Path through section hierarchy",
    )
    formatted: str = Field(
        default="",
        description="Formatted citation string, e.g., '[Contract.pdf, p.12, § 7.2]'",
    )
    permalink: str = Field(
        default="",
        description="Permalink in cite:document_id#chunk_id format",
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
    answer to a question from legal documents. Results are first reranked
    for relevance before extraction, providing better answer quality.

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
    """Internal async implementation of isaacus_extract with reranking."""
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
        # Step 1: Generate embedding for the question using retrieval/query task
        print(f"[Isaacus Extract] Embedding question: {question[:50]}...")
        embeddings = await client.embed([question], task="retrieval/query")
        if not embeddings:
            return {
                "answer": "Not found in the documents",
                "confidence": 0.0,
                "citations": [],
                "question": question,
                "found": False,
            }

        query_embedding = embeddings[0]

        # Format embedding as string for pgvector
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # Step 2: Hybrid search - try new function first, fallback to legacy
        print("[Isaacus Extract] Performing hybrid search for candidates")
        async with httpx.AsyncClient() as http_client:
            # Try hybrid search function first (new schema with citations)
            response = await http_client.post(
                f"{supabase_url}/rest/v1/rpc/hybrid_search_chunks",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "query_embedding": embedding_str,
                    "query_text": question,
                    "matter_uuid": matter_id,
                    "semantic_weight": 0.7,
                    "match_threshold": 0.3,
                    "match_count": 10,
                    "include_context": True,
                },
            )

            # Fallback to legacy function if hybrid not available
            if response.status_code != 200:
                print("[Isaacus Extract] Hybrid search not available, using legacy")
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
                        "match_threshold": 0.3,
                        "match_count": 10,
                    },
                )

            if response.status_code != 200:
                error_detail = response.text
                print(
                    f"[Isaacus Extract] Supabase error: {response.status_code} - {error_detail}"
                )
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

        print(f"[Isaacus Extract] Found {len(chunks)} candidate chunks")

        # Helper to get chunk text (supports both old and new schema)
        def get_chunk_text(c: dict) -> str:
            return c.get("content") or c.get("chunk_text") or ""

        # Step 3: Rerank chunks by question relevance
        reranked_chunks = chunks
        if len(chunks) > 1:
            try:
                print(f"[Isaacus Extract] Reranking {len(chunks)} chunks")
                rerank_results = await client.rerank(
                    query=question,
                    documents=[get_chunk_text(c) for c in chunks],
                    model="kanon-universal-classifier",
                    top_k=5,  # Get top 5 most relevant
                )

                # Reorder chunks by rerank score
                reranked_chunks = []
                for r in rerank_results:
                    chunk = chunks[r["index"]].copy()
                    chunk["rerank_score"] = r["score"]
                    reranked_chunks.append(chunk)

                print(
                    f"[Isaacus Extract] Top rerank score: {reranked_chunks[0]['rerank_score']:.3f}"
                )
            except Exception as e:
                print(f"[Isaacus Extract] Reranking failed, using vector order: {e}")
                reranked_chunks = chunks[:5]

        # Step 4: Build context from top reranked chunks
        top_chunks = reranked_chunks[:3]  # Use top 3 for extraction
        context = "\n\n---\n\n".join(
            [
                f"[From: {chunk.get('filename', 'Document')}]\n{get_chunk_text(chunk)}"
                for chunk in top_chunks
            ]
        )

        # Step 5: Use Isaacus extract to get the answer
        print("[Isaacus Extract] Extracting answer from context")
        result = await client.extract(question=question, context=context)

        if result and result.get("answer"):
            answer_text = result["answer"]

            # Build citations from the chunks used with legal formatting
            citations = []
            for chunk in top_chunks:
                chunk_text = get_chunk_text(chunk)
                # Check if this chunk contains the answer
                contains_answer = answer_text.lower() in chunk_text.lower()

                # Get citation data (new schema)
                citation_data = chunk.get("citation") or {}
                filename = chunk.get("filename", "Document")
                document_id = chunk.get("document_id", "")
                chunk_id = chunk.get("chunk_id") or chunk.get("id") or ""

                # Format legal-style citation
                formatted_citation = _format_legal_citation(
                    filename=filename,
                    page=citation_data.get("page"),
                    section_path=citation_data.get("section_path") or [],
                )

                # Build permalink: cite:document_id#chunk_id
                permalink = (
                    f"cite:{document_id}#{chunk_id}"
                    if chunk_id
                    else f"cite:{document_id}"
                )

                citations.append(
                    {
                        "document_id": document_id,
                        "chunk_id": chunk_id,
                        "filename": filename,
                        "text_excerpt": chunk_text[:500],
                        "position": f"Chunk {chunk.get('chunk_index', 'N/A')}",
                        "relevance_score": chunk.get("rerank_score"),
                        "page": citation_data.get("page"),
                        "section_path": citation_data.get("section_path") or [],
                        "formatted": formatted_citation,
                        "permalink": permalink,
                    }
                )

                # Prioritize citations that contain the answer
                if contains_answer:
                    # Move to front
                    citations.insert(0, citations.pop())

            print(f"[Isaacus Extract] Found answer with {len(citations)} citation(s)")

            # Include formatted citations in the answer for AI grounding
            primary_citation = citations[0]["formatted"] if citations else ""

            return {
                "answer": answer_text,
                "confidence": result.get("confidence", 0.8),
                "citations": citations,
                "question": question,
                "found": True,
                "primary_citation": primary_citation,
            }

        return {
            "answer": "Not found in the documents",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }

    except Exception as e:
        print(f"[Isaacus Extract] Error: {e}")
        return {
            "answer": f"Error: {e!s}",
            "confidence": 0.0,
            "citations": [],
            "question": question,
            "found": False,
        }
    finally:
        await client.close()


def _format_legal_citation(
    filename: str,
    page: int | None,
    section_path: list[str],
) -> str:
    """Format a citation in legal style: [Document.pdf, p.12, § 7.2]"""
    parts = [filename]

    if page:
        parts.append(f"p.{page}")

    if section_path:
        last_section = section_path[-1] if section_path else ""
        # Extract section number if present
        section_match = re.match(r"^(\d+\.?)+", last_section)
        if section_match:
            parts.append(f"§ {section_match.group(0)}")
        elif last_section:
            # Use first few words of heading
            short_heading = " ".join(last_section.split()[:3])
            parts.append(short_heading)

    return f"[{', '.join(parts)}]"


# Export the tool function directly
ISAACUS_EXTRACT_TOOL = isaacus_extract
