"""Isaacus extractive QA tool for precise answer extraction with citations."""

import os
from typing import Optional, List
from pydantic import BaseModel, Field

from ..services.isaacus_client import IsaacusClient


class Citation(BaseModel):
    """A citation for an extracted answer."""

    document_id: str = Field(description="UUID of the source document")
    filename: str = Field(description="Name of the source file")
    text_excerpt: str = Field(description="The exact text containing the answer")
    position: Optional[str] = Field(
        default=None,
        description="Position indicator (e.g., chunk index)",
    )


class IsaacusExtractInput(BaseModel):
    """Input schema for the isaacus_extract tool."""

    matter_id: str = Field(description="UUID of the matter containing the documents")
    question: str = Field(description="The specific question to answer")
    document_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional list of specific document IDs to search. If not provided, searches all matter documents.",
    )


class IsaacusExtractOutput(BaseModel):
    """Output schema for the isaacus_extract tool."""

    answer: str = Field(description="The extracted answer or 'Not found' if no answer could be extracted")
    confidence: float = Field(
        default=0.0,
        description="Confidence score for the answer (0-1)",
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Citations for where the answer was found",
    )
    question: str = Field(description="The original question")
    found: bool = Field(
        default=False,
        description="Whether an answer was found in the documents",
    )


async def isaacus_extract(
    matter_id: str,
    question: str,
    document_ids: Optional[List[str]] = None,
    supabase_client=None,  # Injected by agent context
) -> IsaacusExtractOutput:
    """
    Extract a precise answer from matter documents with citations.
    
    This tool uses Isaacus extractive QA models to find and extract the exact
    answer to a question from legal documents, along with citations showing
    where the answer was found.
    
    Args:
        matter_id: The UUID of the matter to search within.
        question: A specific question to answer from the documents.
        document_ids: Optional list of specific document IDs to search.
        supabase_client: Supabase client (injected by agent context).
        
    Returns:
        IsaacusExtractOutput with the answer, confidence, and citations.
        
    Example:
        >>> result = await isaacus_extract(
        ...     matter_id="uuid-here",
        ...     question="What is the notice period for termination?"
        ... )
    """
    api_key = os.getenv("ISAACUS_API_KEY")
    base_url = os.getenv("ISAACUS_BASE_URL", "https://api.isaacus.com")
    
    if not api_key:
        return IsaacusExtractOutput(
            answer="Unable to process: API not configured",
            confidence=0.0,
            citations=[],
            question=question,
            found=False,
        )
    
    client = IsaacusClient(api_key=api_key, base_url=base_url)
    
    try:
        # First, perform a semantic search to find relevant chunks
        embeddings = await client.embed([question])
        if not embeddings:
            return IsaacusExtractOutput(
                answer="Not found in the documents",
                confidence=0.0,
                citations=[],
                question=question,
                found=False,
            )
        
        query_embedding = embeddings[0]
        
        # Get relevant chunks from the database
        if supabase_client is None:
            return IsaacusExtractOutput(
                answer="Not found in the documents",
                confidence=0.0,
                citations=[],
                question=question,
                found=False,
            )
        
        response = await supabase_client.rpc(
            "match_document_embeddings",
            {
                "query_embedding": query_embedding,
                "matter_uuid": matter_id,
                "match_threshold": 0.5,
                "match_count": 10,
            },
        ).execute()
        
        if not response.data:
            return IsaacusExtractOutput(
                answer="Not found in the documents",
                confidence=0.0,
                citations=[],
                question=question,
                found=False,
            )
        
        # Filter by document_ids if provided
        chunks = response.data
        if document_ids:
            chunks = [c for c in chunks if c["document_id"] in document_ids]
        
        if not chunks:
            return IsaacusExtractOutput(
                answer="Not found in the specified documents",
                confidence=0.0,
                citations=[],
                question=question,
                found=False,
            )
        
        # Combine relevant chunks into context
        context = "\n\n---\n\n".join([
            f"[From: {chunk['filename']}]\n{chunk['chunk_text']}"
            for chunk in chunks[:5]  # Limit context size
        ])
        
        # Use Isaacus extract to get the answer
        result = await client.extract(question=question, context=context)
        
        if result and result.get("answer"):
            # Find which chunk contains the answer
            answer_text = result["answer"]
            citations = []
            
            for chunk in chunks[:5]:
                if answer_text.lower() in chunk["chunk_text"].lower():
                    citations.append(Citation(
                        document_id=chunk["document_id"],
                        filename=chunk["filename"],
                        text_excerpt=chunk["chunk_text"][:500],  # Truncate for brevity
                        position=f"Chunk {chunk.get('chunk_index', 'N/A')}",
                    ))
            
            # If no exact match, cite the top result
            if not citations and chunks:
                citations.append(Citation(
                    document_id=chunks[0]["document_id"],
                    filename=chunks[0]["filename"],
                    text_excerpt=chunks[0]["chunk_text"][:500],
                    position=f"Chunk {chunks[0].get('chunk_index', 'N/A')}",
                ))
            
            return IsaacusExtractOutput(
                answer=answer_text,
                confidence=result.get("confidence", 0.8),
                citations=citations,
                question=question,
                found=True,
            )
        
        return IsaacusExtractOutput(
            answer="Not found in the documents",
            confidence=0.0,
            citations=[],
            question=question,
            found=False,
        )
        
    except Exception as e:
        print(f"Isaacus extract error: {e}")
        return IsaacusExtractOutput(
            answer="An error occurred while extracting the answer",
            confidence=0.0,
            citations=[],
            question=question,
            found=False,
        )
    finally:
        await client.close()


# Tool definition for LangGraph
ISAACUS_EXTRACT_TOOL = {
    "name": "isaacus_extract",
    "description": """
Extract a precise answer from matter documents with exact citations.
Use this tool when you need to find specific facts, dates, terms, or clauses
from legal documents. Returns the answer with document and location citations.

Best for: "What is the termination notice period?", "Who are the parties?",
"What is the contract value?", "When does the agreement expire?"
""".strip(),
    "input_schema": IsaacusExtractInput,
    "func": isaacus_extract,
}

