"""Legal Classify Tool - Find and classify legal clauses with IQL.

Chains Isaacus capabilities optimally:
Embed → Vector Search → IQL (Universal Classification)

Returns exact character positions for precise highlighting.
"""

import asyncio
import os
from typing import List, Optional

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class ClauseMatch(BaseModel):
    """A matched clause with exact position."""

    text: str = Field(description="The exact clause text")
    score: float = Field(description="Confidence score (0-1)")
    citation: dict = Field(description="Citation with exact positions")


class LegalClassifyInput(BaseModel):
    """Input schema for the legal_classify tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    clause_type: str = Field(
        description="Type of clause to find (e.g., 'termination clause', 'indemnity provision')"
    )
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of document UUIDs to search. If not provided, searches all documents.",
    )


class LegalClassifyOutput(BaseModel):
    """Output schema for the legal_classify tool."""

    clause_type: str = Field(description="The type of clause searched for")
    matches: List[ClauseMatch] = Field(description="Found clauses with citations")
    total_found: int = Field(description="Total number of matches")
    searched_documents: int = Field(description="Number of documents searched")


@tool(parse_docstring=True)
def legal_classify(
    matter_id: str,
    clause_type: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Find and classify legal clauses in documents with exact citations.

    Use this tool when users want to find specific types of clauses:
    - "Find termination clauses"
    - "Are there any indemnity provisions?"
    - "Show me confidentiality clauses"
    - "Find force majeure provisions"
    - "What liability limitations are there?"
    - "Find IP assignment clauses"

    Uses Isaacus IQL (Universal Classification) to find clauses matching
    the criteria with exact character positions for precise highlighting.

    Args:
        matter_id: The UUID of the matter containing the documents.
        clause_type: Type of clause to find (e.g., 'termination clause').
        document_ids: Optional list of document UUIDs to search. If not provided, searches all documents in the matter.

    Returns:
        Dictionary with matched clauses and their exact positions.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _legal_classify_async(matter_id, clause_type, document_ids)
    )


async def _legal_classify_async(
    matter_id: str,
    clause_type: str,
    document_ids: list[str] | None = None,
) -> dict:
    """Internal async implementation of legal_classify."""
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not api_key or not supabase_url or not supabase_key:
        return {
            "clause_type": clause_type,
            "matches": [],
            "total_found": 0,
            "searched_documents": 0,
            "error": "Missing API credentials",
        }

    client = IsaacusClient(api_key=api_key, base_url=base_url)

    # Log document filter if provided
    if document_ids:
        print(
            f"[LegalClassify] Filtering to {len(document_ids)} documents: {document_ids[:3]}{'...' if len(document_ids) > 3 else ''}"
        )

    try:
        # ═══════════════════════════════════════════════════════════════
        # STEP 1: Get documents to search
        # ═══════════════════════════════════════════════════════════════
        async with httpx.AsyncClient() as http_client:
            if document_ids:
                # Search specific documents
                print(
                    f"[LegalClassify] Searching {len(document_ids)} specified document(s)"
                )
                doc_ids_filter = ",".join(f'"{did}"' for did in document_ids)
                response = await http_client.get(
                    f"{supabase_url}/rest/v1/documents",
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                    },
                    params={
                        "id": f"in.({doc_ids_filter})",
                        "processing_status": "eq.ready",
                        "select": "id,filename,extracted_text",
                    },
                )
            else:
                # First, do a quick semantic search to find likely documents
                print(f"[LegalClassify] Finding documents with '{clause_type}'...")

                # Generate embedding for clause type
                embeddings = await client.embed([clause_type], task="retrieval/query")
                if embeddings:
                    embedding_str = "[" + ",".join(str(x) for x in embeddings[0]) + "]"

                    # Search for relevant chunks
                    search_response = await http_client.post(
                        f"{supabase_url}/rest/v1/rpc/hybrid_search_chunks",
                        headers={
                            "apikey": supabase_key,
                            "Authorization": f"Bearer {supabase_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "query_embedding": embedding_str,
                            "query_text": clause_type,
                            "matter_uuid": matter_id,
                            "semantic_weight": 0.7,
                            "match_threshold": 0.3,
                            "match_count": 20,
                            "include_context": False,
                        },
                    )

                    if search_response.status_code == 200:
                        chunks = search_response.json()
                        # Get unique document IDs from search results
                        doc_ids = list(
                            set(
                                c.get("document_id")
                                for c in chunks
                                if c.get("document_id")
                            )
                        )

                        if doc_ids:
                            # Fetch those specific documents
                            doc_ids_filter = ",".join(
                                f'"{did}"' for did in doc_ids[:5]
                            )  # Limit to top 5
                            response = await http_client.get(
                                f"{supabase_url}/rest/v1/documents",
                                headers={
                                    "apikey": supabase_key,
                                    "Authorization": f"Bearer {supabase_key}",
                                },
                                params={
                                    "id": f"in.({doc_ids_filter})",
                                    "processing_status": "eq.ready",
                                    "select": "id,filename,extracted_text",
                                },
                            )
                        else:
                            # Fall back to all documents in matter
                            response = await http_client.get(
                                f"{supabase_url}/rest/v1/documents",
                                headers={
                                    "apikey": supabase_key,
                                    "Authorization": f"Bearer {supabase_key}",
                                },
                                params={
                                    "matter_id": f"eq.{matter_id}",
                                    "processing_status": "eq.ready",
                                    "select": "id,filename,extracted_text",
                                },
                            )
                    else:
                        # Fall back to all documents
                        response = await http_client.get(
                            f"{supabase_url}/rest/v1/documents",
                            headers={
                                "apikey": supabase_key,
                                "Authorization": f"Bearer {supabase_key}",
                            },
                            params={
                                "matter_id": f"eq.{matter_id}",
                                "processing_status": "eq.ready",
                                "select": "id,filename,extracted_text",
                            },
                        )
                else:
                    # No embedding, fall back to all documents
                    response = await http_client.get(
                        f"{supabase_url}/rest/v1/documents",
                        headers={
                            "apikey": supabase_key,
                            "Authorization": f"Bearer {supabase_key}",
                        },
                        params={
                            "matter_id": f"eq.{matter_id}",
                            "processing_status": "eq.ready",
                            "select": "id,filename,extracted_text",
                        },
                    )

            if response.status_code != 200:
                return {
                    "clause_type": clause_type,
                    "matches": [],
                    "total_found": 0,
                    "searched_documents": 0,
                    "error": f"Failed to fetch documents: {response.status_code}",
                }

            documents = response.json()

        if not documents:
            return {
                "clause_type": clause_type,
                "matches": [],
                "total_found": 0,
                "searched_documents": 0,
                "message": "No documents found in matter",
            }

        print(f"[LegalClassify] Searching {len(documents)} document(s)")

        # ═══════════════════════════════════════════════════════════════
        # STEP 2: Run IQL on each document
        # ═══════════════════════════════════════════════════════════════
        all_matches = []

        # Build IQL query
        iql_query = f"{{IS {clause_type}}}"
        print(f"[LegalClassify] IQL query: {iql_query}")

        for doc in documents:
            doc_id = doc.get("id", "")
            filename = doc.get("filename", "Document")
            extracted_text = doc.get("extracted_text") or ""

            if not extracted_text.strip():
                continue

            try:
                # Run IQL classification
                result = await client.classify_iql(
                    query=iql_query,
                    text=extracted_text,
                    model="kanon-universal-classifier",
                )

                matches = result.get("matches", [])
                doc_score = result.get("score", 0.0)

                print(
                    f"[LegalClassify] {filename}: score={doc_score:.2f}, matches={len(matches)}"
                )

                for match in matches:
                    match_text = match.get("text", "")
                    start_idx = match.get("start_index", 0)
                    end_idx = match.get("end_index", len(match_text))
                    match_score = match.get("score", doc_score)

                    # Build permalink with exact positions
                    permalink = f"cite:{doc_id}@{start_idx}-{end_idx}"
                    markdown_citation = f"[{filename}]({permalink})"

                    all_matches.append(
                        {
                            "text": match_text,
                            "score": match_score,
                            "citation": {
                                "formatted": filename,
                                "permalink": permalink,
                                "markdown": markdown_citation,
                                "document_id": doc_id,
                                "start": start_idx,
                                "end": end_idx,
                            },
                        }
                    )

            except Exception as e:
                print(f"[LegalClassify] Error on {filename}: {e}")
                continue

        # Sort by score descending
        all_matches.sort(key=lambda x: x["score"], reverse=True)

        # Group matches by document for better context
        matches_by_document = {}
        for match in all_matches:
            doc_id = match["citation"]["document_id"]
            filename = match["citation"]["formatted"]
            if doc_id not in matches_by_document:
                matches_by_document[doc_id] = {
                    "filename": filename,
                    "count": 0,
                    "matches": [],
                }
            matches_by_document[doc_id]["count"] += 1
            matches_by_document[doc_id]["matches"].append(match)

        # Build comprehensive usage hint
        usage_hint = ""
        if all_matches:
            if len(matches_by_document) > 1:
                # Multiple documents - emphasize this
                doc_summary = ", ".join(
                    [
                        f"{info['filename']} ({info['count']})"
                        for info in matches_by_document.values()
                    ]
                )
                usage_hint = f"Found {len(all_matches)} total matches across {len(matches_by_document)} documents: {doc_summary}. List ALL matches grouped by document."
            else:
                # Single document
                usage_hint = f"Found {len(all_matches)} matches in {list(matches_by_document.values())[0]['filename']}. List ALL {len(all_matches)} matches with citations."

        print(
            f"[LegalClassify] Found {len(all_matches)} total matches across {len(matches_by_document)} document(s)"
        )

        return {
            "clause_type": clause_type,
            "matches": all_matches,
            "total_found": len(all_matches),
            "searched_documents": len(documents),
            "matches_by_document": {
                k: {"filename": v["filename"], "count": v["count"]}
                for k, v in matches_by_document.items()
            },
            "_usage_hint": usage_hint,
            "_instruction": f"List ALL {len(all_matches)} matches found. If multiple documents, group by document name.",
        }

    except Exception as e:
        print(f"[LegalClassify] Error: {e}")
        return {
            "clause_type": clause_type,
            "matches": [],
            "total_found": 0,
            "searched_documents": 0,
            "error": str(e),
        }
    finally:
        await client.close()
