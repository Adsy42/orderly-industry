"""Agent tools for document analysis using Isaacus Legal AI."""

from .extract_structure import extract_document_structure
from .get_document_text import (
    GetDocumentTextInput,
    GetDocumentTextOutput,
    get_document_text,
)
from .isaacus_extract import (
    Citation,
    IsaacusExtractInput,
    IsaacusExtractOutput,
    isaacus_extract,
)
from .isaacus_iql import (
    IQLMatch,
    IsaacusIQLInput,
    IsaacusIQLOutput,
    isaacus_iql,
)
from .isaacus_search import (
    IsaacusSearchInput,
    IsaacusSearchOutput,
    SearchResult,
    isaacus_search,
)
from .list_matter_documents import (
    DocumentInfo,
    ListDocumentsOutput,
    list_matter_documents,
)

__all__ = [
    # List documents tool
    "list_matter_documents",
    "ListDocumentsOutput",
    "DocumentInfo",
    # Get document text tool
    "get_document_text",
    "GetDocumentTextInput",
    "GetDocumentTextOutput",
    # Search tool
    "isaacus_search",
    "IsaacusSearchInput",
    "IsaacusSearchOutput",
    "SearchResult",
    # Extract tool
    "isaacus_extract",
    "IsaacusExtractInput",
    "IsaacusExtractOutput",
    "Citation",
    # IQL tool (replaces classify - uses better model with pre-optimized templates)
    "isaacus_iql",
    "IsaacusIQLInput",
    "IsaacusIQLOutput",
    "IQLMatch",
    # Structure extraction tool
    "extract_document_structure",
]

# List of all document tools for registration with the agent
# These are proper LangChain tool functions decorated with @tool
# Note: isaacus_classify removed - IQL is more accurate with pre-optimized templates
ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,  # Direct document access (fast, no embedding needed)
    isaacus_search,  # Semantic search (requires embeddings)
    isaacus_extract,  # Extractive QA
    isaacus_iql,  # IQL - clause finding/classification (uses kanon-universal-classifier)
    extract_document_structure,  # Hierarchical structure extraction with citations
]
