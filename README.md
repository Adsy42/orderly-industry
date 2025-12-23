# Orderly - AI Legal Research Platform

An AI-powered legal research and document analysis platform for Australian legal professionals.

## 🎯 What This Is

**Orderly** is a full-stack AI assistant that helps lawyers:
- **Research** legal topics with web search and AI synthesis
- **Analyze documents** uploaded to client matters with semantic search
- **Extract answers** from contracts with precise citations
- **Classify clauses** in legal documents automatically

## ✅ Current Status

### Already Set Up (Production Ready)
| Component | Status | Location |
|-----------|--------|----------|
| **Supabase** | ✅ Running | `diqhctrkufrmoflvfuoh.supabase.co` |
| **Database** | ✅ Migrated | Profiles, Matters, Documents, Embeddings tables |
| **Storage** | ✅ Configured | `documents` bucket with RLS |
| **Edge Function** | ✅ Deployed | `process-document` for text extraction |
| **Frontend** | ✅ Deployable | Vercel preview on PRs |
| **Agent** | 🔄 Local only | Needs LangSmith Cloud deployment |

### Feature Status
| Feature | Status | Notes |
|---------|--------|-------|
| User Auth | ✅ Working | Email/password with Supabase |
| Matters CRUD | ✅ Working | Create, list, view matters |
| Document Upload | ✅ Working | PDF, DOCX, TXT support |
| Text Extraction | ✅ Working | Automatic on upload |
| Semantic Search | ✅ Working | Isaacus embeddings |
| Chat Interface | ✅ Working | LangGraph streaming |
| Document Analysis | ✅ Working | `get_document_text`, `isaacus_search`, etc. |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORDERLY PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  apps/frontend (Next.js 15)          apps/agent (Python 3.11)   │
│  ──────────────────────────          ─────────────────────────  │
│  • Chat UI with streaming            • LangGraph orchestrator    │
│  • Matter & Document mgmt            • Document Agent (Isaacus)  │
│  • Supabase Auth (cookies)           • Research Agent (Tavily)   │
│  → Deploys to Vercel                 → Deploys to LangSmith      │
│                                                                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
     ┌────────▼────┐  ┌─────▼─────┐  ┌────▼────────┐
     │  Supabase   │  │  Isaacus  │  │   Tavily    │
     │  Auth + DB  │  │  Legal AI │  │  Web Search │
     │  + Storage  │  │  API      │  │   API       │
     └─────────────┘  └───────────┘  └─────────────┘
```

## 🚀 Quick Start (For Development)

### Prerequisites
- Node.js 20+, pnpm 9+, Python 3.11+
- Access to Supabase project (ask Adam)
- Your own API keys for Anthropic/OpenAI, Tavily

### 1. Clone & Install

```bash
git clone https://github.com/Adsy42/orderly-industry.git
cd orderly-industry
pnpm install

cd apps/agent
pip install -e ".[dev]"  # or: uv sync
cd ../..
```

### 2. Environment Setup

Get `.env` files from Adam or copy examples:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/agent/.env.example apps/agent/.env
```

**Key variables already configured:**
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Shared project credentials
- `ISAACUS_API_KEY` - Legal AI API (shared)

**You need your own:**
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- `TAVILY_API_KEY` (free tier available)
- `LANGSMITH_API_KEY` (for tracing)

### 3. Run Locally

```bash
# Terminal 1: Start agent
cd apps/agent && langgraph dev

# Terminal 2: Start frontend  
pnpm dev

# Or both together:
pnpm dev:all
```

- **Frontend**: http://localhost:3000
- **Agent API**: http://localhost:2024
- **LangGraph Studio**: Opens automatically

## 📁 Project Structure

```
orderly-industry/
├── apps/
│   ├── frontend/              # Next.js 15 Chat UI
│   │   ├── src/app/
│   │   │   ├── auth/          # Login, signup, password reset
│   │   │   └── protected/
│   │   │       ├── chat/      # Main chat interface
│   │   │       └── matters/   # Matter & document management
│   │   └── src/components/
│   │       ├── documents/     # Upload, list, search
│   │       ├── matters/       # Matter CRUD
│   │       └── thread/        # Chat components
│   │
│   └── agent/                 # Python LangGraph Agent
│       └── src/
│           ├── agent/         # Main orchestrator graph
│           ├── agents/        # Subagents (document, research)
│           ├── tools/         # Isaacus tools, Tavily, etc.
│           └── services/      # API clients
│
├── supabase/
│   ├── migrations/            # Database schema (already applied)
│   └── functions/             # Edge functions
│       └── process-document/  # Text extraction on upload
│
└── specs/                     # Feature specifications
    └── 004-matters-documents/ # Current feature docs
```

## 🔧 Key Files to Know

| File | Purpose |
|------|---------|
| `apps/agent/src/agent/graph.py` | Main agent with subagents |
| `apps/agent/src/agent/prompts.py` | System prompts - customize behavior |
| `apps/agent/src/tools/*.py` | Document analysis tools |
| `apps/frontend/src/providers/Stream.tsx` | Chat streaming logic |
| `supabase/functions/process-document/` | Document processing edge function |

## 🧪 Testing Document Analysis

1. Log in at http://localhost:3000
2. Create a matter (or use existing "Test Case")
3. Upload a PDF or DOCX document
4. Wait for status to change from "Processing" to "Ready"
5. Open chat, select the matter from dropdown
6. Ask: "What's in this document?" or "Summarize the agreement"

## 🚢 Deployment

### Frontend → Vercel (Automatic)
- PRs get preview deployments
- Merges to `main` deploy to production
- Environment variables configured in Vercel dashboard

### Agent → LangSmith Cloud (Manual)
1. Go to [smith.langchain.com](https://smith.langchain.com) → Deployments
2. Create new deployment, connect GitHub repo
3. Set path to `apps/agent`
4. Add environment variables
5. Deploy

**Current Blocker**: The staging environment is using an old agent deployment with different tools. Need to redeploy to sync.

### Database → Supabase (Automatic)
- PRs get preview branches (via `preview-supabase.yml`)
- Migrations applied automatically

## 🔑 Environment Variables

### Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://diqhctrkufrmoflvfuoh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_API_URL=http://localhost:2024  # or LangSmith URL
NEXT_PUBLIC_ASSISTANT_ID=deep_research
LANGGRAPH_API_URL=<LangSmith deployment URL>  # for production
LANGSMITH_API_KEY=<your key>
```

### Agent (LangSmith)
```env
SUPABASE_URL=https://diqhctrkufrmoflvfuoh.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_ROLE_KEY=<key>  # Required for document tools
OPENAI_API_KEY=<your key>
TAVILY_API_KEY=<your key>
ISAACUS_API_KEY=<shared key>
LANGSMITH_API_KEY=<your key>
```

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| [ONBOARDING.md](ONBOARDING.md) | Quick setup for new devs |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Dev workflow & conventions |
| [specs/004-matters-documents/](specs/004-matters-documents/) | Current feature docs |

## 🐛 Known Issues

1. **Staging agent has wrong tools** - LangSmith deployment needs resyncing with GitHub
2. **Search threshold** - Default 0.3 may miss some results, consider lowering

## 👥 Team

- **Adam** - Full-stack, AI agent development
- Ask Adam for Supabase/Vercel/LangSmith access

## License

Private - All rights reserved
