"""Agent configurations and subagents for Orderly."""

from .document_agent import (
    DOCUMENT_AGENT,
    DOCUMENT_AGENT_INSTRUCTIONS,
    DocumentAgentConfig,
    create_document_agent_prompt,
)

__all__ = [
    "DOCUMENT_AGENT",
    "DOCUMENT_AGENT_INSTRUCTIONS",
    "DocumentAgentConfig",
    "create_document_agent_prompt",
]

# Registry of all available subagents
SUBAGENTS = {
    "document_agent": DOCUMENT_AGENT,
}
