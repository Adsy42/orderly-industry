"""List matter documents tool for direct metadata queries."""

import asyncio
import os
from typing import List

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field


class DocumentInfo(BaseModel):
    """Information about a single document in a matter."""

    document_id: str = Field(description="UUID of the document")
    filename: str = Field(description="Name of the file")
    file_type: str = Field(description="Type of file (pdf, docx, txt)")
    file_size: int = Field(description="Size of file in bytes")
    processing_status: str = Field(
        description="Status: pending, extracting, embedding, ready, error"
    )
    uploaded_at: str = Field(description="When the document was uploaded")


class ListDocumentsOutput(BaseModel):
    """Output schema for list_matter_documents tool."""

    documents: List[DocumentInfo] = Field(
        default_factory=list,
        description="List of documents in the matter",
    )
    total_count: int = Field(
        default=0,
        description="Total number of documents",
    )
    matter_id: str = Field(description="The matter that was queried")


@tool(parse_docstring=True)
def list_matter_documents(matter_id: str) -> dict:
    """List all documents in a matter with their metadata.

    Use this tool when users ask about what documents exist in a matter,
    such as:
    - "What documents are in this matter?"
    - "Show me the files I've uploaded"
    - "What have I uploaded?"
    - "List all documents"

    This returns document metadata (names, types, status) without searching
    content. For content-based queries, use isaacus_search instead.

    Args:
        matter_id: The UUID of the matter to list documents for.

    Returns:
        A dictionary with document metadata and count.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(_list_matter_documents_async(matter_id))


async def _list_matter_documents_async(matter_id: str) -> dict:
    """Internal async implementation of list_matter_documents."""
    supabase_url = os.getenv("SUPABASE_URL")
    # Service role key bypasses RLS - required for agent access to documents
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    # Prefer service role key as it bypasses RLS
    supabase_key = service_role_key or anon_key

    if not service_role_key:
        print(
            "[list_matter_documents] WARNING: SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key (may fail due to RLS)"
        )

    if not supabase_url or not supabase_key:
        return {
            "documents": [],
            "total_count": 0,
            "matter_id": matter_id,
            "error": "Supabase credentials not configured. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
        }

    try:
        async with httpx.AsyncClient() as http_client:
            # Debug: log the request
            print(
                f"[list_matter_documents] Querying documents for matter_id: {matter_id}"
            )
            print(
                f"[list_matter_documents] Using service role key: {bool(service_role_key)}"
            )

            response = await http_client.get(
                f"{supabase_url}/rest/v1/documents",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={
                    "matter_id": f"eq.{matter_id}",
                    "select": "id,filename,file_type,file_size,processing_status,uploaded_at",
                    "order": "uploaded_at.desc",
                },
            )

            # Debug: log response
            print(f"[list_matter_documents] Response status: {response.status_code}")

            if response.status_code != 200:
                error_detail = response.text
                return {
                    "documents": [],
                    "total_count": 0,
                    "matter_id": matter_id,
                    "error": f"Error fetching documents: {response.status_code} - {error_detail}",
                }

            documents = response.json()

            if not documents:
                # Check if this might be an RLS issue
                if not service_role_key:
                    return {
                        "documents": [],
                        "total_count": 0,
                        "matter_id": matter_id,
                        "message": "No documents found. Note: Using anon key - documents may exist but be hidden by RLS policies. Ensure SUPABASE_SERVICE_ROLE_KEY is set.",
                        "debug": {"using_service_role": False},
                    }
                return {
                    "documents": [],
                    "total_count": 0,
                    "matter_id": matter_id,
                    "message": "No documents have been uploaded to this matter yet.",
                }

            # Format documents for output
            formatted_docs = [
                {
                    "document_id": doc["id"],
                    "filename": doc["filename"],
                    "file_type": doc["file_type"],
                    "file_size": doc["file_size"],
                    "processing_status": doc["processing_status"],
                    "uploaded_at": doc["uploaded_at"],
                }
                for doc in documents
            ]

            # Count documents by status for helpful summary
            ready_count = sum(
                1 for doc in documents if doc["processing_status"] == "ready"
            )
            processing_count = sum(
                1
                for doc in documents
                if doc["processing_status"] in ["pending", "extracting", "embedding"]
            )
            error_count = sum(
                1 for doc in documents if doc["processing_status"] == "error"
            )

            return {
                "documents": formatted_docs,
                "total_count": len(formatted_docs),
                "matter_id": matter_id,
                "summary": {
                    "ready_for_search": ready_count,
                    "still_processing": processing_count,
                    "failed": error_count,
                },
            }

    except Exception as e:
        return {
            "documents": [],
            "total_count": 0,
            "matter_id": matter_id,
            "error": str(e),
        }


# Helper function for use by other tools (like isaacus_search fallback)
async def get_matter_documents_list(matter_id: str) -> list[dict]:
    """Get a simple list of documents for a matter.

    This is a helper function for other tools to use when they need
    to provide fallback information about available documents.

    Args:
        matter_id: The UUID of the matter.

    Returns:
        List of document dictionaries with id, filename, and status.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    # Service role key bypasses RLS - required for agent access
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase_key = service_role_key or os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("[get_matter_documents_list] Missing Supabase credentials")
        return []

    if not service_role_key:
        print(
            "[get_matter_documents_list] WARNING: Using anon key, may fail due to RLS"
        )

    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"{supabase_url}/rest/v1/documents",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                },
                params={
                    "matter_id": f"eq.{matter_id}",
                    "select": "id,filename,processing_status",
                    "order": "uploaded_at.desc",
                },
            )

            if response.status_code == 200:
                docs = response.json()
                print(f"[get_matter_documents_list] Found {len(docs)} documents")
                return docs
            print(f"[get_matter_documents_list] Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"[get_matter_documents_list] Exception: {e}")
        return []


# Export the tool
LIST_MATTER_DOCUMENTS_TOOL = list_matter_documents
