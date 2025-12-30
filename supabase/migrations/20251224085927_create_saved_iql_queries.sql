-- Migration: Create saved_iql_queries table
-- Purpose: Store user-created IQL queries for reuse across sessions and documents
-- Affected tables: public.saved_iql_queries
-- Special considerations: User-scoped with RLS, optional matter context

-- Create saved_iql_queries table
create table public.saved_iql_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade not null,
  name text not null,
  description text,
  query_string text not null,
  matter_id uuid references public.matters (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint saved_iql_queries_name_not_empty check (char_length(trim(name)) > 0),
  constraint saved_iql_queries_query_not_empty check (char_length(trim(query_string)) > 0)
);

-- Add table comment
comment on table public.saved_iql_queries is 'User-created IQL queries saved for reuse across sessions and documents.';

-- Create indexes for performance
create index saved_iql_queries_user_id_idx on public.saved_iql_queries using btree (user_id);
create index saved_iql_queries_matter_id_idx on public.saved_iql_queries using btree (matter_id);
create index saved_iql_queries_created_at_idx on public.saved_iql_queries using btree (created_at desc);

-- Enable Row Level Security
alter table public.saved_iql_queries enable row level security;

-- RLS Policy: Users can view their own saved queries
create policy "Users can view their own saved queries"
on public.saved_iql_queries
for select
to authenticated
using ((select auth.uid()) = user_id);

-- RLS Policy: Users can create saved queries for themselves
create policy "Users can create saved queries for themselves"
on public.saved_iql_queries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- RLS Policy: Users can update their own saved queries
create policy "Users can update their own saved queries"
on public.saved_iql_queries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- RLS Policy: Users can delete their own saved queries
create policy "Users can delete their own saved queries"
on public.saved_iql_queries
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Create function to update updated_at timestamp
create or replace function public.update_saved_iql_queries_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger to automatically update updated_at
create trigger update_saved_iql_queries_updated_at
before update on public.saved_iql_queries
for each row
execute function public.update_saved_iql_queries_updated_at();





