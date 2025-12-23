"""Isaacus Legal AI API Client.

Provides embedding, reranking, extractive QA, and classification
capabilities optimized for Australian legal documents.
"""

import asyncio
import os
from typing import Any

import httpx


class IsaacusClient:
    """Client for Isaacus Legal AI API."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.isaacus.com",
        max_retries: int = 3,
        timeout: float = 30.0,
    ):
        """Initialize the Isaacus client.

        Args:
            api_key: Isaacus API key. Defaults to ISAACUS_API_KEY env var.
            base_url: Base URL for the API. Defaults to ISAACUS_BASE_URL env var or production URL.
            max_retries: Maximum number of retry attempts for failed requests.
            timeout: Request timeout in seconds.
        """
        self.api_key = api_key or os.getenv("ISAACUS_API_KEY")
        self.base_url = os.getenv("ISAACUS_BASE_URL", base_url)
        self.max_retries = max_retries
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create the HTTP client."""
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

    async def _request(
        self,
        method: str,
        endpoint: str,
        json_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Make an API request with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            json_data: Optional JSON body

        Returns:
            JSON response data

        Raises:
            httpx.HTTPError: If all retries fail
        """
        client = await self._get_client()
        url = f"{self.base_url}{endpoint}"
        last_error: Exception | None = None

        for attempt in range(self.max_retries):
            try:
                response = await client.request(method, url, json=json_data)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                last_error = e
                # Don't retry on client errors (4xx)
                if 400 <= e.response.status_code < 500:
                    raise
                # Exponential backoff for server errors
                await asyncio.sleep(2**attempt)
            except httpx.RequestError as e:
                last_error = e
                await asyncio.sleep(2**attempt)

        # If we exhausted retries, raise the last error
        if last_error:
            raise last_error
        raise RuntimeError("Request failed with no error captured")

    async def embed(
        self,
        texts: list[str],
        model: str = "kanon-2-embedder",
    ) -> list[list[float]]:
        """Generate embeddings for texts.

        Uses legal-optimized embedding model for better semantic
        understanding of Australian legal documents.

        API docs: https://docs.isaacus.com/api-reference/embeddings

        Args:
            texts: List of text strings to embed
            model: Embedding model to use (default: kanon-2-embedder)

        Returns:
            List of embedding vectors (1792 dimensions each for kanon-2-embedder)
        """
        response = await self._request(
            "POST",
            "/v1/embeddings",
            json_data={
                "texts": texts,  # Isaacus uses 'texts' field
                "model": model,
            },
        )
        # Isaacus returns { embeddings: [{"index": 0, "embedding": [...]}, ...] }
        # or potentially { embeddings: [[...], [...], ...] } - handle both formats
        embeddings_data = response.get("embeddings", [])

        if not embeddings_data:
            return []

        # Check if first item is an object with 'embedding' field or a raw array
        first_item = embeddings_data[0]
        if isinstance(first_item, dict) and "embedding" in first_item:
            # Format: [{"index": 0, "embedding": [...]}, ...]
            return [item["embedding"] for item in embeddings_data]
        else:
            # Format: [[...], [...], ...] - already raw arrays
            return embeddings_data

    async def rerank(
        self,
        query: str,
        documents: list[str],
        model: str = "legal-rerank-v1",
        top_k: int | None = None,
    ) -> list[dict[str, Any]]:
        """Rerank documents by relevance to query.

        Uses legal-optimized reranking for improved search relevance
        on legal terminology and concepts.

        Args:
            query: Search query
            documents: List of document texts to rerank
            model: Reranking model to use
            top_k: Optional limit on returned results

        Returns:
            List of dicts with 'index', 'score', and 'text' keys,
            sorted by relevance score descending
        """
        json_data: dict[str, Any] = {
            "query": query,
            "documents": documents,
            "model": model,
        }
        if top_k is not None:
            json_data["top_k"] = top_k

        response = await self._request("POST", "/rerank", json_data=json_data)
        return response.get("results", [])

    async def extract(
        self,
        question: str,
        context: str,
        model: str = "legal-extract-v1",
    ) -> dict[str, Any]:
        """Extract answer from context using extractive QA.

        Finds the exact text span that answers the question,
        with citation information for legal documents.

        Args:
            question: Question to answer
            context: Text context to search for answer
            model: Extraction model to use

        Returns:
            Dict with 'answer', 'confidence', 'start', 'end' keys
        """
        response = await self._request(
            "POST",
            "/extract",
            json_data={
                "question": question,
                "context": context,
                "model": model,
            },
        )
        return response

    async def classify(
        self,
        text: str,
        labels: list[str],
        model: str = "legal-classify-v1",
        multi_label: bool = True,
    ) -> list[dict[str, Any]]:
        """Classify text into provided labels.

        Universal zero-shot classification for legal clauses
        without requiring training data.

        Args:
            text: Text to classify
            labels: List of possible labels/categories
            model: Classification model to use
            multi_label: Whether to allow multiple labels

        Returns:
            List of dicts with 'label' and 'score' keys,
            sorted by score descending
        """
        response = await self._request(
            "POST",
            "/classify",
            json_data={
                "text": text,
                "labels": labels,
                "model": model,
                "multi_label": multi_label,
            },
        )
        return response.get("classifications", [])

    async def __aenter__(self) -> "IsaacusClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()
