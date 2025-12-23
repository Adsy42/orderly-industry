"""Deep Research Agent.

This module provides a deep research agent using the deepagents package
with custom tools for web search and strategic thinking.
"""

from src.agent.prompts import (
    RESEARCH_WORKFLOW_INSTRUCTIONS,
    RESEARCHER_INSTRUCTIONS,
    SUBAGENT_DELEGATION_INSTRUCTIONS,
)
from src.agent.tools import tavily_search, think_tool

__all__ = [
    "tavily_search",
    "think_tool",
    "RESEARCHER_INSTRUCTIONS",
    "RESEARCH_WORKFLOW_INSTRUCTIONS",
    "SUBAGENT_DELEGATION_INSTRUCTIONS",
]
