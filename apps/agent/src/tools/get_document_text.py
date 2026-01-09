"""Get full document text tool for direct document access."""

import os

import httpx
from langchain_core.tools import tool
from pydantic import BaseModel, Field


class GetDocumentTextInput(BaseModel):
    """Input schema for the get_document_text tool."""

    matter_id: str = Field(description="UUID of the matter containing the document")
    document_id: str = Field(
        default=None,
        description="UUID of a specific document to retrieve. If not provided, returns the first/only document.",
    )
    filename: str = Field(
        default=None,
        description="Filename to retrieve. Use this if you know the document name but not the ID.",
    )


class GetDocumentTextOutput(BaseModel):
    """Output schema for the get_document_text tool."""

    text: str = Field(description="The full extracted text of the document")
    filename: str = Field(description="Name of the document file")
    document_id: str = Field(description="UUID of the document")
    file_type: str = Field(description="File type (pdf, docx, txt)")
    character_count: int = Field(description="Total characters in the extracted text")
    truncated: bool = Field(
        default=False,
        description="Whether the text was truncated due to length",
    )


@tool(parse_docstring=True)
def get_document_text(
    matter_id: str,
    document_id: str | None = None,
    filename: str | None = None,
    max_length: int = 50000,
) -> dict:
    """Get the full extracted text content of a document.

    Use this tool when you need to read the complete text of a document,
    rather than searching for specific passages. This is useful for:
    - Summarizing an entire document
    - Analyzing document structure
    - Getting an overview before targeted searches
    - Small documents where semantic search is overkill

    Args:
        matter_id: The UUID of the matter containing the document.
        document_id: Optional UUID of the specific document to retrieve.
        filename: Optional filename to retrieve (if document_id not known).
        max_length: Maximum characters to return (default 50000, ~12500 tokens).

    Returns:
        A dictionary with the document text, metadata, and truncation status.
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        _get_document_text_async(matter_id, document_id, filename, max_length)
    )


async def _get_document_text_async(
    matter_id: str,
    document_id: str | None,
    filename: str | None,
    max_length: int,
) -> dict:
    """Internal async implementation."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
        "SUPABASE_ANON_KEY"
    )

    if not supabase_url or not supabase_key:
        return {
            "error": "Supabase credentials not configured",
            "text": "",
            "filename": "",
            "document_id": "",
            "file_type": "",
            "character_count": 0,
            "truncated": False,
        }

    async with httpx.AsyncClient() as client:
        # Build query to get document(s) in the matter
        query_url = f"{supabase_url}/rest/v1/documents"
        params = {
            "matter_id": f"eq.{matter_id}",
            "processing_status": "eq.ready",
            "select": "id,filename,file_type,extracted_text",
        }

        # Filter by document_id or filename if provided
        if document_id:
            params["id"] = f"eq.{document_id}"
        elif filename:
            params["filename"] = f"eq.{filename}"

        # Limit to 1 document
        params["limit"] = "1"

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
                "text": "",
                "filename": "",
                "document_id": "",
                "file_type": "",
                "character_count": 0,
                "truncated": False,
            }

        documents = response.json()

        if not documents:
            # Try to give helpful error message
            hint = ""
            if document_id:
                hint = f"No document with ID '{document_id}' found in matter."
            elif filename:
                hint = f"No document named '{filename}' found in matter."
            else:
                hint = "No ready documents found in this matter."

            return {
                "error": hint,
                "text": "",
                "filename": "",
                "document_id": "",
                "file_type": "",
                "character_count": 0,
                "truncated": False,
                "hint": "Use list_matter_documents to see available documents.",
            }

        doc = documents[0]
        extracted_text = doc.get("extracted_text") or ""

        # Check if text is empty
        if not extracted_text.strip():
            return {
                "error": "Document has no extracted text. It may still be processing or failed extraction.",
                "text": "",
                "filename": doc.get("filename", ""),
                "document_id": doc.get("id", ""),
                "file_type": doc.get("file_type", ""),
                "character_count": 0,
                "truncated": False,
            }

        # Truncate if needed
        truncated = False
        if len(extracted_text) > max_length:
            extracted_text = (
                extracted_text[:max_length] + "\n\n[... text truncated ...]"
            )
            truncated = True

        return {
            "text": extracted_text,
            "filename": doc.get("filename", ""),
            "document_id": doc.get("id", ""),
            "file_type": doc.get("file_type", ""),
            "character_count": len(doc.get("extracted_text") or ""),
            "truncated": truncated,
        }


# Export the tool function
GET_DOCUMENT_TEXT_TOOL = get_document_text


