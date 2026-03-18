"""Document structure extraction service.

Extracts hierarchical structure from legal documents using Google Cloud
Vision OCR (primary) with PyMuPDF fallback. Detects sections, headings,
paragraphs, and generates structural citations for precise legal grounding.

Environment variables (pick one):
- GOOGLE_VISION_API_KEY: Simple API key (easiest)
- GOOGLE_APPLICATION_CREDENTIALS_JSON: Service account JSON string
- GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON file
"""

import asyncio
import hashlib
import io
import json
import os
import re
import uuid
from collections import Counter
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SectionData:
    """Represents a section in the document hierarchy."""

    id: str
    parent_id: str | None
    section_number: str | None
    title: str | None
    level: int
    sequence: int
    path: list[str]
    start_page: int | None
    end_page: int | None
    content: str


@dataclass
class ChunkData:
    """Represents a chunk with citation data."""

    id: str
    section_id: str | None
    parent_chunk_id: str | None
    chunk_level: str  # 'section' or 'paragraph'
    chunk_index: int
    content: str
    content_hash: str
    citation: dict[str, Any]


@dataclass
class ExtractionResult:
    """Result of document structure extraction."""

    document_id: str
    sections: list[SectionData] = field(default_factory=list)
    chunks: list[ChunkData] = field(default_factory=list)
    normalized_markdown: str = ""
    extraction_quality: float = 0.0
    page_count: int = 0
    error: str | None = None


