"""Agent tools for document analysis using Isaacus Legal AI."""

from .isaacus_classify import (
    DEFAULT_CLAUSE_TYPES,
    ISAACUS_CLASSIFY_TOOL,
    ClassifiedClause,
    IsaacusClassifyInput,
    IsaacusClassifyOutput,
    isaacus_classify,
)
from .isaacus_extract import (
    ISAACUS_EXTRACT_TOOL,
    Citation,
    IsaacusExtractInput,
    IsaacusExtractOutput,
    isaacus_extract,
)
from .isaacus_search import (
    ISAACUS_SEARCH_TOOL,
    IsaacusSearchInput,
    IsaacusSearchOutput,
    SearchResult,
    isaacus_search,
)

__all__ = [
    # Search tool
    "isaacus_search",
    "ISAACUS_SEARCH_TOOL",
    "IsaacusSearchInput",
    "IsaacusSearchOutput",
    "SearchResult",
    # Extract tool
    "isaacus_extract",
    "ISAACUS_EXTRACT_TOOL",
    "IsaacusExtractInput",
    "IsaacusExtractOutput",
    "Citation",
    # Classify tool
    "isaacus_classify",
    "ISAACUS_CLASSIFY_TOOL",
    "IsaacusClassifyInput",
    "IsaacusClassifyOutput",
    "ClassifiedClause",
    "DEFAULT_CLAUSE_TYPES",
]

# List of all Isaacus tools for registration with the agent
ISAACUS_TOOLS = [
    ISAACUS_SEARCH_TOOL,
    ISAACUS_EXTRACT_TOOL,
    ISAACUS_CLASSIFY_TOOL,
]
