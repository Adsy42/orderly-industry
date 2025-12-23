"""DeepSeek Vision OCR Service.

Uses DeepSeek's vision-language model for high-quality OCR of PDF pages,
especially effective for scanned documents and complex layouts.
"""

import asyncio
import base64
import io
import os
from typing import Any

import httpx


class DeepSeekOCR:
    """OCR service using DeepSeek's vision model.

    DeepSeek VL can process images and extract text with high accuracy,
    understanding complex document layouts, tables, and handwriting.
    """

    # DeepSeek API endpoint (OpenAI-compatible)
    DEFAULT_BASE_URL = "https://api.deepseek.com"

    # Model with vision capabilities
    VISION_MODEL = "deepseek-chat"  # DeepSeek's chat model supports vision

    # OCR prompt optimized for document extraction
    OCR_SYSTEM_PROMPT = """You are a precise document OCR assistant. Your task is to extract ALL text from the provided document image exactly as it appears.

Rules:
1. Extract text verbatim - preserve exact wording, spelling, and punctuation
2. Maintain document structure - paragraphs, lists, headings, tables
3. For tables, use markdown table format
4. Preserve section numbers, bullet points, and formatting indicators
5. Include headers, footers, page numbers if visible
6. For handwritten text, transcribe as accurately as possible
7. Do NOT summarize, interpret, or add commentary
8. Output ONLY the extracted text, nothing else

If the image is blank or unreadable, respond with: [BLANK PAGE] or [UNREADABLE]"""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 60.0,
        max_retries: int = 3,
    ):
        """Initialize the DeepSeek OCR client.

        Args:
            api_key: DeepSeek API key. Defaults to DEEPSEEK_API_KEY env var.
            base_url: API base URL. Defaults to DEEPSEEK_BASE_URL env var or official API.
            timeout: Request timeout in seconds.
            max_retries: Maximum retry attempts for failed requests.
        """
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        self.base_url = base_url or os.getenv(
            "DEEPSEEK_BASE_URL", self.DEFAULT_BASE_URL
        )
        self.timeout = timeout
        self.max_retries = max_retries
        self._client: httpx.AsyncClient | None = None

        if not self.api_key:
            raise ValueError(
                "DeepSeek API key required. Set DEEPSEEK_API_KEY environment variable "
                "or pass api_key parameter."
            )

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=self.timeout,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _make_request(
        self,
        messages: list[dict[str, Any]],
    ) -> str:
        """Make a chat completion request with retry logic.

        Args:
            messages: Chat messages including image content.

        Returns:
            Extracted text from the model response.
        """
        client = await self._get_client()
        url = f"{self.base_url}/v1/chat/completions"

        payload = {
            "model": self.VISION_MODEL,
            "messages": messages,
            "max_tokens": 4096,
            "temperature": 0.0,  # Deterministic for OCR
        }

        last_error: Exception | None = None

        for attempt in range(self.max_retries):
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()

                data = response.json()
                return data["choices"][0]["message"]["content"]

            except httpx.HTTPStatusError as e:
                last_error = e
                # Don't retry on client errors (4xx) except rate limits
                if (
                    400 <= e.response.status_code < 500
                    and e.response.status_code != 429
                ):
                    raise
                await asyncio.sleep(2**attempt)

            except httpx.RequestError as e:
                last_error = e
                await asyncio.sleep(2**attempt)

        if last_error:
            raise last_error
        raise RuntimeError("Request failed with no error captured")

    async def extract_text_from_image(
        self,
        image_data: bytes,
        image_format: str = "png",
    ) -> str:
        """Extract text from a single image using DeepSeek Vision.

        Args:
            image_data: Raw image bytes.
            image_format: Image format (png, jpeg, etc.).

        Returns:
            Extracted text from the image.
        """
        # Encode image to base64
        base64_image = base64.b64encode(image_data).decode("utf-8")

        # Determine MIME type
        mime_type = f"image/{image_format.lower()}"
        if image_format.lower() == "jpg":
            mime_type = "image/jpeg"

        messages = [
            {
                "role": "system",
                "content": self.OCR_SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}",
                        },
                    },
                    {
                        "type": "text",
                        "text": "Extract all text from this document page.",
                    },
                ],
            },
        ]

        return await self._make_request(messages)

    async def extract_text_from_pdf(
        self,
        pdf_content: bytes,
        max_pages: int | None = None,
    ) -> str:
        """Extract text from a PDF using page-by-page OCR.

        Converts each PDF page to an image and runs OCR.
        Best for scanned PDFs or PDFs with complex layouts.

        Args:
            pdf_content: Raw PDF bytes.
            max_pages: Maximum pages to process (None for all).

        Returns:
            Extracted text from all pages.
        """
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise ImportError(
                "PyMuPDF is required for PDF OCR. Install with: pip install pymupdf"
            )

        # Open PDF
        doc = fitz.open(stream=pdf_content, filetype="pdf")

        pages_text: list[str] = []
        total_pages = len(doc)
        pages_to_process = min(total_pages, max_pages) if max_pages else total_pages

        for page_num in range(pages_to_process):
            page = doc[page_num]

            # Render page to image at high DPI for OCR quality
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for 144 DPI
            pix = page.get_pixmap(matrix=mat)

            # Convert to PNG bytes
            image_data = pix.tobytes("png")

            # Extract text using DeepSeek Vision
            try:
                page_text = await self.extract_text_from_image(image_data, "png")
                if page_text and page_text.strip() not in (
                    "[BLANK PAGE]",
                    "[UNREADABLE]",
                ):
                    pages_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
            except Exception as e:
                print(f"Warning: Failed to OCR page {page_num + 1}: {e}")
                pages_text.append(f"--- Page {page_num + 1} ---\n[OCR FAILED]")

        doc.close()
        return "\n\n".join(pages_text)

    async def __aenter__(self) -> "DeepSeekOCR":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()