class StructureExtractor:
    """Extracts hierarchical structure from documents.

    Priority: Google Cloud Vision OCR > PyMuPDF text extraction > python-docx.
    """

    SECTION_PATTERNS = [
        r"^(\d+\.)+\s*",
        r"^(\d+)\s+",
        r"^§\s*\d+",
        r"^[IVXLCDM]+\.\s*",
        r"^[A-Z]\.\s*",
        r"^Part\s+[IVXLCDM]+",
        r"^Article\s+\d+",
        r"^Section\s+\d+",
        r"^Clause\s+\d+",
    ]

    def __init__(self, use_hi_res: bool = True):
        self.use_hi_res = use_hi_res

    async def extract(
        self,
        document_id: str,
        file_content: bytes,
        file_type: str,
    ) -> ExtractionResult:
        """Extract structure from a document.

        Tries Google Cloud Vision OCR first, falls back to PyMuPDF/python-docx.
        """
        supported_types = ("pdf", "docx", "doc")
        if file_type.lower() not in supported_types:
            return ExtractionResult(
                document_id=document_id,
                error=f"Unsupported file type: {file_type}. Supported: {', '.join(supported_types)}",
            )

        # Try Google Cloud Vision OCR if credentials are available
        if self._has_google_credentials() and file_type.lower() == "pdf":
            try:
                result = await self._extract_with_google_vision(
                    document_id, file_content
                )
                if not result.error:
                    return result
                print(
                    f"[StructureExtractor] Google Vision failed, falling back: {result.error}"
                )
            except Exception as e:
                print(
                    f"[StructureExtractor] Google Vision exception, falling back: {e}"
                )

        # Fallback: PyMuPDF for PDFs, python-docx for DOCX
        if file_type.lower() == "pdf":
            return await self._extract_with_pymupdf(document_id, file_content)
        else:
            return await self._extract_with_docx(document_id, file_content, file_type)

    # ── Google Cloud Vision OCR ──────────────────────────────────────────

    def _has_google_credentials(self) -> bool:
        """Check if Google Cloud credentials are available."""
        return bool(
            os.environ.get("GOOGLE_VISION_API_KEY")
            or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        )

    def _get_google_vision_client(self):
        """Create a Google Cloud Vision client.

        Supports three auth methods (checked in order):
        1. GOOGLE_VISION_API_KEY - simple API key
        2. GOOGLE_APPLICATION_CREDENTIALS_JSON - service account JSON string
        3. GOOGLE_APPLICATION_CREDENTIALS - service account JSON file path
        """
        from google.cloud import vision

        # 1. Simple API key
        api_key = os.environ.get("GOOGLE_VISION_API_KEY")
        if api_key:
            return vision.ImageAnnotatorClient(client_options={"api_key": api_key})

        # 2. Service account JSON string (for cloud deployments)
        creds_json = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if creds_json:
            from google.oauth2 import service_account

            info = json.loads(creds_json)
            credentials = service_account.Credentials.from_service_account_info(info)
            return vision.ImageAnnotatorClient(credentials=credentials)

        # 3. Fall back to GOOGLE_APPLICATION_CREDENTIALS file path
        return vision.ImageAnnotatorClient()

    async def _extract_with_google_vision(
        self,
        document_id: str,
        file_content: bytes,
    ) -> ExtractionResult:
        """Extract text from PDF using Google Cloud Vision OCR."""

        def _do_extract():
            import fitz  # PyMuPDF - used to render PDF pages to images
            from google.cloud import vision

            client = self._get_google_vision_client()
            doc = fitz.open(stream=file_content, filetype="pdf")

            all_blocks: list[dict[str, Any]] = []
            page_count = len(doc)

            for page_num in range(page_count):
                page = doc[page_num]

                # Render page to image at 300 DPI for good OCR quality
                mat = fitz.Matrix(300 / 72, 300 / 72)
                pix = page.get_pixmap(matrix=mat)
                img_bytes = pix.tobytes("png")

                # Send to Google Vision
                image = vision.Image(content=img_bytes)
                response = client.document_text_detection(image=image)

                if response.error.message:
                    return ExtractionResult(
                        document_id=document_id,
                        error=f"Google Vision error on page {page_num + 1}: {response.error.message}",
                    )

                if not response.full_text_annotation:
                    continue

                # Process blocks from the full text annotation
                for gpage in response.full_text_annotation.pages:
                    for block in gpage.blocks:
                        block_text_parts = []
                        for paragraph in block.paragraphs:
                            para_words = []
                            for word in paragraph.words:
                                word_text = "".join(
                                    symbol.text for symbol in word.symbols
                                )
                                para_words.append(word_text)
                            block_text_parts.append(" ".join(para_words))

                        block_text = "\n".join(block_text_parts).strip()
                        if not block_text:
                            continue

                        # Detect font size from bounding box height (approximate)
                        vertices = block.bounding_box.vertices
                        if len(vertices) >= 4:
                            height = abs(vertices[2].y - vertices[0].y)
                            # Normalize to approximate font size (at 300 DPI)
                            approx_size = (
                                height / (300 / 72) / max(1, block_text.count("\n") + 1)
                            )
                        else:
                            approx_size = 12.0

                        all_blocks.append(
                            {
                                "text": block_text,
                                "page": page_num + 1,
                                "size": approx_size,
                                "bold": False,  # Vision API doesn't reliably detect bold
                            }
                        )

            if not all_blocks:
                return ExtractionResult(
                    document_id=document_id,
                    extraction_quality=0.0,
                    page_count=page_count,
                )

            return self._blocks_to_result(
                document_id, all_blocks, page_count, "Google Vision"
            )

        try:
            return await asyncio.to_thread(_do_extract)
        except Exception as e:
            return ExtractionResult(
                document_id=document_id,
                error=f"Google Vision OCR failed: {e}",
            )

    # ── PyMuPDF extraction (fallback for PDFs) ───────────────────────────

    async def _extract_with_pymupdf(
        self,
        document_id: str,
        file_content: bytes,
    ) -> ExtractionResult:
        """Extract structure from a PDF using PyMuPDF text extraction."""

        def _do_extract():
            import fitz

            doc = fitz.open(stream=file_content, filetype="pdf")
            all_blocks: list[dict[str, Any]] = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)[
                    "blocks"
                ]

                for block in blocks:
                    if block.get("type") != 0:
                        continue

                    for line in block.get("lines", []):
                        text_parts = []
                        line_sizes: list[float] = []

                        for span in line.get("spans", []):
                            text = span.get("text", "").strip()
                            if text:
                                text_parts.append(text)
                                line_sizes.append(span.get("size", 12.0))

                        full_text = " ".join(text_parts).strip()
                        if not full_text:
                            continue

                        avg_size = (
                            sum(line_sizes) / len(line_sizes) if line_sizes else 12.0
                        )
                        is_bold = any(
                            "bold" in span.get("font", "").lower()
                            for span in line.get("spans", [])
                        )

                        all_blocks.append(
                            {
                                "text": full_text,
                                "page": page_num + 1,
                                "size": avg_size,
                                "bold": is_bold,
                            }
                        )

            if not all_blocks:
                return ExtractionResult(
                    document_id=document_id,
                    extraction_quality=0.0,
                    page_count=len(doc),
                )

            return self._blocks_to_result(document_id, all_blocks, len(doc), "PyMuPDF")

        try:
            return await asyncio.to_thread(_do_extract)
        except Exception as e:
            return ExtractionResult(
                document_id=document_id,
                error=f"PyMuPDF extraction failed: {e}",
            )

    # ── DOCX extraction ──────────────────────────────────────────────────

    async def _extract_with_docx(
        self,
        document_id: str,
        file_content: bytes,
        file_type: str,
    ) -> ExtractionResult:
        """Extract structure from a DOCX/DOC file using python-docx."""

        def _do_extract():
            from docx import Document as DocxDocument

            doc = DocxDocument(io.BytesIO(file_content))

            sections: list[SectionData] = []
            chunks: list[ChunkData] = []
            markdown_lines: list[str] = []
            section_stack: list[SectionData] = []
            chunk_index = 0
            paragraph_index = 0

            for para in doc.paragraphs:
                text = para.text.strip()
                if not text:
                    continue

                style_name = (para.style.name or "").lower() if para.style else ""

                is_heading = False
                level = 1

                if "heading" in style_name:
                    is_heading = True
                    match = re.search(r"(\d+)", style_name)
                    level = int(match.group(1)) if match else 1
                elif "title" in style_name:
                    is_heading = True
                    level = 1
                elif self._extract_section_number(text) and len(text) < 200:
                    is_heading = True
                    level = self._detect_heading_level(None, text)

                if is_heading:
                    while section_stack and section_stack[-1].level >= level:
                        section_stack.pop()

                    parent_id = section_stack[-1].id if section_stack else None
                    path = [s.title or "" for s in section_stack] + [text]

                    section = SectionData(
                        id=str(uuid.uuid4()),
                        parent_id=parent_id,
                        section_number=self._extract_section_number(text),
                        title=text,
                        level=level,
                        sequence=len(sections),
                        path=path,
                        start_page=None,
                        end_page=None,
                        content="",
                    )
                    sections.append(section)
                    section_stack.append(section)

                    chunks.append(
                        ChunkData(
                            id=str(uuid.uuid4()),
                            section_id=section.id,
                            parent_chunk_id=None,
                            chunk_level="section",
                            chunk_index=chunk_index,
                            content=text,
                            content_hash=self._generate_content_hash(text),
                            citation={
                                "page": None,
                                "section_path": path,
                                "paragraph_index": None,
                                "heading": text,
                                "context_before": None,
                                "context_after": None,
                            },
                        )
                    )
                    chunk_index += 1

                    markdown_lines.append(f"{'#' * level} {text}")
                    markdown_lines.append("")
                else:
                    current_section = section_stack[-1] if section_stack else None
                    section_path = [s.title or "" for s in section_stack]

                    chunks.append(
                        ChunkData(
                            id=str(uuid.uuid4()),
                            section_id=current_section.id if current_section else None,
                            parent_chunk_id=None,
                            chunk_level="paragraph",
                            chunk_index=chunk_index,
                            content=text,
                            content_hash=self._generate_content_hash(text),
                            citation={
                                "page": None,
                                "section_path": section_path,
                                "paragraph_index": paragraph_index,
                                "heading": current_section.title
                                if current_section
                                else None,
                                "context_before": None,
                                "context_after": None,
                            },
                        )
                    )
                    chunk_index += 1
                    paragraph_index += 1

                    markdown_lines.append(text)
                    markdown_lines.append("")

            for table in doc.tables:
                table_md = self._docx_table_to_markdown(table)
                if table_md:
                    markdown_lines.append(table_md)
                    markdown_lines.append("")

            normalized_markdown = "\n".join(markdown_lines).strip()
            quality = 0.85 if sections else 0.65

            print(
                f"[StructureExtractor] DOCX extracted {len(sections)} sections, "
                f"{len(chunks)} chunks"
            )

            return ExtractionResult(
                document_id=document_id,
                sections=sections,
                chunks=chunks,
                normalized_markdown=normalized_markdown,
                extraction_quality=quality,
                page_count=0,
                error=None,
            )

        try:
            return await asyncio.to_thread(_do_extract)
        except Exception as e:
            return ExtractionResult(
                document_id=document_id,
                error=f"DOCX extraction failed: {e}",
            )

    # ── Shared: Convert text blocks to ExtractionResult ──────────────────

    def _blocks_to_result(
        self,
        document_id: str,
        all_blocks: list[dict[str, Any]],
        page_count: int,
        source: str,
    ) -> ExtractionResult:
        """Convert a list of text blocks (with size/page/bold) into sections and chunks."""
        font_sizes = [b["size"] for b in all_blocks]
        size_counts = Counter(round(s, 1) for s in font_sizes)
        body_size = size_counts.most_common(1)[0][0] if size_counts else 12.0

        sections: list[SectionData] = []
        chunks: list[ChunkData] = []
        markdown_lines: list[str] = []
        section_stack: list[SectionData] = []
        chunk_index = 0
        paragraph_index = 0

        for block in all_blocks:
            text = block["text"]
            page = block["page"]
            size = block["size"]
            bold = block["bold"]

            is_heading = False
            level = 1
            size_ratio = size / body_size if body_size > 0 else 1.0

            if size_ratio >= 1.5:
                is_heading = True
                level = 1
            elif size_ratio >= 1.25:
                is_heading = True
                level = 2
            elif size_ratio >= 1.1 and bold:
                is_heading = True
                level = 2
            elif bold and len(text) < 120:
                is_heading = True
                level = 3

            if self._extract_section_number(text) and len(text) < 200:
                is_heading = True
                level = self._detect_heading_level(None, text)

            if is_heading:
                while section_stack and section_stack[-1].level >= level:
                    section_stack.pop()

                parent_id = section_stack[-1].id if section_stack else None
                path = [s.title or "" for s in section_stack] + [text]

                section = SectionData(
                    id=str(uuid.uuid4()),
                    parent_id=parent_id,
                    section_number=self._extract_section_number(text),
                    title=text,
                    level=level,
                    sequence=len(sections),
                    path=path,
                    start_page=page,
                    end_page=page,
                    content="",
                )
                sections.append(section)
                section_stack.append(section)

                chunks.append(
                    ChunkData(
                        id=str(uuid.uuid4()),
                        section_id=section.id,
                        parent_chunk_id=None,
                        chunk_level="section",
                        chunk_index=chunk_index,
                        content=text,
                        content_hash=self._generate_content_hash(text),
                        citation={
                            "page": page,
                            "section_path": path,
                            "paragraph_index": None,
                            "heading": text,
                            "context_before": None,
                            "context_after": None,
                        },
                    )
                )
                chunk_index += 1
                markdown_lines.append(f"{'#' * level} {text}")
                markdown_lines.append("")
            else:
                current_section = section_stack[-1] if section_stack else None
                section_path = [s.title or "" for s in section_stack]

                chunks.append(
                    ChunkData(
                        id=str(uuid.uuid4()),
                        section_id=current_section.id if current_section else None,
                        parent_chunk_id=None,
                        chunk_level="paragraph",
                        chunk_index=chunk_index,
                        content=text,
                        content_hash=self._generate_content_hash(text),
                        citation={
                            "page": page,
                            "section_path": section_path,
                            "paragraph_index": paragraph_index,
                            "heading": current_section.title
                            if current_section
                            else None,
                            "context_before": None,
                            "context_after": None,
                        },
                    )
                )
                chunk_index += 1
                paragraph_index += 1
                markdown_lines.append(text)
                markdown_lines.append("")

        normalized_markdown = "\n".join(markdown_lines).strip()
        quality = (
            0.9
            if (source == "Google Vision" and sections)
            else (0.85 if sections else 0.65)
        )

        print(
            f"[StructureExtractor] {source} extracted {len(sections)} sections, "
            f"{len(chunks)} chunks from {page_count} pages"
        )

        return ExtractionResult(
            document_id=document_id,
            sections=sections,
            chunks=chunks,
            normalized_markdown=normalized_markdown,
            extraction_quality=quality,
            page_count=page_count,
            error=None,
        )

    # ── Helpers ───────────────────────────────────────────────────────────

    def _docx_table_to_markdown(self, table: Any) -> str:
        rows = table.rows
        if not rows:
            return ""
        lines = []
        for i, row in enumerate(rows):
            cells = [cell.text.strip() for cell in row.cells]
            line = "| " + " | ".join(cells) + " |"
            lines.append(line)
            if i == 0:
                lines.append("| " + " | ".join(["---"] * len(cells)) + " |")
        return "\n".join(lines)

    def _detect_heading_level(self, element: Any, title_text: str) -> int:
        if re.match(r"^\d+\.\d+\.\d+", title_text):
            return 3
        elif re.match(r"^\d+\.\d+", title_text):
            return 2
        elif re.match(r"^\d+\s", title_text):
            return 1
        elif re.match(r"^[A-Z]\.", title_text):
            return 2
        elif re.match(r"^[ivxIVX]+\.", title_text):
            return 3
        return 1

    def _extract_section_number(self, title_text: str) -> str | None:
        for pattern in self.SECTION_PATTERNS:
            match = re.match(pattern, title_text)
            if match:
                return match.group(0).strip()
        return None

    def _generate_content_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()


def generate_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()


def verify_content_hash(content: str, stored_hash: str) -> bool:
    return generate_content_hash(content) == stored_hash
