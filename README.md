# Deep Research Agent

A full-stack AI research assistant combining a Next.js chat interface with a LangGraph-powered deep research agent.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Monorepo Structure                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  apps/frontend (Next.js)              apps/agent (Python)            │
│  ─────────────────────                ───────────────────            │
│  • Chat UI                            • Deep Research Agent          │
│  • Supabase Auth                      • JWT Validation               │
│  • API Passthrough                    • Web Search Tools             │
│  → Deployed to Vercel                 → Deployed to LangSmith        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │  (Auth + JWT)   │
                    └─────────────────┘
```

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Python** >= 3.11
- **Supabase Account** (for authentication)
- **LangSmith Account** (for agent deployment)
- **API Keys**: Anthropic or OpenAI, Tavily (for web search)

## Quick Start

> 📋 **New to the project?** See [ONBOARDING.md](ONBOARDING.md) for a quick setup guide.

### 1. Clone and Install

```bash
# Install dependencies
pnpm install

# Install Python dependencies
cd apps/agent
pip install -e ".[dev]"
cd ../..
```

### 2. Configure Environment Variables

**Frontend** (`apps/frontend/.env.local`):

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit with your Supabase credentials
```

**Agent** (`apps/agent/.env`):

```bash
cp apps/agent/.env.example apps/agent/.env
# Edit with your API keys
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**
3. Copy the **Project URL** and **anon public** key
4. Add them to both `.env.local` (frontend) and `.env` (agent)

**Note:** The frontend uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` for the Supabase key.

#### Optional: Local Supabase Development

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset
```

### 4. Run Locally

```bash
# Terminal 1: Start the agent server
pnpm dev:agent

# Terminal 2: Start the frontend
pnpm dev

# Or run both together
pnpm dev:all
```

- Frontend: http://localhost:3000
- Agent API: http://localhost:2024

## Project Structure

```
.
├── apps/
│   ├── frontend/                 # Next.js Chat UI
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/          # API passthrough routes
│   │   │   │   ├── auth/         # Auth pages (Supabase UI block)
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── sign-up/
│   │   │   │   │   ├── forgot-password/
│   │   │   │   │   ├── update-password/
│   │   │   │   │   ├── confirm/  # Email verification
│   │   │   │   │   └── error/
│   │   │   │   └── chat/         # Main chat page
│   │   │   ├── components/       # React components
│   │   │   ├── lib/
│   │   │   │   └── supabase/     # Supabase client (browser/server)
│   │   │   └── providers/        # Context providers
│   │   ├── middleware.ts         # Auth protection middleware
│   │   └── package.json
│   │
│   └── agent/                    # Deep Research Agent
│       ├── src/
│       │   ├── agent/
│       │   │   ├── graph.py      # Main graph definition
│       │   │   ├── prompts.py    # System prompts
│       │   │   └── tools.py      # Search tools
│       │   └── security/
│       │       └── auth.py       # JWT validation
│       ├── langgraph.json        # LangSmith config
│       └── pyproject.toml
│
├── supabase/
│   ├── config.toml               # Local dev config
│   └── migrations/               # Database migrations
│       └── 20251223110000_create_profiles.sql
│
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml
└── README.md
```

## Development

### Available Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Start frontend (port 3000)     |
| `pnpm dev:agent` | Start agent server (port 2024) |
| `pnpm dev:all`   | Start both concurrently        |
| `pnpm build`     | Build frontend for production  |
| `pnpm lint`      | Run ESLint on frontend         |

### Testing the Agent

You can test the agent directly using the LangGraph CLI:

```bash
cd apps/agent
langgraph dev
```

Then open http://localhost:2024/docs to see the API documentation.

## Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set **Root Directory** to `apps/frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (your domain + `/api`)
   - `NEXT_PUBLIC_ASSISTANT_ID` (`deep_research`)
   - `LANGGRAPH_API_URL` (from LangSmith deployment)
   - `LANGSMITH_API_KEY`
5. Deploy

### Agent → LangSmith

1. Push your code to GitHub
2. Go to [smith.langchain.com](https://smith.langchain.com) → **Deployments**
3. Click **+ New Deployment**
4. Connect your GitHub repository
5. Set **Path to LangGraph API** to `apps/agent`
6. Add environment variables from `apps/agent/.env.example`
7. Deploy (takes ~15 minutes)

### Environment Variables Summary

#### Frontend (Vercel)

| Variable                                       | Description                | Required   |
| ---------------------------------------------- | -------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL       | Yes        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon key          | Yes        |
| `NEXT_PUBLIC_API_URL`                          | API endpoint URL           | Yes        |
| `NEXT_PUBLIC_ASSISTANT_ID`                     | Graph ID (`deep_research`) | Yes        |
| `LANGGRAPH_API_URL`                            | LangSmith deployment URL   | Production |
| `LANGSMITH_API_KEY`                            | LangSmith API key          | Production |

#### Agent (LangSmith)

| Variable            | Description           | Required |
| ------------------- | --------------------- | -------- |
| `SUPABASE_URL`      | Supabase project URL  | Yes      |
| `SUPABASE_ANON_KEY` | Supabase anon key     | Yes      |
| `ANTHROPIC_API_KEY` | Anthropic API key     | Yes      |
| `TAVILY_API_KEY`    | Tavily search API key | Yes      |
| `LANGSMITH_API_KEY` | LangSmith API key     | Auto-set |

## Authentication Flow

The authentication is built using the [Supabase UI password-based auth block](https://supabase.com/ui/docs/nextjs/password-based-auth) which provides:

- Login / Sign up / Forgot password / Update password pages
- Email confirmation flow
- Middleware-based route protection
- Server and client Supabase clients

```
1. User → Frontend: Login with email/password
2. Frontend → Supabase: Authenticate user
3. Supabase → Frontend: Return JWT token (stored in cookies)
4. Frontend → Agent: Request with JWT in Authorization header
5. Agent → Supabase: Validate JWT token
6. Agent → Frontend: Return response (scoped to user)
```

All threads and conversations are automatically scoped to the authenticated user.

### Email Templates

Configure email templates in your Supabase project for:

- **Sign up confirmation**: Redirect to `/auth/confirm`
- **Password reset**: Redirect to `/auth/confirm` with type=recovery

See the [Supabase docs](https://supabase.com/ui/docs/nextjs/password-based-auth#adding-email-templates) for template examples.

## Customization

### Changing the LLM Model

Edit `apps/agent/src/agent/graph.py`:

```python
# Use Claude Sonnet
model = init_chat_model(model="anthropic:claude-sonnet-4-5-20250929")

# Or use GPT-4
model = init_chat_model(model="openai:gpt-4o")

# Or use Gemini
model = ChatGoogleGenerativeAI(model="gemini-3-pro-preview")
```

### Adding Custom Tools

Edit `apps/agent/src/agent/tools.py` to add new tools, then register them in `graph.py`.

### Modifying System Prompts

Edit `apps/agent/src/agent/prompts.py` to customize the agent's behavior.

## License

MIT
