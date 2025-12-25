-- Migration: Create conversations table for thread persistence
-- Purpose: Store conversation metadata linking to LangGraph thread IDs
-- Date: 2025-12-25
-- Related: Spec 002-supabase-persistence

-- Create conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  thread_id text not null, -- LangGraph thread ID
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  -- Ensure thread_id is unique per user to prevent duplicates
  unique (user_id, thread_id)
);

comment on table public.conversations is 'User conversations linking to LangGraph threads.';

-- Create indexes for efficient queries
create index conversations_user_id_idx on public.conversations using btree (user_id);
create index conversations_thread_id_idx on public.conversations using btree (thread_id);
create index conversations_updated_at_idx on public.conversations using btree (updated_at desc);

-- Enable Row Level Security
alter table public.conversations enable row level security;

-- RLS Policies

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

-- Function to automatically update updated_at timestamp
create or replace function public.update_conversations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at on row updates
create trigger update_conversations_updated_at
  before update on public.conversations
  for each row
  execute function public.update_conversations_updated_at();

