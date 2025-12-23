"""Agent tools for document analysis using Isaacus Legal AI."""

from .isaacus_search import (
    isaacus_search,
    ISAACUS_SEARCH_TOOL,
    IsaacusSearchInput,
    IsaacusSearchOutput,
    SearchResult,
)
from .isaacus_extract import (
    isaacus_extract,
    ISAACUS_EXTRACT_TOOL,
    IsaacusExtractInput,
    IsaacusExtractOutput,
    Citation,
)
from .isaacus_classify import (
    isaacus_classify,
    ISAACUS_CLASSIFY_TOOL,
    IsaacusClassifyInput,
    IsaacusClassifyOutput,
    ClassifiedClause,
    DEFAULT_CLAUSE_TYPES,
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
