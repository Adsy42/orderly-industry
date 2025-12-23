# Deep Research Agent

Python LangGraph agent for deep research with web search and legal document analysis capabilities.

## Quick Start

```bash
# Install dependencies with uv
uv sync

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
uv run langgraph dev
```

The agent API will be available at [http://localhost:2024](http://localhost:2024).

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                     | Description                                  | Required                   |
| ---------------------------- | -------------------------------------------- | -------------------------- |
| `OPENAI_API_KEY`             | OpenAI API key for GPT models                | Yes                        |
| `TAVILY_API_KEY`             | Tavily API key for web search                | Yes                        |
| `SUPABASE_URL`               | Supabase project URL                         | Yes                        |
| `SUPABASE_ANON_KEY`          | Supabase anon key                            | Yes                        |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase service role key (bypasses RLS)     | Yes (for document tools)   |
| `ISAACUS_API_KEY`            | Isaacus Legal AI API key                     | Yes (for document tools)   |
| `ISAACUS_BASE_URL`           | Isaacus API base URL                         | No (defaults to production)|
| `DEEPSEEK_API_KEY`           | DeepSeek API key for OCR                     | No (for scanned PDFs)      |
| `LANGSMITH_API_KEY`          | LangSmith API key                            | Recommended                |
| `LANGSMITH_TRACING`          | Enable tracing (`true`)                      | Recommended                |

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required for document analysis tools to work. Without it, the agent cannot access documents due to Row Level Security (RLS) policies.

## Project Structure

```
src/
├── agent/
│   ├── graph.py           # Main graph definition with orchestrator
│   ├── prompts.py         # System prompts for orchestrator and subagents
│   └── tools.py           # Core tools (Tavily search)
├── agents/
│   └── document_agent.py  # Document Agent subagent configuration
├── security/
│   └── auth.py            # JWT validation against Supabase
├── services/
│   ├── isaacus_client.py      # Isaacus Legal AI API client
│   ├── document_processor.py  # Text extraction (PDF/DOCX/TXT)
│   └── deepseek_ocr.py        # OCR for scanned documents
└── tools/
    ├── isaacus_search.py      # Semantic document search + reranking
    ├── isaacus_extract.py     # Extractive QA with citations
    ├── isaacus_classify.py    # Legal clause classification
    ├── get_document_text.py   # Retrieve document text from Supabase
    └── list_matter_documents.py  # List documents in a matter
```

## Architecture

The agent uses a hierarchical delegation model with specialized subagents:

```
┌─────────────────────────────────────────────┐
│              Orchestrator                    │
│   Plans tasks, delegates, synthesizes       │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───────┐ ┌───▼───────┐ ┌───▼───────────┐
│ Research  │ │ Document  │ │ Future        │
│ Agent     │ │ Agent     │ │ Subagents     │
└─────┬─────┘ └─────┬─────┘ └───────────────┘
      │             │
┌─────▼─────┐ ┌─────▼───────────────────────┐
│  Tavily   │ │ • isaacus_search            │
│  Search   │ │ • isaacus_extract           │
└───────────┘ │ • isaacus_classify          │
              │ • get_document_text         │
              │ • list_matter_documents     │
              └─────────────────────────────┘
```

### Document Agent Tools

| Tool                     | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `isaacus_search`         | Semantic search + reranking across documents |
| `isaacus_extract`        | Extractive QA with document citations        |
| `isaacus_classify`       | Legal clause classification                  |
| `get_document_text`      | Retrieve full document text from Supabase    |
| `list_matter_documents`  | List all documents in a matter               |

## Development

```bash
# Run with hot reload
langgraph dev

# Lint
ruff check .
ruff format --check .

# Format
ruff format .

# Test the API
curl http://localhost:2024/health
```

## Adding Tools

1. Define the tool in `src/agent/tools.py`:

```python
from langchain_core.tools import tool

@tool(parse_docstring=True)
def my_tool(query: str) -> str:
    """Description of what this tool does.

    Args:
        query: The search query

    Returns:
        The search results
    """
    # Implementation
    return result
```

2. Register it in `src/agent/graph.py`.

## Modifying Prompts

Edit `src/agent/prompts.py` to customize the agent's behavior.

## Authentication

The agent validates JWT tokens from Supabase on every request:

1. Request includes JWT in `Authorization: Bearer <token>` header
2. Agent validates token against Supabase
3. User ID is extracted and used to scope all operations
4. Invalid tokens are rejected with 401

See `src/security/auth.py` for implementation.

## Deployment

Deploy to LangSmith:

1. Push code to GitHub
2. Go to [smith.langchain.com](https://smith.langchain.com) → Deployments
3. Create new deployment, connect your repo
4. Set **Path to LangGraph API** to `apps/agent`
5. Add environment variables
6. Deploy

See main `README.md` for full deployment guide.
