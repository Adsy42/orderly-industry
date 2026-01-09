"""Custom HTTP routes for document processing.

These routes provide direct access to document processing functionality
without going through the LangGraph agent conversation flow.
"""

import base64
import logging
from typing import Any

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route

from src.services.structure_extractor import StructureExtractor

logger = logging.getLogger(__name__)


async def extract_structure(request: Request) -> JSONResponse:
    try:
        body = await request.json()

        document_id = body.get("document_id")
        file_content_b64 = body.get("file_content")
        file_type = body.get("file_type")
        use_hi_res = body.get("use_hi_res", True)

        if not document_id:
            return JSONResponse(
                {"success": False, "error": "document_id is required"},
                status_code=400,
            )

        if not file_content_b64:
            return JSONResponse(
                {"success": False, "error": "file_content is required"},
                status_code=400,
            )

        if not file_type:
            return JSONResponse(
                {"success": False, "error": "file_type is required"},
                status_code=400,
            )

        # Decode base64 content
        try:
            file_content = base64.b64decode(file_content_b64)
        except Exception as e:
            return JSONResponse(
                {"success": False, "error": f"Invalid base64 file_content: {e}"},
                status_code=400,
            )

        logger.info(
            f"Extracting structure for document {document_id}, "
            f"type={file_type}, size={len(file_content)} bytes"
        )

        # Run structure extraction
        extractor = StructureExtractor(use_hi_res=use_hi_res)
        result = await extractor.extract(
            document_id=document_id,
            file_content=file_content,
            file_type=file_type,
        )

        if result.error:
            logger.error(f"Structure extraction failed: {result.error}")
            return JSONResponse(
                {
                    "success": False,
                    "document_id": document_id,
                    "error": result.error,
                },
                status_code=500,
            )

        response_data: dict[str, Any] = {
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

        logger.info(
            f"Structure extraction complete: {len(result.sections)} sections, "
            f"{len(result.chunks)} chunks, quality={result.extraction_quality:.2f}"
        )

        return JSONResponse(response_data)

    except Exception as e:
        logger.exception("Unexpected error in structure extraction")
        return JSONResponse(
            {"success": False, "error": str(e)},
            status_code=500,
        )


async def health_check(request: Request) -> JSONResponse:
    return JSONResponse({"status": "ok"})


# Create Starlette app with routes
app = Starlette(
    routes=[
        Route("/invoke/extract_structure", extract_structure, methods=["POST"]),
        Route("/health", health_check, methods=["GET"]),
    ]
)
