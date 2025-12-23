# Database Schema Specification

## Overview

The Deep Research Agent uses Supabase PostgreSQL for user data storage. All tables implement Row Level Security (RLS) to ensure users can only access their own data.

## Current Schema

### profiles

**Purpose:** Store user profile information linked to Supabase Auth users.

**Location:** `supabase/migrations/20251223110000_create_profiles.sql`

**Schema:**

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

**Indexes:**

```sql
create index profiles_email_idx on public.profiles using btree (email);
```

**RLS Policies:**

| Policy                                       | Operation | Role          | Condition         |
| -------------------------------------------- | --------- | ------------- | ----------------- |
| Profiles are viewable by authenticated users | SELECT    | authenticated | `true`            |
| Profiles are viewable by anonymous users     | SELECT    | anon          | `true`            |
| Users can insert their own profile           | INSERT    | authenticated | `auth.uid() = id` |
| Users can update their own profile           | UPDATE    | authenticated | `auth.uid() = id` |
| Users can delete their own profile           | DELETE    | authenticated | `auth.uid() = id` |

**Triggers:**

1. **on_auth_user_created** - Automatically creates profile when user signs up
2. **update_profiles_updated_at** - Updates `updated_at` on row modification

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Current Schema                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│      auth.users      │              │    public.profiles   │
│    (Supabase Auth)   │              │                      │
├──────────────────────┤              ├──────────────────────┤
│ id (uuid) PK         │──────────────│ id (uuid) PK FK      │
│ email                │              │ email                │
│ raw_user_meta_data   │              │ display_name         │
│ raw_app_meta_data    │              │ avatar_url           │
│ created_at           │              │ created_at           │
│ ...                  │              │ updated_at           │
└──────────────────────┘              └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           Planned Extensions                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐              ┌──────────────────────┐
│    public.profiles   │              │  public.conversations│
│                      │              │      (planned)       │
├──────────────────────┤              ├──────────────────────┤
│ id (uuid) PK         │──────────────│ user_id (uuid) FK    │
│ ...                  │              │ id (uuid) PK         │
│                      │              │ title                │
│                      │              │ thread_id            │
│                      │              │ created_at           │
│                      │              │ updated_at           │
└──────────────────────┘              └──────────────────────┘
                                                │
                                                │
                                      ┌─────────▼──────────┐
                                      │ public.artifacts   │
                                      │     (planned)      │
                                      ├────────────────────┤
                                      │ id (uuid) PK       │
                                      │ conversation_id FK │
                                      │ type               │
                                      │ content            │
                                      │ created_at         │
                                      └────────────────────┘
```

## Planned Tables

### conversations (Planned)

**Purpose:** Store conversation metadata for research threads.

**Schema (proposed):**

```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  thread_id text not null, -- LangGraph thread ID
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.conversations is 'User conversations linking to LangGraph threads.';
```

**Indexes:**

```sql
create index conversations_user_id_idx on public.conversations using btree (user_id);
create index conversations_thread_id_idx on public.conversations using btree (thread_id);
```

**RLS Policies:**

```sql
-- SELECT: Users can view their own conversations
create policy "Users can view own conversations"
on public.conversations for select to authenticated
using ( (select auth.uid()) = user_id );

-- INSERT: Users can create conversations for themselves
create policy "Users can create own conversations"
on public.conversations for insert to authenticated
with check ( (select auth.uid()) = user_id );

-- UPDATE: Users can update their own conversations
create policy "Users can update own conversations"
on public.conversations for update to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

-- DELETE: Users can delete their own conversations
create policy "Users can delete own conversations"
on public.conversations for delete to authenticated
using ( (select auth.uid()) = user_id );
```

### research_artifacts (Planned)

**Purpose:** Store research outputs (reports, sources, etc.)

**Schema (proposed):**

```sql
create table public.research_artifacts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  artifact_type text not null, -- 'report', 'source', 'note'
  title text,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

comment on table public.research_artifacts is 'Research outputs including reports and collected sources.';
```

**Indexes:**

```sql
create index artifacts_conversation_id_idx on public.research_artifacts using btree (conversation_id);
create index artifacts_type_idx on public.research_artifacts using btree (artifact_type);
```

### user_preferences (Planned)

**Purpose:** Store user settings and preferences.

**Schema (proposed):**

```sql
create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  preferred_model text default 'gpt-4o',
  theme text default 'system',
  notification_email boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.user_preferences is 'User preferences and settings.';
```

## Database Functions

### handle_new_user()

**Purpose:** Automatically create profile on user signup.

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
```

**Trigger:**

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### update_updated_at()

**Purpose:** Auto-update `updated_at` timestamp on row modification.

```sql
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
```

## Migration Guidelines

All migrations must follow these rules (per `.cursor/rules/create-migration.mdc`):

1. **Naming:** `YYYYMMDDHHmmss_short_description.sql`
2. **Header Comment:** Include metadata about purpose and affected tables
3. **Lowercase SQL:** Use lowercase for all SQL keywords
4. **RLS Required:** Enable RLS on all new tables
5. **Granular Policies:** Separate policies per operation and role
6. **Comments:** Document all tables and destructive operations

## RLS Best Practices

Per `.cursor/rules/create-rls-policies.mdc`:

1. **Use `(select auth.uid())`** - Wrapped for performance optimization
2. **Separate policies per operation** - No `FOR ALL`
3. **Specify roles explicitly** - Use `TO authenticated` or `TO anon`
4. **Add indexes** - On all columns used in RLS conditions
5. **Prefer PERMISSIVE** - Over RESTRICTIVE policies

## Index Strategy

| Column Type         | Index Recommendation |
| ------------------- | -------------------- |
| Primary key (uuid)  | Automatic B-tree     |
| Foreign key         | B-tree for joins     |
| Email/lookup fields | B-tree               |
| Text search         | GIN with tsvector    |
| JSONB fields        | GIN for containment  |

## Backup & Recovery

Supabase provides:

- Point-in-time recovery (Pro plan)
- Daily backups (all plans)
- Manual backup via `pg_dump`

## Local Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > types/supabase.ts
```
