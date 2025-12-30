# Deep Research Agent Architecture

> **Version**: 1.2.0  
> **Framework**: [Deep Agents](https://docs.langchain.com/oss/python/deepagents/overview)  
> **Last Updated**: 2025-12-25

## Overview

Orderly uses the Deep Agents framework to build a legal research assistant with:
- **Planning & Task Decomposition** - Built-in `write_todos` tool
- **Context Management** - File system tools for large context handling
- **Subagent Spawning** - Specialized agents for research and document analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEEP AGENT ORCHESTRATOR                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │TodoMiddleware │  │ FSMiddleware  │  │SubAgentMiddle │                    │
│  │ (write_todos) │  │(ls,read,write)│  │  (task tool)  │                    │
│  └───────────────┘  └───────────────┘  └───────────────┘                    │
│                              │                                               │
│                    ┌─────────┴─────────┐                                    │
│                    ▼                   ▼                                    │
│  ┌─────────────────────┐   ┌────────────────────────────────┐              │
│  │   Research Agent    │   │       Document Agent           │              │
│  │  ─────────────────  │   │  ────────────────────────────  │              │
│  │  • tavily_search    │   │  • list_matter_documents       │              │
│  │  • think_tool       │   │  • get_document_text           │              │
│  └─────────────────────┘   │  • isaacus_search → citations  │              │
│                            │  • isaacus_extract → citations │              │
│                            │  • isaacus_iql → citations     │              │
│                            │  • think_tool                  │              │
│                            └────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Agent Configuration

### Main Agent (`graph.py`)

```python
from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model

agent = create_deep_agent(
    model=init_chat_model(model="openai:gpt-4o", temperature=0.0),
    tools=[tavily_search, think_tool] + ISAACUS_TOOLS,
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent, document_sub_agent],
)
```

### Subagent Configuration

Subagents are defined as dictionaries:

```python
document_sub_agent = {
    "name": "document-agent",           # Tool name for delegation
    "description": "...",               # When to use this agent
    "system_prompt": INSTRUCTIONS,      # Agent's behavior
    "tools": [...],                     # Available tools
}
```

## Context Injection

Context (matter_id, document_id) is injected via system messages from the frontend:

```
[CONTEXT] The user has selected matter "Test Case" (matter_id: abc123-...).
The user is currently viewing document "Contract.pdf" (document_id: def456-...).
```

**Why this approach?**
- ✅ Visible in conversation history (auditable)
- ✅ Works with Deep Agents without custom middleware
- ✅ Agent can reference it naturally in responses

## Tool Contracts

### Citation Format (CRITICAL)

All document tools return citation data with a ready-to-use markdown format:

```python
{
    "citation": {
        "formatted": "Contract.pdf, p.12, § 7.2",    # Display text
        "permalink": "cite:doc-id#chunk-id",          # Link target
        "markdown": "[Contract.pdf, p.12, § 7.2](cite:doc-id#chunk-id)"  # Ready to use
    },
    "_citation_hint": "CITATION FORMAT: Use the 'citation.markdown' field..."
}
```

**Frontend Rendering:**
- Links with `cite:` protocol are parsed by `InlineCitation` component
- Tooltip preview fetches chunk content from `/api/citations/[documentId]`
- Click navigates to document with `?highlight=CHUNK_ID`

### Tool Reference

| Tool | Purpose | Returns Citations? |
|------|---------|-------------------|
| `list_matter_documents` | List files in a matter | ❌ No |
| `get_document_text` | Get full document text | ❌ No |
| `isaacus_search` | Hybrid semantic + keyword search | ✅ Yes |
| `isaacus_extract` | Extractive QA | ✅ Yes |
| `isaacus_iql` | Universal clause classification | ✅ Yes |
| `think_tool` | Agent reflection | ❌ N/A |
| `tavily_search` | Web search | ❌ Web URLs |

### Tool Input/Output Schemas

#### `isaacus_search`

```python
# Input
{
    "matter_id": str,        # UUID from [CONTEXT]
    "query": str,            # Natural language query
    "max_results": int = 5,
    "threshold": float = 0.3,
    "semantic_weight": float = 0.7,
    "include_context": bool = True,
}

# Output
{
    "results": [
        {
            "document_id": str,
            "chunk_id": str,
            "filename": str,
            "chunk_text": str,
            "similarity": float,
            "rerank_score": float | None,
            "citation": {
                "formatted": str,
                "permalink": str,
                "markdown": str,  # Ready to use!
            },
        }
    ],
    "total_found": int,
    "reranked": bool,
    "_citation_hint": str,
}
```

#### `isaacus_iql`

```python
# Input
{
    "matter_id": str,        # UUID from [CONTEXT]
    "query": str,            # IQL query (see IQL reference)
    "document_ids": list[str] | None,  # Filter to specific docs
    "model": str = "kanon-universal-classifier",
}

# Output
{
    "query": str,
    "document_results": [
        {
            "document_id": str,
            "filename": str,
            "score": float,
            "matches": [
                {
                    "text": str,
                    "start_index": int,
                    "end_index": int,
                    "score": float,
                    "citation": {
                        "formatted": str,
                        "permalink": str,
                        "markdown": str,
                    },
                }
            ],
            "citation": {
                "formatted": str,
                "permalink": str,
                "markdown": str,
            },
        }
    ],
    "total_matches": int,
    "average_score": float,
    "_citation_hint": str,
}
```

#### `isaacus_extract`

```python
# Input
{
    "matter_id": str,        # UUID from [CONTEXT]
    "question": str,         # Natural language question
}

# Output
{
    "answer": str,
    "confidence": float,
    "citations": [
        {
            "document_id": str,
            "chunk_id": str,
            "filename": str,
            "text_excerpt": str,
            "formatted": str,
            "permalink": str,
            "markdown": str,
        }
    ],
    "found": bool,
    "primary_citation": str,
    "primary_markdown": str,
    "_citation_hint": str,
}
```

## Adding New Tools

### Step 1: Create Tool Function

```python
from langchain_core.tools import tool

@tool(parse_docstring=True)
def my_new_tool(
    matter_id: str,
    query: str,
) -> dict:
    """Short description for the agent.
    
    Args:
        matter_id: The UUID of the matter to search in.
        query: The user's query.
    
    Returns:
        Results with citations in standard format.
    """
    # Implementation...
    
    return {
        "results": [...],
        "citation": {
            "formatted": "...",
            "permalink": "cite:...",
            "markdown": "[...](cite:...)",
        },
        "_citation_hint": "CITATION FORMAT: ...",
    }
```

### Step 2: Register in `__init__.py`

```python
# apps/agent/src/tools/__init__.py
from src.tools.my_new_tool import my_new_tool

ISAACUS_TOOLS = [
    list_matter_documents,
    get_document_text,
    isaacus_search,
    isaacus_extract,
    isaacus_iql,
    my_new_tool,  # Add here
]
```

### Step 3: Update Document Agent Instructions

Add tool to the selection table in `document_agent.py`:

```python
| Query Type | Tool | When to Use |
|------------|------|-------------|
| New case   | `my_new_tool` | "..." |
```

## Deployment

### LangGraph Configuration

```json
// apps/agent/langgraph.json
{
  "graphs": {
    "deep_research": "src.agent.graph:agent"
  },
  "auth": {
    "path": "src.security.auth:auth"
  }
}
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ISAACUS_API_KEY=isa_...
TAVILY_API_KEY=tvly-...

# Optional
ISAACUS_BASE_URL=https://api.isaacus.com/v1
```

### Deploy to LangSmith

```bash
cd apps/agent
langgraph deploy --config langgraph.json
```

## Best Practices

1. **Always return citations** - Use the standard citation format with `markdown` field
2. **Use think_tool strategically** - For planning complex multi-step analysis
3. **Context is king** - Rely on [CONTEXT] messages for matter/document scope
4. **Tool selection matters** - Follow the tool selection table strictly
5. **IQL for clauses** - Always use `isaacus_iql` when user mentions "clause"

## Extending the Architecture

### Adding a New Subagent

```python
# In graph.py
new_sub_agent = {
    "name": "my-agent",
    "description": "When to delegate to this agent...",
    "system_prompt": MY_AGENT_INSTRUCTIONS,
    "tools": [...],
}

agent = create_deep_agent(
    model=model,
    tools=[...],
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent, document_sub_agent, new_sub_agent],
)
```

### Custom Middleware

For cross-cutting concerns (rate limiting, logging):

```python
from deepagents import create_middleware

my_middleware = create_middleware(
    name="MyMiddleware",
    before_model=lambda state: {...},
    after_model=lambda state: {...},
)

agent = create_deep_agent(
    model=model,
    middleware=[my_middleware],
    # ...
)
```

See [Deep Agents Middleware docs](https://docs.langchain.com/oss/python/deepagents/middleware) for details.

## References

- [Deep Agents Overview](https://docs.langchain.com/oss/python/deepagents/overview)
- [Deep Agents Customization](https://docs.langchain.com/oss/python/deepagents/customization)
- [Subagents Pattern](https://docs.langchain.com/oss/python/deepagents/subagents)
- [Middleware Architecture](https://docs.langchain.com/oss/python/deepagents/middleware)
- [LangGraph Deployment](https://docs.langchain.com/langsmith/how-to-deploy)

