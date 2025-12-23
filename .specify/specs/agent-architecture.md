# Agent Architecture Specification

## Overview

The Deep Research Agent is a LangGraph-powered research assistant that conducts comprehensive web research through a hierarchical delegation model. It uses orchestrator-subagent coordination to break down research questions into manageable tasks.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Orchestrator Agent                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Receives user research questions                         │  │
│  │ • Creates TODO list to plan research                       │  │
│  │ • Delegates tasks to research sub-agents                   │  │
│  │ • Synthesizes findings into final report                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Research Agent  │ │  Research Agent  │ │  Research Agent  │
│   (Sub-agent 1)  │ │   (Sub-agent 2)  │ │   (Sub-agent N)  │
│                  │ │                  │ │                  │
│  Tools:          │ │  Tools:          │ │  Tools:          │
│  • tavily_search │ │  • tavily_search │ │  • tavily_search │
│  • think_tool    │ │  • think_tool    │ │  • think_tool    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Final Research Report                        │
│                    (/final_report.md)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### Orchestrator Agent

**Location:** `apps/agent/src/agent/graph.py`

**Responsibilities:**

1. Parse and understand user research requests
2. Create a structured TODO list for research planning
3. Save the original research question to `/research_request.md`
4. Delegate research tasks to sub-agents
5. Consolidate citations from all sub-agent findings
6. Write comprehensive final report to `/final_report.md`
7. Verify report addresses all aspects of the original request

**Configuration:**

```python
agent = create_deep_agent(
    model=model,
    tools=[tavily_search, think_tool],
    system_prompt=INSTRUCTIONS,
    subagents=[research_sub_agent],
)
```

**Limits:**

- Maximum concurrent research units: 3
- Maximum researcher iterations: 3

### Research Sub-Agent

**Definition:**

```python
research_sub_agent = {
    "name": "research-agent",
    "description": "Delegate research to the sub-agent researcher. Only give this researcher one topic at a time.",
    "system_prompt": RESEARCHER_INSTRUCTIONS.format(date=current_date),
    "tools": [tavily_search, think_tool],
}
```

**Responsibilities:**

1. Execute focused web searches on delegated topics
2. Use strategic reflection to assess research progress
3. Gather relevant sources and evidence
4. Format findings with inline citations
5. Return structured findings to orchestrator

**Tool Call Limits:**

- Simple queries: 2-3 search calls maximum
- Complex queries: up to 5 search calls maximum
- Stop after 5 searches if sources not found

### Tools

#### tavily_search

**Purpose:** Web search with full content retrieval

**Location:** `apps/agent/src/agent/tools.py`

**Signature:**

```python
@tool(parse_docstring=True)
def tavily_search(
    query: str,
    max_results: Annotated[int, InjectedToolArg] = 1,
    topic: Annotated[Literal["general", "news", "finance"], InjectedToolArg] = "general",
) -> str
```

**Behavior:**

1. Uses Tavily API to discover relevant URLs
2. Fetches full webpage content for each URL
3. Converts HTML to markdown
4. Returns formatted results with title, URL, and content

#### think_tool

**Purpose:** Strategic reflection and decision-making

**Location:** `apps/agent/src/agent/tools.py`

**Signature:**

```python
@tool(parse_docstring=True)
def think_tool(reflection: str) -> str
```

**Usage:**

- After each search to analyze results
- Before deciding next steps
- When assessing research gaps
- Before concluding research

## Prompts

### RESEARCH_WORKFLOW_INSTRUCTIONS

**Location:** `apps/agent/src/agent/prompts.py`

**Content:**

- Research workflow (Plan → Delegate → Research → Synthesize → Write)
- Research planning guidelines
- Report writing guidelines with structure patterns
- Citation format specifications

### RESEARCHER_INSTRUCTIONS

**Purpose:** Instructions for research sub-agents

**Key Elements:**

- Task description and available tools
- Step-by-step research methodology
- Hard limits on tool usage
- Reflection requirements
- Response format with citation guidelines

### SUBAGENT_DELEGATION_INSTRUCTIONS

**Purpose:** Guidelines for orchestrator when delegating

**Key Principles:**

- Default to single sub-agent for most queries
- Parallelize only for explicit comparisons
- Bias toward focused over exhaustive exploration
- Maximum 3 parallel sub-agents per iteration

## Model Configuration

**Current Default:**

```python
model = init_chat_model(model="openai:gpt-4o", temperature=0.0)
```

**Alternatives:**

```python
# Anthropic Claude Sonnet
model = init_chat_model(model="anthropic:claude-sonnet-4-5-20250929", temperature=0.0)

# Google Gemini
model = ChatGoogleGenerativeAI(model="gemini-3-pro-preview", temperature=0.0)
```

## Authentication

All agent requests are authenticated via Supabase JWT validation.

**Location:** `apps/agent/src/security/auth.py`

**Flow:**

1. Extract `Authorization: Bearer {token}` from request headers
2. Validate token against Supabase Auth API
3. Return user identity for resource scoping
4. Add `owner` metadata to all created resources

## Deployment

**Platform:** LangSmith

**Configuration File:** `apps/agent/langgraph.json`

**Required Environment Variables:**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `TAVILY_API_KEY`

## Extension Points

### Adding New Tools

1. Define tool in `apps/agent/src/agent/tools.py`
2. Use `@tool(parse_docstring=True)` decorator
3. Document args in docstring
4. Register in `graph.py` tools list
5. Update sub-agent tool access if needed

### Adding New Sub-Agents

1. Define sub-agent configuration dict
2. Include name, description, system_prompt, tools
3. Add to `subagents` list in `create_deep_agent()`
4. Update orchestrator prompts for delegation awareness

### Modifying Research Behavior

1. Edit prompts in `apps/agent/src/agent/prompts.py`
2. Adjust limits: `max_concurrent_research_units`, `max_researcher_iterations`
3. Update delegation guidelines in `SUBAGENT_DELEGATION_INSTRUCTIONS`

## Quality Metrics

Research quality is evaluated on:

1. Comprehensiveness - all aspects of question addressed
2. Citation accuracy - sources properly referenced
3. Structure - appropriate report format for question type
4. Efficiency - minimal unnecessary tool calls
5. Clarity - professional writing without self-reference

