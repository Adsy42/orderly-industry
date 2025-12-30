# Complete Environment Variables Reference

**NO FALLBACKS** - All variables listed below are **REQUIRED**. Missing variables will throw errors at runtime.

---

## 📋 Frontend Environment Variables

### Local Development (`apps/frontend/.env.local`)

Create this file: `apps/frontend/.env.local`

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key_here
# OR use this instead:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# ============================================
# REQUIRED: API Configuration
# ============================================
# Client-side API URL (use '/api' for Next.js proxy)
NEXT_PUBLIC_API_URL=/api

# Server-side LangGraph agent URL (for API routes)
LANGGRAPH_API_URL=http://localhost:2024

# LangSmith API key (for authenticated requests)
LANGSMITH_API_KEY=your_langsmith_api_key_here

# ============================================
# REQUIRED: Assistant/Graph Configuration
# ============================================
NEXT_PUBLIC_ASSISTANT_ID=deep_research
```

**Note**: Copy these values from your Supabase project dashboard and LangSmith settings.

---

### Production (Vercel)

Configure in **Vercel Dashboard → Project → Settings → Environment Variables**

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_production_anon_key
# OR use this instead:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# ============================================
# REQUIRED: API Configuration
# ============================================
# Client-side API URL (always '/api' for Next.js proxy)
NEXT_PUBLIC_API_URL=/api

# Server-side LangGraph agent URL (your LangSmith deployment URL)
LANGGRAPH_API_URL=https://your-deployment-xxxxx.us.langgraph.app

# LangSmith API key (for authenticated requests)
LANGSMITH_API_KEY=your_langsmith_api_key_here

# ============================================
# REQUIRED: Assistant/Graph Configuration
# ============================================
NEXT_PUBLIC_ASSISTANT_ID=deep_research
```

**Important**: 
- Set these for **Production** environment in Vercel
- `LANGGRAPH_API_URL` must be your actual LangSmith deployment URL
- Get `LANGSMITH_API_KEY` from [LangSmith Settings → API Keys](https://smith.langchain.com/settings)

---

## 🐍 Agent Environment Variables

### Local Development (`apps/agent/.env`)

Create this file: `apps/agent/.env`

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# REQUIRED: LLM Provider (choose one)
# ============================================
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# ============================================
# REQUIRED: Web Search
# ============================================
TAVILY_API_KEY=your_tavily_api_key_here

# ============================================
# REQUIRED: Legal AI Services
# ============================================
ISAACUS_API_KEY=your_isaacus_api_key_here
ISAACUS_BASE_URL=https://api.isaacus.com

# ============================================
# REQUIRED: LangSmith (for tracing/monitoring)
# ============================================
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_TRACING=true
```

**Notes**:
- `SUPABASE_SERVICE_ROLE_KEY` is required for document tools (bypasses RLS)
- Choose **one** LLM provider: either `OPENAI_API_KEY` OR `ANTHROPIC_API_KEY`
- Get `TAVILY_API_KEY` from [Tavily](https://tavily.com/) (free tier available)
- Get `ISAACUS_API_KEY` from [Isaacus](https://isaacus.com/)

---

### Production (LangSmith Deployment)

Configure in **LangSmith Dashboard → Deployment → Environment Variables**

```env
# ============================================
# REQUIRED: Supabase Configuration
# ============================================
SUPABASE_URL=https://your-production-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# ============================================
# REQUIRED: LLM Provider (choose one)
# ============================================
OPENAI_API_KEY=your_production_openai_key
# OR
ANTHROPIC_API_KEY=your_production_anthropic_key

# ============================================
# REQUIRED: Web Search
# ============================================
TAVILY_API_KEY=your_production_tavily_key

# ============================================
# REQUIRED: Legal AI Services
# ============================================
ISAACUS_API_KEY=your_production_isaacus_key
ISAACUS_BASE_URL=https://api.isaacus.com

# ============================================
# REQUIRED: LangSmith (for tracing/monitoring)
# ============================================
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_TRACING=true
```

**Important**: Use production values for all keys (same as local but with production credentials).

---

## 🔑 Where to Get These Values

### Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` / `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### LangSmith

1. Go to [LangSmith Settings](https://smith.langchain.com/settings)
2. Copy **API Key** → `LANGSMITH_API_KEY`
3. Get deployment URL from **Deployments** → Your deployment → Copy URL → `LANGGRAPH_API_URL`

### OpenAI

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new key → `OPENAI_API_KEY`

### Anthropic

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Go to **API Keys**
3. Create new key → `ANTHROPIC_API_KEY`

### Tavily

1. Go to [Tavily](https://tavily.com/)
2. Sign up for free tier
3. Get API key from dashboard → `TAVILY_API_KEY`

### Isaacus

1. Get API key from project admin or [Isaacus](https://isaacus.com/)
2. Copy → `ISAACUS_API_KEY`
3. Base URL is typically: `https://api.isaacus.com`

---

## 📝 Quick Setup Checklist

### Local Development

- [ ] Create `apps/frontend/.env.local` with frontend variables
- [ ] Create `apps/agent/.env` with agent variables
- [ ] Verify all values are set (no placeholders)
- [ ] Restart dev servers after adding variables

### Production

- [ ] Set all frontend variables in **Vercel → Settings → Environment Variables** (Production)
- [ ] Set all agent variables in **LangSmith → Deployment → Environment Variables**
- [ ] Verify `LANGGRAPH_API_URL` matches your LangSmith deployment URL
- [ ] Redeploy after adding variables

---

## ⚠️ Important Notes

1. **NO FALLBACKS**: All variables are required. Missing variables will throw errors.

2. **Service Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` is sensitive. Never commit it to git or expose it client-side.

3. **API Keys**: Use different keys for local development and production when possible.

4. **Next.js Public Variables**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Only use for non-sensitive values.

5. **Environment Names**: 
   - Local: `.env.local` (frontend) and `.env` (agent)
   - Vercel: Set in dashboard for each environment (Production, Preview, Development)
   - LangSmith: Set in deployment settings

6. **Restart Required**: After adding/changing environment variables:
   - **Local**: Restart dev servers (`pnpm dev`)
   - **Vercel**: Redeploy (automatic on push or manual)
   - **LangSmith**: Redeploy deployment

---

## 🔍 Verification

### Verify Frontend Variables

```bash
cd apps/frontend
# Check that .env.local exists
ls -la .env.local

# Verify variables are loaded (don't commit this!)
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Supabase URL set' : '❌ Missing');"
```

### Verify Agent Variables

```bash
cd apps/agent
# Check that .env exists
ls -la .env

# Verify with Python (if you have access)
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print('✅ SUPABASE_URL set' if os.getenv('SUPABASE_URL') else '❌ Missing')"
```

---

## 🚨 Common Issues

### "Missing required environment variable"

**Cause**: Variable not set or empty

**Fix**: 
1. Check variable name matches exactly (case-sensitive)
2. Ensure no quotes around values in `.env` files
3. Restart dev server after adding variables
4. Check file location (`apps/frontend/.env.local` vs `apps/agent/.env`)

### Build fails in CI but works locally

**Cause**: CI environment variables not set

**Fix**: CI uses dummy values for build validation. Ensure production environment variables are set in Vercel/LangSmith dashboards.

### "Invalid Supabase URL format"

**Cause**: URL doesn't match expected format

**Fix**: Use format `https://xxxxx.supabase.co` (no trailing slash, no `/project` path)

---

## 📚 Related Documentation

- `ENV_SETUP.md` - Detailed environment setup guide
- `README.md` - Project overview and quick start
- `ONBOARDING.md` - New developer setup guide

