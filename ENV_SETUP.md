# Environment Configuration

> **NO FALLBACKS** – All environment variables are **required**. Missing variables throw errors immediately to catch configuration issues early.

## Quick Start

### 1. Frontend Setup

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit `apps/frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ASSISTANT_ID=deep_research

# Server-side (for API routes)
LANGGRAPH_API_URL=http://localhost:2024
LANGSMITH_API_KEY=your_langsmith_key
```

### 2. Agent Setup

```bash
cp apps/agent/.env.example apps/agent/.env
```

Edit `apps/agent/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Provider (choose one)
OPENAI_API_KEY=your_openai_key
# ANTHROPIC_API_KEY=your_anthropic_key

# External Services
TAVILY_API_KEY=your_tavily_key
ISAACUS_API_KEY=your_isaacus_key
ISAACUS_BASE_URL=https://api.isaacus.com

# LangSmith
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_TRACING=true
```

---

## Variable Reference

### Frontend Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | ✅ | Supabase anon/public key |
| `NEXT_PUBLIC_API_URL` | ✅ | API endpoint (use `/api`) |
| `NEXT_PUBLIC_ASSISTANT_ID` | ✅ | Agent graph name (`deep_research`) |
| `LANGGRAPH_API_URL` | ✅ | LangGraph server URL (server-side) |
| `LANGSMITH_API_KEY` | ✅ | LangSmith API key (server-side) |

### Agent Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `OPENAI_API_KEY` | ⚡ | OpenAI API key (or Anthropic) |
| `ANTHROPIC_API_KEY` | ⚡ | Anthropic API key (or OpenAI) |
| `TAVILY_API_KEY` | ✅ | Tavily search API key |
| `ISAACUS_API_KEY` | ✅ | Isaacus legal AI API key |
| `ISAACUS_BASE_URL` | ✅ | Isaacus API base URL |
| `LANGSMITH_API_KEY` | ✅ | LangSmith API key |
| `LANGSMITH_TRACING` | ✅ | Enable tracing (`true`) |

⚡ = One of these is required

---

## Production Configuration

### Vercel (Frontend)

Set in **Vercel Dashboard → Project → Settings → Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-production.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=production_anon_key
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ASSISTANT_ID=deep_research
LANGGRAPH_API_URL=https://your-deployment.langgraph.app
LANGSMITH_API_KEY=your_langsmith_key
```

### LangSmith (Agent)

Set in **LangSmith Dashboard → Deployment → Environment Variables**:

Use the same variables as local development with production credentials.

---

## Where to Get Keys

| Service | Dashboard | Key Location |
|---------|-----------|--------------|
| **Supabase** | [supabase.com/dashboard](https://supabase.com/dashboard) | Settings → API |
| **LangSmith** | [smith.langchain.com](https://smith.langchain.com) | Settings → API Keys |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | API Keys |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | API Keys |
| **Tavily** | [tavily.com](https://tavily.com/) | Dashboard |
| **Isaacus** | Contact admin | — |

---

## Helper Functions

The frontend uses `apps/frontend/src/lib/env.ts` for type-safe environment access:

```typescript
import { getApiUrl, getLangGraphApiUrl, getSupabaseConfig } from '@/lib/env';

// Client-side API URL
const apiUrl = getApiUrl();

// Server-side LangGraph URL
const langGraphUrl = getLangGraphApiUrl();

// Supabase config
const { url, anonKey } = getSupabaseConfig();
```

---

## Troubleshooting

### "Missing required environment variable"

1. Check variable name is exact (case-sensitive)
2. Ensure no trailing spaces or quotes in `.env` file
3. Restart dev server after changes

### Build fails in CI but works locally

CI uses dummy values for build validation. Ensure production variables are set in Vercel/LangSmith dashboards.

### "Invalid Supabase URL format"

Use format `https://xxxxx.supabase.co` (no trailing slash).

---

## Related Documentation

- [ONBOARDING.md](ONBOARDING.md) – New developer setup
- [docs/DEVOPS_LIFECYCLE.md](docs/DEVOPS_LIFECYCLE.md) – Full CI/CD documentation
- [docs/TROUBLESHOOTING_AUTH.md](docs/TROUBLESHOOTING_AUTH.md) – Auth issues
