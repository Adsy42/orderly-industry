"""Document structure extraction service.

Extracts hierarchical structure from legal documents using Azure Document
Intelligence. Detects sections, headings, paragraphs, and generates structural
citations for precise legal grounding.

Requires environment variables:
- AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
- AZURE_DOCUMENT_INTELLIGENCE_KEY
"""

import asyncio
import hashlib
import os
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

# Timeout for Azure Document Intelligence API calls (seconds)
AZURE_TIMEOUT_SECONDS = 120


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

    Uses the `unstructured` library for structure-preserving extraction
    from PDF, DOCX, and other document formats.
    """

    # Regex patterns for section numbering
    SECTION_PATTERNS = [
        r"^(\d+\.)+\s*",  # 1.2.3 style
        r"^(\d+)\s+",  # 1 style
        r"^§\s*\d+",  # § 512 style
        r"^[IVXLCDM]+\.\s*",  # Roman numerals (I. II. III.)
        r"^[A-Z]\.\s*",  # Letter sections (A. B. C.)
        r"^Part\s+[IVXLCDM]+",  # Part I, Part II
        r"^Article\s+\d+",  # Article 1, Article 2
        r"^Section\s+\d+",  # Section 1, Section 2
        r"^Clause\s+\d+",  # Clause 1, Clause 2
    ]

    def __init__(self, use_hi_res: bool = True):
        """Initialize the structure extractor.

        Args:
            use_hi_res: Whether to use high-resolution extraction strategy.
        """
        self.use_hi_res = use_hi_res

    async def extract(
        self,
        document_id: str,
        file_content: bytes,
        file_type: str,
    ) -> ExtractionResult:
        """Extract structure from a document using Azure Document Intelligence.

        Args:
            document_id: UUID of the document.
            file_content: Raw bytes of the document.
            file_type: File extension (pdf, docx, doc).

        Returns:
            ExtractionResult with sections, chunks, and normalized markdown.

        Raises:
            ValueError: If Azure credentials are not configured or file type unsupported.
        """
        # Validate file type
        supported_types = ("pdf", "docx", "doc")
        if file_type.lower() not in supported_types:
            return ExtractionResult(
                document_id=document_id,
                error=f"Unsupported file type: {file_type}. Supported: {', '.join(supported_types)}",
            )

        # Get Azure credentials at call time (not module load)
        azure_endpoint = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
        azure_key = os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_KEY")

        if not azure_endpoint or not azure_key:
            return ExtractionResult(
                document_id=document_id,
                error="Azure Document Intelligence not configured. Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY environment variables.",
            )

        return await self._extract_with_azure(document_id, file_content, file_type, azure_endpoint, azure_key)

    async def _extract_with_azure(
        self,
        document_id: str,
        file_content: bytes,
        file_type: str,
        azure_endpoint: str,
        azure_key: str,
    ) -> ExtractionResult:
        """Extract using Azure Document Intelligence.

        Args:
            document_id: UUID of the document.
            file_content: Raw bytes of the document.
            file_type: File extension.
            azure_endpoint: Azure Document Intelligence endpoint URL.
            azure_key: Azure Document Intelligence API key.

        Returns:
            ExtractionResult with sections, chunks, and normalized markdown.
        """
        from azure.ai.documentintelligence import DocumentIntelligenceClient
        from azure.ai.documentintelligence.models import AnalyzeDocumentRequest
        from azure.core.credentials import AzureKeyCredential

        print(f"[StructureExtractor] Using Azure Document Intelligence for {file_type}")

        client = DocumentIntelligenceClient(
            endpoint=azure_endpoint,
            credential=AzureKeyCredential(azure_key),
        )

        # Analyze document with prebuilt-layout model (best for structure)
        # Run in thread to avoid blocking the event loop
        def _analyze():
            poller = client.begin_analyze_document(
                "prebuilt-layout",
                AnalyzeDocumentRequest(bytes_source=file_content),
            )
            return poller.result()

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(_analyze),
                timeout=AZURE_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            return ExtractionResult(
                document_id=document_id,
                error=f"Azure Document Intelligence timed out after {AZURE_TIMEOUT_SECONDS} seconds",
            )

        # Extract sections from paragraphs with roles
        sections: list[SectionData] = []
        chunks: list[ChunkData] = []
        markdown_lines: list[str] = []

        section_stack: list[SectionData] = []
        chunk_index = 0
        paragraph_index = 0

        # Process paragraphs
        if result.paragraphs:
            for para in result.paragraphs:
                role = para.role if hasattr(para, "role") else None
                content = para.content.strip() if para.content else ""

                if not content:
                    continue

                # Get page number
                page = None
                if para.bounding_regions and len(para.bounding_regions) > 0:
                    page = para.bounding_regions[0].page_number

                # Check if this is a heading/title
                if role in ("title", "sectionHeading", "heading"):
                    # Determine level
                    level = 1
                    if role == "sectionHeading":
                        level = self._detect_heading_level(None, content)

                    # Pop sections at same or higher level
                    while section_stack and section_stack[-1].level >= level:
                        section_stack.pop()

                    parent_id = section_stack[-1].id if section_stack else None
                    path = [s.title or "" for s in section_stack] + [content]

                    section = SectionData(
                        id=str(uuid.uuid4()),
                        parent_id=parent_id,
                        section_number=self._extract_section_number(content),
                        title=content,
                        level=level,
                        sequence=len(sections),
                        path=path,
                        start_page=page,
                        end_page=page,
                        content="",
                    )
                    sections.append(section)
                    section_stack.append(section)

                    # Add section chunk
                    chunks.append(ChunkData(
                        id=str(uuid.uuid4()),
                        section_id=section.id,
                        parent_chunk_id=None,
                        chunk_level="section",
                        chunk_index=chunk_index,
                        content=content,
                        content_hash=self._generate_content_hash(content),
                        citation={
                            "page": page,
                            "section_path": path,
                            "paragraph_index": None,
                            "heading": content,
                            "context_before": None,
                            "context_after": None,
                        },
                    ))
                    chunk_index += 1

                    markdown_lines.append(f"{'#' * level} {content}")
                    markdown_lines.append("")
                else:
                    # Regular paragraph
                    current_section = section_stack[-1] if section_stack else None
                    section_path = [s.title or "" for s in section_stack]

                    chunks.append(ChunkData(
                        id=str(uuid.uuid4()),
                        section_id=current_section.id if current_section else None,
                        parent_chunk_id=None,
                        chunk_level="paragraph",
                        chunk_index=chunk_index,
                        content=content,
                        content_hash=self._generate_content_hash(content),
                        citation={
                            "page": page,
                            "section_path": section_path,
                            "paragraph_index": paragraph_index,
                            "heading": current_section.title if current_section else None,
                            "context_before": None,
                            "context_after": None,
                        },
                    ))
                    chunk_index += 1
                    paragraph_index += 1

                    markdown_lines.append(content)
                    markdown_lines.append("")

        # Process tables
        if result.tables:
            for table in result.tables:
                table_md = self._azure_table_to_markdown(table)
                markdown_lines.append(table_md)
                markdown_lines.append("")

        normalized_markdown = "\n".join(markdown_lines).strip()
        page_count = result.pages[-1].page_number if result.pages else 0

        # Calculate quality (Azure generally produces high-quality results)
        quality = 0.9 if sections else 0.7

        print(f"[StructureExtractor] Azure extracted {len(sections)} sections, {len(chunks)} chunks")

        return ExtractionResult(
            document_id=document_id,
            sections=sections,
            chunks=chunks,
            normalized_markdown=normalized_markdown,
            extraction_quality=quality,
            page_count=page_count,
            error=None,
        )

    def _azure_table_to_markdown(self, table: Any) -> str:
        """Convert Azure table to markdown format."""
        if not table.cells:
            return ""

        # Find table dimensions
        max_row = max(cell.row_index for cell in table.cells) + 1
        max_col = max(cell.column_index for cell in table.cells) + 1

        # Create grid
        grid = [["" for _ in range(max_col)] for _ in range(max_row)]

        for cell in table.cells:
            content = cell.content.strip() if cell.content else ""
            grid[cell.row_index][cell.column_index] = content

        # Build markdown table
        lines = []
        for i, row in enumerate(grid):
            line = "| " + " | ".join(row) + " |"
            lines.append(line)
            if i == 0:
                # Add separator after header
                lines.append("| " + " | ".join(["---"] * max_col) + " |")

        return "\n".join(lines)

    def _detect_heading_level(self, element: Any, title_text: str) -> int:
        """Detect heading level from content patterns.

        Args:
            element: Element (unused, kept for API compatibility).
            title_text: The heading text.

        Returns:
            Heading level (1-6).
        """
        # Infer from section number pattern
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

        # Default to level 1
        return 1

    def _extract_section_number(self, title_text: str) -> str | None:
        """Extract section number from heading text.

        Args:
            title_text: The heading text.

        Returns:
            Section number or None.
        """
        for pattern in self.SECTION_PATTERNS:
            match = re.match(pattern, title_text)
            if match:
                return match.group(0).strip()
        return None

    def _generate_content_hash(self, content: str) -> str:
        """Generate SHA-256 hash for content verification."""
        return hashlib.sha256(content.encode()).hexdigest()


def generate_content_hash(content: str) -> str:
    """Generate SHA-256 hash for content verification.

    Args:
        content: Text content to hash.

    Returns:
        SHA-256 hex digest.
    """
    return hashlib.sha256(content.encode()).hexdigest()


def verify_content_hash(content: str, stored_hash: str) -> bool:
    """Verify content matches stored hash.

    Args:
        content: Current text content.
        stored_hash: Previously stored hash.

    Returns:
        True if hashes match.
    """
    return generate_content_hash(content) == stored_hash


