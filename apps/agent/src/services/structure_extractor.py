"""Document structure extraction service.

Extracts hierarchical structure from legal documents using the `unstructured`
library. Detects sections, headings, paragraphs, and generates structural
citations for precise legal grounding.
"""

import hashlib
import io
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

from markdownify import markdownify


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
        """Extract structure from a document.

        Args:
            document_id: UUID of the document.
            file_content: Raw bytes of the document.
            file_type: File extension (pdf, docx, txt).

        Returns:
            ExtractionResult with sections, chunks, and normalized markdown.
        """
        try:
            # Import unstructured here to handle import errors gracefully
            from unstructured.partition.auto import partition

            # Determine content type
            content_type = self._get_content_type(file_type)

            # Extract elements with structure preservation
            elements = partition(
                file=io.BytesIO(file_content),
                content_type=content_type,
                strategy="hi_res" if self.use_hi_res else "fast",
                include_page_breaks=True,
                include_metadata=True,
            )

            # Build section tree from elements
            sections = self._build_section_tree(elements)

            # Create chunks with citations
            chunks = self._create_chunks_with_citations(elements, sections)

            # Generate normalized markdown
            normalized_markdown = self._generate_normalized_markdown(elements)

            # Calculate extraction quality
            quality = self._calculate_extraction_quality(elements, sections)

            # Get page count
            page_count = self._get_page_count(elements)

            return ExtractionResult(
                document_id=document_id,
                sections=sections,
                chunks=chunks,
                normalized_markdown=normalized_markdown,
                extraction_quality=quality,
                page_count=page_count,
                error=None,
            )

        except ImportError as e:
            return ExtractionResult(
                document_id=document_id,
                error=f"Missing dependency: {e}. Install with: pip install unstructured",
            )
        except Exception as e:
            return ExtractionResult(
                document_id=document_id,
                error=f"Extraction failed: {str(e)}",
            )

    def _get_content_type(self, file_type: str) -> str:
        """Map file extension to MIME type."""
        content_types = {
            "pdf": "application/pdf",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "doc": "application/msword",
            "txt": "text/plain",
            "rtf": "application/rtf",
        }
        return content_types.get(file_type.lower(), "application/octet-stream")

    def _build_section_tree(self, elements: list[Any]) -> list[SectionData]:
        """Build hierarchical section tree from extracted elements.

        Args:
            elements: List of unstructured elements.

        Returns:
            List of SectionData objects representing the document structure.
        """
        from unstructured.documents.elements import Title

        sections: list[SectionData] = []
        section_stack: list[SectionData] = []  # Stack for tracking hierarchy
        sequence_by_parent: dict[str | None, int] = {}

        for element in elements:
            if isinstance(element, Title):
                title_text = str(element).strip()
                if not title_text:
                    continue

                # Determine section level from element metadata or heading style
                level = self._detect_heading_level(element, title_text)

                # Extract section number if present
                section_number = self._extract_section_number(title_text)

                # Pop sections from stack that are at same or higher level
                while section_stack and section_stack[-1].level >= level:
                    section_stack.pop()

                # Determine parent
                parent_id = section_stack[-1].id if section_stack else None

                # Build path
                path = [s.title or s.section_number or "" for s in section_stack]
                path.append(title_text)

                # Get sequence number for this parent
                seq = sequence_by_parent.get(parent_id, 0)
                sequence_by_parent[parent_id] = seq + 1

                # Get page number
                page = self._get_element_page(element)

                # Create section
                section = SectionData(
                    id=str(uuid.uuid4()),
                    parent_id=parent_id,
                    section_number=section_number,
                    title=title_text,
                    level=level,
                    sequence=seq,
                    path=path,
                    start_page=page,
                    end_page=page,
                    content="",
                )

                sections.append(section)
                section_stack.append(section)

        # Update end_page for each section
        self._update_section_end_pages(sections)

        return sections

    def _detect_heading_level(self, element: Any, title_text: str) -> int:
        """Detect heading level from element metadata or content.

        Args:
            element: Unstructured element.
            title_text: The heading text.

        Returns:
            Heading level (1-6).
        """
        # Try to get from metadata
        metadata = getattr(element, "metadata", None)
        if metadata:
            # Check for category_depth
            depth = getattr(metadata, "category_depth", None)
            if depth is not None:
                return min(max(int(depth), 1), 6)

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

    def _get_element_page(self, element: Any) -> int | None:
        """Get page number from element metadata."""
        metadata = getattr(element, "metadata", None)
        if metadata:
            page = getattr(metadata, "page_number", None)
            if page is not None:
                return int(page)
        return None

    def _update_section_end_pages(self, sections: list[SectionData]) -> None:
        """Update end_page for each section based on subsequent sections."""
        for i, section in enumerate(sections):
            # Find the next section at same or higher level
            for j in range(i + 1, len(sections)):
                if sections[j].level <= section.level:
                    # Previous section's page is our end page
                    if sections[j].start_page:
                        section.end_page = sections[j].start_page
                    break

    def _create_chunks_with_citations(
        self,
        elements: list[Any],
        sections: list[SectionData],
    ) -> list[ChunkData]:
        """Create chunks with structural citations.

        Args:
            elements: List of unstructured elements.
            sections: List of sections for context.

        Returns:
            List of ChunkData objects.
        """
        from unstructured.documents.elements import (
            ListItem,
            NarrativeText,
            Title,
        )

        chunks: list[ChunkData] = []
        current_section: SectionData | None = None
        section_index = 0
        chunk_index = 0
        paragraph_index = 0

        # First, create section-level chunks
        section_chunks: dict[str, ChunkData] = {}
        for section in sections:
            section_chunk = ChunkData(
                id=str(uuid.uuid4()),
                section_id=section.id,
                parent_chunk_id=None,
                chunk_level="section",
                chunk_index=chunk_index,
                content=section.title or "",
                content_hash=self._generate_content_hash(section.title or ""),
                citation={
                    "page": section.start_page,
                    "section_path": section.path,
                    "paragraph_index": None,
                    "heading": section.title,
                    "context_before": None,
                    "context_after": None,
                },
            )
            section_chunks[section.id] = section_chunk
            chunks.append(section_chunk)
            chunk_index += 1

        # Now create paragraph-level chunks
        prev_content: str | None = None

        for element in elements:
            # Update current section when we hit a Title
            if isinstance(element, Title):
                title_text = str(element).strip()
                # Find matching section
                if section_index < len(sections):
                    if sections[section_index].title == title_text:
                        current_section = sections[section_index]
                        section_index += 1
                        paragraph_index = 0
                continue

            # Process paragraph content
            if isinstance(element, (NarrativeText, ListItem)):
                content = str(element).strip()
                if not content:
                    continue

                page = self._get_element_page(element)
                section_path = current_section.path if current_section else []
                heading = current_section.title if current_section else None

                # Get parent chunk (section-level)
                parent_chunk_id = None
                if current_section and current_section.id in section_chunks:
                    parent_chunk_id = section_chunks[current_section.id].id

                # Get context
                context_before = prev_content[-50:] if prev_content else None

                chunk = ChunkData(
                    id=str(uuid.uuid4()),
                    section_id=current_section.id if current_section else None,
                    parent_chunk_id=parent_chunk_id,
                    chunk_level="paragraph",
                    chunk_index=chunk_index,
                    content=content,
                    content_hash=self._generate_content_hash(content),
                    citation={
                        "page": page,
                        "section_path": section_path,
                        "paragraph_index": paragraph_index,
                        "heading": heading,
                        "context_before": context_before,
                        "context_after": None,  # Will be updated in next iteration
                    },
                )

                # Update previous chunk's context_after
                if chunks and chunks[-1].chunk_level == "paragraph":
                    chunks[-1].citation["context_after"] = content[:50]

                chunks.append(chunk)
                chunk_index += 1
                paragraph_index += 1
                prev_content = content

        return chunks

    def _generate_normalized_markdown(self, elements: list[Any]) -> str:
        """Generate clean markdown from extracted elements.

        Args:
            elements: List of unstructured elements.

        Returns:
            Normalized markdown string.
        """
        from unstructured.documents.elements import (
            ListItem,
            NarrativeText,
            Table,
            Title,
        )

        lines: list[str] = []
        current_list: list[str] = []

        for element in elements:
            if isinstance(element, Title):
                # Flush any pending list
                if current_list:
                    lines.extend(current_list)
                    current_list = []
                    lines.append("")

                title_text = str(element).strip()
                level = self._detect_heading_level(element, title_text)
                lines.append(f"{'#' * level} {title_text}")
                lines.append("")

            elif isinstance(element, NarrativeText):
                # Flush any pending list
                if current_list:
                    lines.extend(current_list)
                    current_list = []
                    lines.append("")

                lines.append(str(element).strip())
                lines.append("")

            elif isinstance(element, ListItem):
                current_list.append(f"- {str(element).strip()}")

            elif isinstance(element, Table):
                # Flush any pending list
                if current_list:
                    lines.extend(current_list)
                    current_list = []
                    lines.append("")

                # Try to convert table to markdown
                table_html = getattr(element, "metadata", {})
                if hasattr(table_html, "text_as_html"):
                    md_table = markdownify(table_html.text_as_html)
                    lines.append(md_table)
                else:
                    lines.append(str(element).strip())
                lines.append("")

        # Flush remaining list
        if current_list:
            lines.extend(current_list)

        # Join and clean up
        markdown = "\n".join(lines)

        # Remove excessive blank lines
        markdown = re.sub(r"\n{3,}", "\n\n", markdown)

        return markdown.strip()

    def _calculate_extraction_quality(
        self,
        elements: list[Any],
        sections: list[SectionData],
    ) -> float:
        """Calculate extraction quality score.

        Args:
            elements: List of unstructured elements.
            sections: List of extracted sections.

        Returns:
            Quality score from 0.0 to 1.0.
        """
        if not elements:
            return 0.0

        # Factors affecting quality
        factors: list[float] = []

        # 1. Section detection (0-1)
        section_ratio = len(sections) / max(len(elements) * 0.1, 1)
        factors.append(min(section_ratio, 1.0))

        # 2. Content coverage (0-1)
        total_content = sum(len(str(e)) for e in elements)
        if total_content > 100:
            factors.append(1.0)
        elif total_content > 0:
            factors.append(total_content / 100)
        else:
            factors.append(0.0)

        # 3. Page number detection (0-1)
        pages_detected = sum(
            1 for e in elements if self._get_element_page(e) is not None
        )
        factors.append(pages_detected / max(len(elements), 1))

        # 4. Hierarchy depth (0-1)
        max_level = max((s.level for s in sections), default=0)
        factors.append(min(max_level / 3, 1.0))

        return sum(factors) / len(factors) if factors else 0.0

    def _get_page_count(self, elements: list[Any]) -> int:
        """Get total page count from elements."""
        max_page = 0
        for element in elements:
            page = self._get_element_page(element)
            if page and page > max_page:
                max_page = page
        return max_page

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


