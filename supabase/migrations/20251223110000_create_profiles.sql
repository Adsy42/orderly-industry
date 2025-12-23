-- Migration: Create user profiles table
-- Purpose: Store user profile information with RLS for secure access
-- Affected tables: public.profiles
-- Special considerations: Automatically syncs with auth.users via trigger

-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Add table comment
comment on table public.profiles is 'User profiles linked to auth.users for storing additional user information.';

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- RLS Policies for profiles table
-- Policy: Allow authenticated users to view all profiles (for user discovery)
create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
to authenticated
using ( true );

-- Policy: Allow anonymous users to view profiles (public access for avatars, etc.)
create policy "Profiles are viewable by anonymous users"
on public.profiles
for select
to anon
using ( true );

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ( (select auth.uid()) = id );

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );

-- Policy: Users can delete their own profile
create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using ( (select auth.uid()) = id );

-- Create index on email for faster lookups
create index profiles_email_idx on public.profiles using btree (email);

-- Create a function to automatically create a profile when a user signs up
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

-- Create a trigger to call the function on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create a function to update the updated_at timestamp
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

-- Create a trigger to auto-update the updated_at column
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();



