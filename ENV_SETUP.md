# Environment Variable Configuration Guide

This guide explains how to configure environment variables for local development and production deployments.

## Overview

All environment variables are **required** (no hardcoded fallbacks) to ensure:
- Configuration issues are caught early
- Local and production environments are clearly differentiated
- No accidental use of wrong endpoints or credentials

---

## Frontend Configuration

### Local Development (`apps/frontend/.env.local`)

Create `.env.local` from the example:

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

**Required Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key

# API Configuration (client-side)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ASSISTANT_ID=deep_research

# Server-side API Configuration (for Next.js API routes)
LANGGRAPH_API_URL=http://localhost:2024
LANGSMITH_API_KEY=your_langsmith_key_optional_for_local
```

**Notes:**
- `NEXT_PUBLIC_API_URL`: Use `/api` for local development (uses Next.js API route proxy)
- `LANGGRAPH_API_URL`: Points to local LangGraph dev server (`http://localhost:2024`)
- `LANGSMITH_API_KEY`: Optional for local, only needed if using LangSmith tracing

---

### Production (Vercel)

Configure in **Vercel Dashboard → Project Settings → Environment Variables**

**Required Variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key

# API Configuration (client-side)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ASSISTANT_ID=deep_research

# Server-side API Configuration (REQUIRED in production)
LANGGRAPH_API_URL=https://your-deployment.langgraph.app
LANGSMITH_API_KEY=your_langsmith_key
```

**Notes:**
- `NEXT_PUBLIC_API_URL`: Always use `/api` (Next.js API route proxy)
- `LANGGRAPH_API_URL`: **Must** be set to your LangSmith deployment URL
- `LANGSMITH_API_KEY`: Required for authenticated requests to LangSmith

---

## Agent Configuration

### Local Development (`apps/agent/.env`)

Create `.env` from the example:

```bash
cp apps/agent/.env.example apps/agent/.env
```

**Required Variables:**

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# LLM Provider (choose one)
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key

# Web Search
TAVILY_API_KEY=your_tavily_key

# Legal AI
ISAACUS_API_KEY=your_isaacus_key
ISAACUS_BASE_URL=https://api.isaacus.com

# LangSmith (optional but recommended)
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_TRACING=true
```

---

### Production (LangSmith Deployment)

Configure in **LangSmith Dashboard → Deployment → Environment Variables**

**Required Variables:**

Same as local development, but use production values:
- `SUPABASE_URL`: Production Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Production service role key
- `ISAACUS_API_KEY`: Production Isaacus API key
- `LANGSMITH_API_KEY`: Required for tracing and monitoring

---

## Environment Variable Helper Functions

The frontend uses helper functions in `apps/frontend/src/lib/env.ts` to validate and retrieve environment variables:

```typescript
import { getApiUrl, getLangGraphApiUrl, getAssistantId, getSupabaseConfig } from '@/lib/env';

// Client-side API URL (uses NEXT_PUBLIC_API_URL, defaults to '/api')
const apiUrl = getApiUrl();

// Server-side LangGraph URL (uses LANGGRAPH_API_URL, required in production)
const langGraphUrl = getLangGraphApiUrl();

// Assistant ID (uses NEXT_PUBLIC_ASSISTANT_ID, defaults to 'deep_research')
const assistantId = getAssistantId();

// Supabase configuration (validates required variables)
const { url, anonKey } = getSupabaseConfig();
```

**Error Handling:**
- In **production**: Missing required variables throw errors immediately
- In **development**: Missing variables show helpful error messages

---

## Common Issues

### "Missing required environment variable"

**Cause**: Required environment variable is not set or is empty.

**Solution**: 
1. Check `.env.local` (frontend) or `.env` (agent) file exists
2. Verify variable name matches exactly (case-sensitive)
3. Ensure no trailing spaces or quotes around values
4. Restart dev server after changing `.env` files

### "Invalid Supabase URL format"

**Cause**: `NEXT_PUBLIC_SUPABASE_URL` doesn't match expected format.

**Solution**: Ensure URL is `https://xxxxx.supabase.co` (not `https://xxxxx.supabase.co/project` or trailing slash)

### Build fails in CI with environment errors

**Cause**: CI uses dummy values for build validation.

**Solution**: This is expected - CI builds with dummy values to validate structure. Ensure your production environment variables are set in Vercel/LangSmith dashboards.

---

## Migration from Hardcoded Values

If you have code using hardcoded fallbacks like:
```typescript
const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
```

**Replace with:**
```typescript
import { getLangGraphApiUrl } from '@/lib/env';
const API_URL = getLangGraphApiUrl();
```

This ensures:
- Production requires proper configuration
- Clear error messages if variables are missing
- No silent fallbacks to wrong endpoints

---

## Testing Configuration

### Validate Environment Variables

The helper functions validate environment variables at runtime. To test your configuration:

**Frontend:**
```typescript
import { validateEnv } from '@/lib/env';

// Call at app startup (e.g., in root layout or API route)
validateEnv();
```

**Agent:**
Environment validation happens automatically when the agent starts. Check logs for any missing variable warnings.

---

## Summary

| Environment | Frontend API URL | Agent API URL | Notes |
|-------------|------------------|---------------|-------|
| **Local** | `/api` (proxy) | `http://localhost:2024` | Dev server on port 2024 |
| **Production** | `/api` (proxy) | LangSmith URL | Must be set in Vercel |

**Key Principle**: No hardcoded fallbacks. All endpoints configured via environment variables for clear separation between local and production.

