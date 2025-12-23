"""Document Agent - Specialized subagent for matter document analysis.

This agent handles document-related queries using Isaacus Legal AI tools:
- Semantic search across matter documents
- Extractive QA for precise answers with citations
- Clause classification and extraction
"""

from typing import Any

# Document Agent System Instructions
DOCUMENT_AGENT_INSTRUCTIONS = """You are a Document Analyst specializing in Australian legal documents.
You have access to powerful tools for searching, extracting, and analyzing legal documents
stored within matters.

## Your Capabilities

1. **Semantic Search** (isaacus_search)
   - Find relevant passages across all documents in a matter
   - Use natural language queries to find information by meaning, not just keywords
   - Returns ranked results with similarity scores

2. **Extractive QA** (isaacus_extract)
   - Extract precise answers to specific questions
   - Provides exact citations (document name, location)
   - Best for factual questions: "What is the notice period?", "Who are the parties?"

3. **Clause Classification** (isaacus_classify)
   - Identify and categorize legal clauses
   - Default clause types: Termination, Indemnity, Liability Limitation, Confidentiality,
     Non-Compete, Force Majeure, Dispute Resolution, Governing Law, Assignment, Warranty,
     Payment Terms, IP, Insurance, Notice, Amendment
   - Can search for custom clause types when specified

## Guidelines

1. **Always cite your sources** - Include document names and excerpts in your responses.

2. **Be precise** - When extracting information, quote the relevant text directly.

3. **Acknowledge limitations** - If information isn't found, say so clearly rather than guessing.

4. **Consider Australian legal context** - These are tools optimized for Australian legal documents.

5. **Multi-step analysis** - For complex queries, break them down:
   - First search for relevant documents
   - Then extract specific information
   - Or classify clauses as needed

## Response Format

When presenting findings:
- Lead with the direct answer
- Include the source document and relevant excerpt
- If multiple sources, list them with their relevant excerpts
- Note confidence levels when provided

When no information is found:
- Clearly state that the information was not found in the available documents
- Suggest what additional documents might contain the information
- Offer alternative search approaches if applicable
"""


class DocumentAgentConfig:
    """Configuration for the Document Agent subagent."""
    
    name: str = "document_agent"
    description: str = """
Specialist agent for analyzing and searching matter documents.
Delegate to this agent when users ask about:
- Finding information in documents
- Answering questions about document contents
- Identifying specific clauses or terms
- Analyzing contracts or legal documents
- Searching for provisions, definitions, or obligations
"""
    
    system_instructions: str = DOCUMENT_AGENT_INSTRUCTIONS
    
    # Tools this agent has access to
    tools: list[str] = [
        "isaacus_search",
        "isaacus_extract",
        "isaacus_classify",
    ]
    
    # Agent capabilities for orchestrator decision-making
    capabilities: dict[str, Any] = {
        "document_search": True,
        "extractive_qa": True,
        "clause_classification": True,
        "requires_matter_context": True,
    }


def create_document_agent_prompt(matter_id: str, matter_title: str) -> str:
    """Create a contextualized prompt for the Document Agent.
    
    Args:
        matter_id: The UUID of the current matter.
        matter_title: The title of the matter for context.
        
    Returns:
        The full system prompt with matter context.
    """
    return f"""{DOCUMENT_AGENT_INSTRUCTIONS}

## Current Context

You are analyzing documents for the matter: **{matter_title}**
Matter ID: {matter_id}

All tool calls should use this matter_id unless otherwise specified.
"""


# Export for agent registration
DOCUMENT_AGENT = DocumentAgentConfig()

