"""Legal Answer Tool - Extractive QA with precise citations.

Chains Isaacus capabilities optimally:
Embed → Vector Search → Rerank → Extract

Returns exact character positions for precise highlighting.
"""

import asyncio
import os

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class LegalAnswerInput(BaseModel):
    """Input schema for the legal_answer tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    question: str = Field(
        description="The specific question to answer (e.g., 'What is the notice period?')"
    )
    document_ids: list[str] | None = Field(
        default=None,
        description="Optional list of document UUIDs to search. If not provided, searches all documents in the matter.",
    )


class LegalAnswerOutput(BaseModel):
    """Output schema for the legal_answer tool."""

    answer: str = Field(description="The extracted answer text")
    confidence: float = Field(description="Confidence score (0-1)")
    citation: dict = Field(description="Citation with formatted text and permalink")
    found: bool = Field(description="Whether an answer was found")


@tool(parse_docstring=True)
def legal_answer(
    matter_id: str,
    question: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Extract precise answers from legal documents with exact citations.

    Use this tool when users ask specific questions that have definite answers:
    - "What is the notice period?"
    - "Who are the parties to this agreement?"
    - "What is the governing law?"
    - "When does the contract expire?"
    - "What are the payment terms?"

    Returns the exact answer text with character-level positions for
    precise highlighting in the document viewer.

    Args:
        matter_id: The UUID of the matter containing the documents.
        question: The specific question to answer.
        document_ids: Optional list of document UUIDs to search. If provided, only searches these documents. Otherwise searches all documents in the matter.

    Returns:
        Dictionary with answer, confidence, and citation with exact positions.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _legal_answer_async(matter_id, question, document_ids)
    )


async def _legal_answer_async(
    matter_id: str,
    question: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Internal async implementation of legal_answer."""
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not api_key or not supabase_url or not supabase_key:
        return {
            "answer": "Configuration error: Missing API credentials",
            "confidence": 0.0,
            "citation": None,
            "found": False,
            "error": "Missing ISAACUS_API_KEY or Supabase credentials",
        }

    # Log document filter if provided
    if document_ids:
        print(
            f"[LegalAnswer] Filtering to {len(document_ids)} documents: {document_ids[:3]}{'...' if len(document_ids) > 3 else ''}"
        )

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    try:
        # ═══════════════════════════════════════════════════════════════
        # STEP 1: Generate query embedding
        # ═══════════════════════════════════════════════════════════════
        print(f"[LegalAnswer] Embedding question: {question[:50]}...")
        embeddings = await client.embed([question], task="retrieval/query")
        if not embeddings:
            return {
                "answer": "Failed to process question",
                "confidence": 0.0,
                "citation": None,
                "found": False,
            }

        query_embedding = embeddings[0]
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

        # ═══════════════════════════════════════════════════════════════
        # STEP 2: Hybrid search for relevant chunks
        # ═══════════════════════════════════════════════════════════════
        print("[LegalAnswer] Searching for relevant chunks...")

        # Build search parameters
        search_params = {
            "query_embedding": embedding_str,
            "query_text": question,
            "matter_uuid": matter_id,
            "semantic_weight": 0.7,
            "match_threshold": 0.3,
            "match_count": 15,  # Get more for reranking
            "include_context": True,
        }

        # Add document filter if specified
        if document_ids:
            search_params["document_uuids"] = document_ids

        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                f"{supabase_url}/rest/v1/rpc/hybrid_search_chunks",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                },
                json=search_params,
            )

            if response.status_code != 200:
                return {
                    "answer": "Search failed",
                    "confidence": 0.0,
                    "citation": None,
                    "found": False,
                    "error": f"Search error: {response.status_code}",
                }

            chunks = response.json()

        if not chunks:
            return {
                "answer": "No relevant content found in documents",
                "confidence": 0.0,
                "citation": None,
                "found": False,
            }

        print(f"[LegalAnswer] Found {len(chunks)} candidate chunks")
        # Debug: show fields returned by search
        if chunks:
            print(f"[LegalAnswer] Chunk fields: {list(chunks[0].keys())}")

        # ═══════════════════════════════════════════════════════════════
        # STEP 3: Rerank chunks for better relevance
        # ═══════════════════════════════════════════════════════════════
        print("[LegalAnswer] Reranking chunks...")
        chunk_texts = [c.get("content", "") for c in chunks]

        try:
            reranked = await client.rerank(
                query=question,
                documents=chunk_texts,
                top_k=5,
            )

            # Reorder chunks by rerank score
            reranked_chunks = []
            for item in reranked:
                idx = item.get("index", 0)
                if idx < len(chunks):
                    chunk = chunks[idx].copy()
                    chunk["rerank_score"] = item.get("score", 0.0)
                    reranked_chunks.append(chunk)

            chunks = reranked_chunks if reranked_chunks else chunks[:5]
            print(
                f"[LegalAnswer] Top rerank score: {chunks[0].get('rerank_score', 0):.3f}"
            )
        except Exception as e:
            print(f"[LegalAnswer] Reranking failed, using search order: {e}")
            chunks = chunks[:5]

        # ═══════════════════════════════════════════════════════════════
        # STEP 4: Extract answer using Isaacus Extractive QA
        # ═══════════════════════════════════════════════════════════════
        print("[LegalAnswer] Extracting answer...")

        # Build context from top chunks, keeping track of valid ones
        # Filter out empty chunks but maintain index mapping
        valid_chunks = []
        chunk_texts = []
        for chunk in chunks[:3]:
            content = chunk.get("content", "")
            if content.strip():
                valid_chunks.append(chunk)
                chunk_texts.append(content)

        if not chunk_texts:
            return {
                "answer": "No readable content found in relevant documents",
                "confidence": 0.0,
                "citation": None,
                "found": False,
            }

        print(f"[LegalAnswer] Extracting from {len(chunk_texts)} chunks")
        for i, vc in enumerate(valid_chunks):
            print(
                f"  Chunk {i}: chunk_id={vc.get('chunk_id', 'NO_ID')}, doc={vc.get('document_id', 'NO_DOC')[:8]}..."
            )

        # Try extraction on each chunk to find the best answer
        best_answer = None
        best_score = 0.0
        best_chunk = None
        best_positions = None

        try:
            # Use the SDK with correct parameters
            result = await client.extract(
                query=question,
                texts=chunk_texts,
                model="kanon-answer-extractor",
                top_k=1,
                ignore_inextractability=True,  # We've already reranked
            )

            if result and result.get("answer"):
                best_score = result.get("score", 0.5)
                best_answer = result["answer"]
                text_index = result.get("text_index", 0)

                # Map back to original chunk using valid_chunks (same indices as chunk_texts)
                if text_index < len(valid_chunks):
                    best_chunk = valid_chunks[text_index]
                else:
                    best_chunk = valid_chunks[0]

                # Get exact positions from extraction result
                best_positions = {
                    "start": result.get("start", 0),
                    "end": result.get("end", len(result["answer"])),
                }
                print(
                    f"[LegalAnswer] Extracted: '{best_answer[:50]}...' at {best_positions}"
                )
                print(
                    f"[LegalAnswer] From chunk: chunk_id={best_chunk.get('chunk_id', 'NO_ID')}"
                )
        except Exception as e:
            print(f"[LegalAnswer] Extraction failed: {e}")

        if not best_answer or not best_chunk:
            return {
                "answer": "Could not extract a specific answer from the documents",
                "confidence": 0.0,
                "citation": None,
                "found": False,
            }

        # ═══════════════════════════════════════════════════════════════
        # STEP 5: Build precise citation with character positions
        # ═══════════════════════════════════════════════════════════════
        document_id = best_chunk.get("document_id", "")
        chunk_id = best_chunk.get("chunk_id", "")  # Field is 'chunk_id' not 'id'
        filename = best_chunk.get("filename", "Document")
        citation_data = best_chunk.get("citation") or {}

        print("[LegalAnswer] Building citation:")
        print(f"  document_id: {document_id}")
        print(f"  chunk_id: {chunk_id}")
        print(f"  filename: {filename}")

        # Build formatted citation string
        formatted_parts = [filename]
        if citation_data.get("page"):
            formatted_parts.append(f"p.{citation_data['page']}")
        if citation_data.get("section_path"):
            section_path = citation_data["section_path"]
            if section_path:
                formatted_parts.append(f"§ {section_path[-1][:20]}")

        formatted_citation = ", ".join(formatted_parts)

        # Build permalink with exact positions
        # Format: cite:document_id#chunk_id@start-end
        start_pos = best_positions["start"] if best_positions else 0
        end_pos = best_positions["end"] if best_positions else len(best_answer)

        permalink = f"cite:{document_id}#{chunk_id}@{start_pos}-{end_pos}"
        markdown_citation = f"[{formatted_citation}]({permalink})"

        print(f"[LegalAnswer] Found answer with confidence {best_score:.2f}")

        return {
            "answer": best_answer,
            "confidence": best_score,
            "citation": {
                "formatted": formatted_citation,
                "permalink": permalink,
                "markdown": markdown_citation,
                "document_id": document_id,
                "chunk_id": chunk_id,
                "start": start_pos,
                "end": end_pos,
            },
            "found": True,
            "question": question,
            "_usage_hint": f"Use this citation in your response: {markdown_citation}",
        }

    except Exception as e:
        print(f"[LegalAnswer] Error: {e}")
        return {
            "answer": f"Error processing question: {str(e)}",
            "confidence": 0.0,
            "citation": None,
            "found": False,
            "error": str(e),
        }
    finally:
        await client.close()
