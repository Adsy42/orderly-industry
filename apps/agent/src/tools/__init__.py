"""Agent tools for legal document analysis using Isaacus Legal AI.

Streamlined 2-tool architecture for maximum precision:
- legal_answer: Extractive QA with exact positions
- legal_classify: Clause finding with exact positions

Both tools return precise character positions for exact highlighting.
"""

from .legal_answer import (
    LegalAnswerInput,
    LegalAnswerOutput,
    legal_answer,
)
from .legal_classify import (
    ClauseMatch,
    LegalClassifyInput,
    LegalClassifyOutput,
    legal_classify,
)
from .list_matter_documents import (
    DocumentInfo,
    ListDocumentsOutput,
    list_matter_documents,
)

__all__ = [
    # Primary tools with exact positioning
    "legal_answer",
    "LegalAnswerInput",
    "LegalAnswerOutput",
    "legal_classify",
    "LegalClassifyInput",
    "LegalClassifyOutput",
    "ClauseMatch",
    # Utility tool for listing documents
    "list_matter_documents",
    "ListDocumentsOutput",
    "DocumentInfo",
]

# Primary document analysis tools
# These are the main tools for the Document Agent
LEGAL_TOOLS = [
    legal_answer,  # Answer questions with exact positions
    legal_classify,  # Find clauses with exact positions
    list_matter_documents,  # List available documents
]

# Legacy alias for backwards compatibility
ISAACUS_TOOLS = LEGAL_TOOLS
