# Authentication Flow Specification

## Overview

The Deep Research Agent uses Supabase Auth for user authentication with a JWT-based authorization flow. The frontend manages user sessions via cookies, and the agent validates JWT tokens on every request.

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Authentication Flow                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │   Next.js    │         │   Supabase   │
│   (Client)   │         │   (Server)   │         │    (Auth)    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  1. Login Request      │                        │
       │───────────────────────>│                        │
       │                        │  2. Authenticate       │
       │                        │───────────────────────>│
       │                        │                        │
       │                        │  3. Return JWT + User  │
       │                        │<───────────────────────│
       │  4. Set Cookies        │                        │
       │<───────────────────────│                        │
       │                        │                        │

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │   Next.js    │         │   LangGraph  │
│   (Client)   │         │   (API)      │         │   (Agent)    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  5. Chat Request       │                        │
       │   (with cookies)       │                        │
       │───────────────────────>│                        │
       │                        │  6. Forward + JWT      │
       │                        │───────────────────────>│
       │                        │                        │
       │                        │                        │  7. Validate JWT
       │                        │                        │     with Supabase
       │                        │                        │────────┐
       │                        │                        │        │
       │                        │                        │<───────┘
       │                        │  8. Response           │
       │                        │   (scoped to user)     │
       │                        │<───────────────────────│
       │  9. Render Response    │                        │
       │<───────────────────────│                        │
```

## Frontend Authentication

### Supabase Clients

**Browser Client (`apps/frontend/src/lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )
}
```

**Server Client (`apps/frontend/src/lib/supabase/server.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Middleware Protection

**Location:** `apps/frontend/src/middleware.ts`

**Protected Routes:**
- `/protected/*` - Requires authentication
- `/` - Redirects authenticated users

**Public Routes:**
- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/confirm`
- `/auth/error`

### Auth Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/auth/login` | `login-form.tsx` | Email/password login |
| `/auth/sign-up` | `sign-up-form.tsx` | New user registration |
| `/auth/sign-up-success` | Static page | Confirmation email sent |
| `/auth/forgot-password` | `forgot-password-form.tsx` | Password reset request |
| `/auth/update-password` | `update-password-form.tsx` | Set new password |
| `/auth/confirm` | Route handler | Email verification |
| `/auth/error` | Error page | Auth error display |

## Agent Authentication

### JWT Validation

**Location:** `apps/agent/src/security/auth.py`

**Handler:**
```python
@auth.authenticate
async def authenticate(headers: dict[bytes, bytes]) -> Auth.types.MinimalUserDict:
    # Extract Bearer token
    authorization = headers.get(b"authorization", b"").decode()
    
    if not authorization.startswith("Bearer "):
        raise Auth.exceptions.HTTPException(status_code=401)
    
    token = authorization.replace("Bearer ", "")
    
    # Validate with Supabase
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
        )
    
    if response.status_code != 200:
        raise Auth.exceptions.HTTPException(status_code=401)
    
    user_data = response.json()
    return {
        "identity": user_data["id"],
        "email": user_data.get("email"),
        "is_authenticated": True,
    }
```

### Resource Scoping

All resources (threads, runs) are automatically scoped to the authenticated user:

```python
@auth.on
async def add_owner(ctx: Auth.types.AuthContext, value: dict[str, Any]) -> dict[str, str]:
    filters = {"owner": ctx.user.identity}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters
```

**Effect:**
- New resources get `owner: {user_id}` in metadata
- Queries are filtered to only return user's own resources
- Users cannot access other users' threads or conversations

## API Passthrough

The frontend proxies requests to the agent through Next.js API routes.

**Location:** `apps/frontend/src/app/api/[..._path]/route.ts`

**Flow:**
1. Client makes request to `/api/{path}`
2. Next.js extracts session from cookies
3. Forwards request to `LANGGRAPH_API_URL/{path}`
4. Injects `Authorization: Bearer {jwt}` header
5. Injects `x-api-key: {LANGSMITH_API_KEY}` for auth
6. Returns response to client

## Session Management

### Token Storage

- Tokens stored in HTTP-only cookies
- Managed by `@supabase/ssr` package
- Automatic refresh via middleware

### Token Refresh

The middleware refreshes expired sessions:
```typescript
// In middleware.ts
const { data: { session } } = await supabase.auth.getSession()
// Session is automatically refreshed if needed
```

### Logout

```typescript
await supabase.auth.signOut()
// Cookies are cleared, user redirected to login
```

## Email Verification

### Confirmation Flow

1. User signs up → confirmation email sent
2. User clicks link → redirected to `/auth/confirm?token_hash=...`
3. Route handler exchanges token for session
4. User redirected to protected area

### Email Templates

Configure in Supabase Dashboard:
- **Sign up confirmation**: Redirect to `/auth/confirm`
- **Password reset**: Redirect to `/auth/confirm?type=recovery`

## Environment Variables

### Frontend
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbG...
```

### Agent
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

## Security Considerations

1. **Never trust client-side auth alone** - Always validate JWT on agent
2. **Use HTTP-only cookies** - Prevents XSS token theft
3. **Validate on every request** - No cached auth state on agent
4. **Scope all resources** - Users see only their own data
5. **Handle errors gracefully** - 401 for invalid tokens, 503 for Supabase unavailable

## Error Handling

| HTTP Status | Meaning | User Experience |
|-------------|---------|-----------------|
| 401 | Token missing or invalid | Redirect to login |
| 403 | Token valid but unauthorized | Access denied message |
| 503 | Supabase unavailable | Retry message |

## Extension Points

### Adding OAuth Providers

1. Configure provider in Supabase Dashboard
2. Add OAuth button to login form
3. Handle callback in `/auth/confirm` route

### Adding Role-Based Access

1. Store roles in `raw_app_meta_data` (not `raw_user_meta_data`)
2. Access via `auth.jwt() -> 'app_metadata' -> 'role'` in RLS
3. Add role checks to agent auth handler

