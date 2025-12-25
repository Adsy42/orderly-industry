"""Research Agent - Standalone script for LangGraph deployment.

This module creates a deep research agent with custom tools and prompts
for conducting web research with strategic thinking and context management.

Version: 2.0.0 - Streamlined 2-tool architecture for precise legal analysis
"""

from datetime import datetime

from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model

from src.agent.prompts import (
    RESEARCH_WORKFLOW_INSTRUCTIONS,
    RESEARCHER_INSTRUCTIONS,
    SUBAGENT_DELEGATION_INSTRUCTIONS,
)
from src.agent.tools import tavily_search, think_tool
from src.agents.document_agent import DOCUMENT_AGENT_INSTRUCTIONS
from src.tools import LEGAL_TOOLS

# Limits
max_concurrent_research_units = 3
max_researcher_iterations = 3

# Get current date
current_date = datetime.now().strftime("%Y-%m-%d")

# Combine orchestrator instructions (RESEARCHER_INSTRUCTIONS only for sub-agents)
INSTRUCTIONS = (
    RESEARCH_WORKFLOW_INSTRUCTIONS
    + "\n\n"
    + "=" * 80
    + "\n\n"
    + SUBAGENT_DELEGATION_INSTRUCTIONS.format(
        max_concurrent_research_units=max_concurrent_research_units,
        max_researcher_iterations=max_researcher_iterations,
    )
)

# Create research sub-agent
research_sub_agent = {
    "name": "research-agent",
    "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
    "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=current_date),
    "tools": [tavily_search, think_tool],
}

# Create document analysis sub-agent with streamlined 2-tool architecture
# Uses legal_answer (extractive QA) and legal_classify (IQL) for precise citations
document_sub_agent = {
    "name": "document-agent",
    "description": """Delegate document analysis to this specialist agent when users ask about:
- Answering specific questions about documents (e.g., "What is the notice period?", "Who are the parties?")
- Finding specific clause types (e.g., "Find termination clauses", "Are there indemnity provisions?")
- Listing documents in a matter (e.g., "What documents are in this matter?")

**IMPORTANT:** When delegating, include the matter_id UUID in your task description.
Look for a [CONTEXT] message in the conversation that contains the matter_id UUID.
If no [CONTEXT] message exists, ask the user which matter they want to search.""",
    "system_prompt": DOCUMENT_AGENT_INSTRUCTIONS,
    "tools": LEGAL_TOOLS + [think_tool],
}

# Model options - uncomment the one you want to use:

# OpenAI GPT-4o
model = init_chat_model(model="openai:gpt-4o", temperature=0.0)

# Anthropic Claude Sonnet
# model = init_chat_model(model="anthropic:claude-sonnet-4-5-20250929", temperature=0.0)

# Google Gemini
# model = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0.0)

# Create the agent with both research and document analysis capabilities
agent = create_deep_agent(
    model=model,
    tools=[tavily_search, think_tool] + LEGAL_TOOLS,
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent, document_sub_agent],
)