class HybridPDFExtractor:
    """Hybrid PDF extractor that uses native extraction first, falls back to OCR.

    This approach:
    1. Tries native text extraction (fast, works for text-based PDFs)
    2. Falls back to DeepSeek OCR for pages with little/no text (scanned pages)
    """

    # Minimum characters per page to consider it "has text"
    MIN_TEXT_THRESHOLD = 50

    def __init__(
        self,
        deepseek_api_key: str | None = None,
        deepseek_base_url: str | None = None,
    ):
        """Initialize the hybrid extractor.

        Args:
            deepseek_api_key: DeepSeek API key for OCR fallback.
            deepseek_base_url: DeepSeek API base URL.
        """
        self.deepseek_api_key = deepseek_api_key or os.getenv("DEEPSEEK_API_KEY")
        self.deepseek_base_url = deepseek_base_url
        self._ocr_client: DeepSeekOCR | None = None

    async def _get_ocr_client(self) -> DeepSeekOCR:
        """Get or create the OCR client (lazy initialization)."""
        if self._ocr_client is None:
            self._ocr_client = DeepSeekOCR(
                api_key=self.deepseek_api_key,
                base_url=self.deepseek_base_url,
            )
        return self._ocr_client

    async def close(self) -> None:
        """Close the OCR client."""
        if self._ocr_client is not None:
            await self._ocr_client.close()
            self._ocr_client = None

    async def extract_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF using hybrid approach.

        Args:
            pdf_content: Raw PDF bytes.

        Returns:
            Extracted text from all pages.
        """
        try:
            import fitz  # PyMuPDF
        except ImportError:
            # Fall back to pypdf if PyMuPDF not available
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(pdf_content))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages)

        doc = fitz.open(stream=pdf_content, filetype="pdf")
        pages_text: list[str] = []
        ocr_needed_pages: list[int] = []

        # First pass: Try native extraction
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text().strip()

            if len(text) >= self.MIN_TEXT_THRESHOLD:
                # Good text extraction
                pages_text.append((page_num, text))
            else:
                # Needs OCR
                ocr_needed_pages.append(page_num)
                pages_text.append((page_num, None))  # Placeholder

        # Second pass: OCR for pages that need it
        if ocr_needed_pages and self.deepseek_api_key:
            ocr_client = await self._get_ocr_client()

            for page_num in ocr_needed_pages:
                page = doc[page_num]

                # Render page to image
                mat = fitz.Matrix(2.0, 2.0)  # 144 DPI
                pix = page.get_pixmap(matrix=mat)
                image_data = pix.tobytes("png")

                try:
                    ocr_text = await ocr_client.extract_text_from_image(
                        image_data, "png"
                    )
                    if ocr_text and ocr_text.strip() not in (
                        "[BLANK PAGE]",
                        "[UNREADABLE]",
                    ):
                        # Update the placeholder
                        for i, (pn, txt) in enumerate(pages_text):
                            if pn == page_num:
                                pages_text[i] = (page_num, f"[OCR]\n{ocr_text}")
                                break
                except Exception as e:
                    print(f"Warning: OCR failed for page {page_num + 1}: {e}")

        doc.close()

        # Combine all pages
        result = []
        for page_num, text in pages_text:
            if text:
                result.append(text)

        return "\n\n".join(result)

    async def __aenter__(self) -> "HybridPDFExtractor":
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
