"""Document text extraction service.

Extracts text from PDF, DOCX, and TXT files for indexing and search.
"""

import io
from pathlib import Path


class DocumentProcessor:
    """Extract text from various document formats."""

    SUPPORTED_TYPES = {"pdf", "docx", "txt"}
    # Target chunk size in characters (approximately 500 tokens)
    DEFAULT_CHUNK_SIZE = 2000
    # Overlap between chunks for context continuity
    DEFAULT_CHUNK_OVERLAP = 200

    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ):
        """Initialize the document processor.

        Args:
            chunk_size: Target size for text chunks in characters.
            chunk_overlap: Overlap between chunks in characters.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def extract_text(self, file_content: bytes, file_type: str) -> str:
        """Extract text from document content.

        Args:
            file_content: Raw bytes of the document file.
            file_type: File type (pdf, docx, txt).

        Returns:
            Extracted text content.

        Raises:
            ValueError: If file type is not supported.
        """
        file_type = file_type.lower().strip(".")
        if file_type not in self.SUPPORTED_TYPES:
            raise ValueError(
                f"Unsupported file type: {file_type}. "
                f"Supported types: {', '.join(self.SUPPORTED_TYPES)}"
            )

        if file_type == "pdf":
            return self._extract_pdf(file_content)
        elif file_type == "docx":
            return self._extract_docx(file_content)
        else:  # txt
            return self._extract_txt(file_content)

    def extract_text_from_file(self, file_path: str | Path) -> str:
        """Extract text from a file path.

        Args:
            file_path: Path to the document file.

        Returns:
            Extracted text content.
        """
        path = Path(file_path)
        file_type = path.suffix.lower().strip(".")
        with open(path, "rb") as f:
            return self.extract_text(f.read(), file_type)

    def _extract_pdf(self, content: bytes) -> str:
        """Extract text from PDF content.

        Args:
            content: Raw PDF bytes.

        Returns:
            Extracted text.
        """
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages)

    def _extract_docx(self, content: bytes) -> str:
        """Extract text from DOCX content.

        Args:
            content: Raw DOCX bytes.

        Returns:
            Extracted text.
        """
        from docx import Document

        doc = Document(io.BytesIO(content))
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        return "\n\n".join(paragraphs)

    def _extract_txt(self, content: bytes) -> str:
        """Extract text from TXT content.

        Args:
            content: Raw text bytes.

        Returns:
            Decoded text.
        """
        # Try UTF-8 first, fall back to latin-1
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")

    def chunk_text(self, text: str) -> list[str]:
        """Split text into overlapping chunks for embedding.

        Attempts to split on paragraph boundaries when possible.

        Args:
            text: Full document text.

        Returns:
            List of text chunks.
        """
        if not text or not text.strip():
            return []

        # If text is smaller than chunk size, return as single chunk
        if len(text) <= self.chunk_size:
            return [text.strip()]

        chunks: list[str] = []
        paragraphs = text.split("\n\n")
        current_chunk: list[str] = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_length = len(para)

            # If single paragraph exceeds chunk size, split it
            if para_length > self.chunk_size:
                # Save current chunk if any
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = []
                    current_length = 0

                # Split long paragraph into smaller chunks
                chunks.extend(self._split_long_text(para))
                continue

            # Check if adding this paragraph would exceed chunk size
            if current_length + para_length + 2 > self.chunk_size:
                # Save current chunk
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))

                # Start new chunk with overlap
                if self.chunk_overlap > 0 and current_chunk:
                    # Take last portion of previous chunk for overlap
                    overlap_text = "\n\n".join(current_chunk)[-self.chunk_overlap :]
                    current_chunk = [overlap_text, para]
                    current_length = len(overlap_text) + para_length + 2
                else:
                    current_chunk = [para]
                    current_length = para_length
            else:
                current_chunk.append(para)
                current_length += para_length + 2

        # Don't forget the last chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks

    def _split_long_text(self, text: str) -> list[str]:
        """Split a long text into chunks at sentence boundaries.

        Args:
            text: Long text to split.

        Returns:
            List of chunks.
        """
        chunks: list[str] = []
        current = ""

        # Simple sentence splitting
        sentences = text.replace("? ", "?|").replace("! ", "!|").replace(". ", ".|")
        sentences = sentences.split("|")

        for sentence in sentences:
            if len(current) + len(sentence) > self.chunk_size:
                if current:
                    chunks.append(current.strip())
                current = sentence
            else:
                current += " " + sentence if current else sentence

        if current:
            chunks.append(current.strip())

        return chunks
