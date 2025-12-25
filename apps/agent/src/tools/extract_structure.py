"""Agent tool for extracting document structure.

This tool extracts hierarchical structure from legal documents,
including sections, headings, and generates structural citations.
"""

import logging
from typing import Annotated, Any

from langchain_core.tools import tool
from pydantic import Field

from ..services.structure_extractor import StructureExtractor

logger = logging.getLogger(__name__)


@tool(parse_docstring=True)
async def extract_document_structure(
    document_id: Annotated[str, Field(description="UUID of the document to process")],
    file_content: Annotated[bytes, Field(description="Raw bytes of the document file")],
    file_type: Annotated[str, Field(description="File extension (pdf, docx, txt)")],
    use_hi_res: Annotated[
        bool, Field(description="Use high-resolution extraction")
    ] = True,
) -> dict[str, Any]:
    """Extract hierarchical structure from a legal document.

    Analyzes the document to detect sections, headings, and paragraphs.
    Creates structural citations for precise legal grounding.

    Args:
        document_id: UUID of the document to process.
        file_content: Raw bytes of the document file.
        file_type: File extension (pdf, docx, txt).
        use_hi_res: Use high-resolution extraction for better accuracy.

    Returns:
        Dictionary containing:
        - success: Whether extraction succeeded
        - document_id: The document UUID
        - sections: List of hierarchical sections
        - chunks: List of chunks with citations
        - normalized_markdown: Clean markdown for LLM context
        - extraction_quality: Quality score (0-1)
        - page_count: Total pages detected
        - error: Error message if failed
    """
    try:
        extractor = StructureExtractor(use_hi_res=use_hi_res)
        result = await extractor.extract(
            document_id=document_id,
            file_content=file_content,
            file_type=file_type,
        )

        if result.error:
            logger.error(
                f"Structure extraction failed for {document_id}: {result.error}"
            )
            return {
                "success": False,
                "document_id": document_id,
                "error": result.error,
            }

        return {
            "success": True,
            "document_id": document_id,
            "sections": [
                {
                    "id": s.id,
                    "parent_id": s.parent_id,
                    "section_number": s.section_number,
                    "title": s.title,
                    "level": s.level,
                    "sequence": s.sequence,
                    "path": s.path,
                    "start_page": s.start_page,
                    "end_page": s.end_page,
                }
                for s in result.sections
            ],
            "chunks": [
                {
                    "id": c.id,
                    "section_id": c.section_id,
                    "parent_chunk_id": c.parent_chunk_id,
                    "chunk_level": c.chunk_level,
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "content_hash": c.content_hash,
                    "citation": c.citation,
                }
                for c in result.chunks
            ],
            "normalized_markdown": result.normalized_markdown,
            "extraction_quality": result.extraction_quality,
            "page_count": result.page_count,
            "error": None,
        }

    except Exception as e:
        logger.exception(f"Unexpected error extracting structure for {document_id}")
        return {
            "success": False,
            "document_id": document_id,
            "error": str(e),
        }
