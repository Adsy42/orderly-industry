# Deep Research Agent

Python LangGraph agent for deep research with web search capabilities.

## Quick Start

```bash
# Install dependencies
pip install -e ".[dev]"

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run development server
langgraph dev
```

The agent API will be available at [http://localhost:2024](http://localhost:2024).

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable            | Description                   | Required    |
| ------------------- | ----------------------------- | ----------- |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude  | Yes         |
| `TAVILY_API_KEY`    | Tavily API key for web search | Yes         |
| `SUPABASE_URL`      | Supabase project URL          | Yes         |
| `SUPABASE_ANON_KEY` | Supabase anon key             | Yes         |
| `LANGSMITH_API_KEY` | LangSmith API key             | Recommended |
| `LANGSMITH_TRACING` | Enable tracing (`true`)       | Recommended |

## Project Structure

```
src/
├── agent/
│   ├── graph.py        # Main graph definition
│   ├── prompts.py      # System prompts
│   └── tools.py        # Search tools (Tavily)
└── security/
    └── auth.py         # JWT validation against Supabase
```

## Architecture

The agent uses a hierarchical delegation model:

```
┌─────────────────────────────────────────────┐
│              Orchestrator                    │
│   Plans research, delegates, synthesizes    │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼───────┐           ┌───────▼───┐
│ Sub-agent │           │ Sub-agent │
│ (focused) │           │ (focused) │
└─────┬─────┘           └─────┬─────┘
      │                       │
┌─────▼─────┐           ┌─────▼─────┐
│  Tavily   │           │  Tavily   │
│  Search   │           │  Search   │
└───────────┘           └───────────┘
```

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
