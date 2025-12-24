"""Isaacus Legal AI API Client.

Provides embedding, reranking, extractive QA, and classification
capabilities optimized for Australian legal documents.

Uses the official Isaacus Python SDK.
Note: SDK is synchronous, so we use asyncio.to_thread() for async compatibility.
"""

import asyncio
import os
from typing import Any

from isaacus import Isaacus


class IsaacusClient:
    """Client for Isaacus Legal AI API using official SDK."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        max_retries: int = 3,
        timeout: float = 30.0,
    ):
        """Initialize the Isaacus client.

        Args:
            api_key: Isaacus API key. Defaults to ISAACUS_API_KEY env var.
            base_url: Base URL for the API. Defaults to ISAACUS_BASE_URL env var or SDK default.
            max_retries: Maximum number of retry attempts (not used by SDK, kept for compatibility).
            timeout: Request timeout in seconds (not used by SDK, kept for compatibility).
        """
        self.api_key = api_key or os.getenv("ISAACUS_API_KEY")
        self.base_url = os.getenv("ISAACUS_BASE_URL", base_url)
        self.max_retries = max_retries
        self.timeout = timeout

        # Initialize official SDK client
        # SDK automatically uses ISAACUS_API_KEY env var if api_key is None
        self._client = Isaacus(api_key=self.api_key)

    async def close(self) -> None:
        """Close the HTTP client (no-op for SDK)."""
        # SDK handles connection management internally
        pass

    async def embed(
        self,
        texts: list[str],
        model: str = "kanon-2-embedder",
        task: str = "retrieval/document",
    ) -> list[list[float]]:
        """Generate embeddings for texts.

        Uses legal-optimized embedding model for better semantic
        understanding of Australian legal documents.

        API docs: https://docs.isaacus.com/api-reference/embeddings

        Args:
            texts: List of text strings to embed
            model: Embedding model to use (default: kanon-2-embedder)
            task: Task type - "retrieval/query" or "retrieval/document" (default: retrieval/document)

        Returns:
            List of embedding vectors (1792 dimensions each for kanon-2-embedder)
        """
        # Run sync SDK call in thread to avoid blocking event loop
        response = await asyncio.to_thread(
            self._client.embeddings.create,
            model=model,
            texts=texts,
            task=task,
        )

        # SDK returns response with embeddings array
        embeddings_data = response.embeddings

        if not embeddings_data:
            return []

        # Extract embedding vectors from response objects
        # SDK returns list of objects with .embedding attribute
        return [item.embedding for item in embeddings_data]

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
        kwargs: dict[str, Any] = {
            "query": query,
            "documents": documents,
            "model": model,
        }
        if top_k is not None:
            kwargs["top_k"] = top_k

        # Run sync SDK call in thread to avoid blocking event loop
        response = await asyncio.to_thread(
            lambda: self._client.rerankings.create(**kwargs)
        )

        # Convert SDK response objects to dicts
        return [
            {
                "index": item.index,
                "score": item.score,
                "text": item.text if hasattr(item, "text") else documents[item.index],
            }
            for item in response.results
        ]

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
        # Run sync SDK call in thread to avoid blocking event loop
        response = await asyncio.to_thread(
            self._client.extractions.qa.create,
            question=question,
            context=context,
            model=model,
        )

        # Convert SDK response to dict
        return {
            "answer": response.answer,
            "confidence": getattr(response, "confidence", 1.0),
            "start": getattr(response, "start", 0),
            "end": getattr(response, "end", len(context)),
        }

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
        # Run sync SDK call in thread to avoid blocking event loop
        response = await asyncio.to_thread(
            self._client.classifications.universal.create,
            text=text,
            labels=labels,
            model=model,
            multi_label=multi_label,
        )

        # Convert SDK response objects to dicts
        return [
            {"label": item.label, "score": item.score}
            for item in response.classifications
        ]

    def _extract_start_index(self, obj: Any) -> int:
        """Extract start index from various API response formats.

        Isaacus API may return 'start', 'start_index', or 'startIndex'.
        This ensures consistent handling across different response formats.
        """
        # Try each possible field name
        for field in ("start", "start_index", "startIndex"):
            value = getattr(obj, field, None)
            if value is not None:
                return int(value)
        return 0

    def _extract_end_index(self, obj: Any) -> int:
        """Extract end index from various API response formats.

        Isaacus API may return 'end', 'end_index', or 'endIndex'.
        This ensures consistent handling across different response formats.
        """
        # Try each possible field name
        for field in ("end", "end_index", "endIndex"):
            value = getattr(obj, field, None)
            if value is not None:
                return int(value)
        return 0

    async def classify_iql(
        self,
        query: str,
        text: str,
        model: str = "kanon-universal-classifier",
    ) -> dict[str, Any]:
        """Execute an IQL (Isaacus Query Language) query against document text.

        Uses Isaacus IQL to analyze legal documents and identify clauses,
        obligations, and rights matching the query criteria.

        API docs: https://docs.isaacus.com/iql/introduction

        Args:
            query: IQL query string (e.g., "{IS confidentiality clause}")
            text: Document text to analyze
            model: Classification model to use (kanon-universal-classifier or kanon-universal-classifier-mini)

        Returns:
            Dict with 'score' (0-1) and 'matches' list containing:
            - 'text': Matching excerpt
            - 'start_index': Character position start (snake_case for Python convention)
            - 'end_index': Character position end (snake_case for Python convention)
            - 'score': Confidence score for this match
        """
        # IQL queries use the universal classification endpoint with query parameter
        # API requires 'texts' (plural array), not 'text' (singular)
        # Run sync SDK call in thread to avoid blocking event loop
        response = await asyncio.to_thread(
            self._client.classifications.universal.create,
            query=query,
            texts=[text],  # API requires 'texts' as an array
            model=model,
        )

        # Handle response format
        # The universal classification endpoint returns:
        # { classifications: [{ index, score, chunks: [{ index, start, end, score, text }] }] }
        result: dict[str, Any] = {
            "score": 0.0,
            "matches": [],
        }

        # Extract from classifications response format (primary format)
        if hasattr(response, "classifications") and response.classifications:
            classification = response.classifications[0]
            if classification:
                result["score"] = float(getattr(classification, "score", 0.0))

                # Extract chunks as matches
                if hasattr(classification, "chunks") and classification.chunks:
                    result["matches"] = [
                        {
                            "text": getattr(chunk, "text", ""),
                            "start_index": self._extract_start_index(chunk),
                            "end_index": self._extract_end_index(chunk),
                            "score": float(getattr(chunk, "score", result["score"])),
                        }
                        for chunk in classification.chunks
                    ]
        elif hasattr(response, "score"):
            # Fallback: direct score/matches format
            result["score"] = float(getattr(response, "score", 0.0))
            if hasattr(response, "matches") and response.matches:
                result["matches"] = [
                    {
                        "text": getattr(match, "text", str(match)),
                        "start_index": self._extract_start_index(match),
                        "end_index": self._extract_end_index(match),
                        "score": float(getattr(match, "score", result["score"])),
                    }
                    for match in response.matches
                ]

        # Sort matches by score descending for consistency with frontend
        result["matches"].sort(key=lambda m: m["score"], reverse=True)

        return result

    async def __aenter__(self) -> "IsaacusClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Async context manager exit."""
        await self.close()
