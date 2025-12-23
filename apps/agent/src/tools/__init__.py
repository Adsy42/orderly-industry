"""Agent tools for document analysis using Isaacus Legal AI."""

from .isaacus_classify import (
    DEFAULT_CLAUSE_TYPES,
    ClassifiedClause,
    IsaacusClassifyInput,
    IsaacusClassifyOutput,
    isaacus_classify,
)
from .isaacus_extract import (
    Citation,
    IsaacusExtractInput,
    IsaacusExtractOutput,
    isaacus_extract,
)
from .isaacus_search import (
    IsaacusSearchInput,
    IsaacusSearchOutput,
    SearchResult,
    isaacus_search,
)

__all__ = [
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
    # Classify tool
    "isaacus_classify",
    "IsaacusClassifyInput",
    "IsaacusClassifyOutput",
    "ClassifiedClause",
    "DEFAULT_CLAUSE_TYPES",
]

# List of all Isaacus tools for registration with the agent
# These are now proper LangChain tool functions decorated with @tool
ISAACUS_TOOLS = [
    isaacus_search,
    isaacus_extract,
    isaacus_classify,
]
