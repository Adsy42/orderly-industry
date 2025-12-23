-- Migration: Create matters table
-- Purpose: Store legal matters (cases/projects) for organizing counsel work
-- Affected tables: public.matters
-- Special considerations: Auto-generates matter numbers, includes RLS policies

-- Create sequence for matter number generation
create sequence if not exists public.matter_number_seq;

-- Create matters table
create table public.matters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  matter_number text unique not null,
  status text not null default 'active',
  jurisdiction text default 'AU',
  created_by uuid references public.profiles (id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint matters_title_length check (char_length(title) <= 200),
  constraint matters_description_length check (char_length(description) <= 2000),
  constraint matters_status_valid check (status in ('active', 'closed', 'archived'))
);

-- Add table comment
comment on table public.matters is 'Legal matters (cases/projects) that organize documents and work for counsel.';

-- Create function to generate matter numbers
create or replace function public.generate_matter_number()
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_number text;
begin
  new_number := 'M-' || to_char(now(), 'YYYY') || '-' || 
                lpad(nextval('public.matter_number_seq')::text, 3, '0');
  return new_number;
end;
$$;

comment on function public.generate_matter_number is 'Generates unique matter numbers in format M-YYYY-NNN';

-- Create trigger function to auto-set matter_number on insert
create or replace function public.set_matter_number()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.matter_number is null or new.matter_number = '' then
    new.matter_number := public.generate_matter_number();
  end if;
  return new;
end;
$$;

-- Create trigger to auto-generate matter number
create trigger set_matter_number_trigger
  before insert on public.matters
  for each row execute function public.set_matter_number();

-- Create trigger to auto-update updated_at
create trigger update_matters_updated_at
  before update on public.matters
  for each row execute function public.update_updated_at();

-- Create indexes for performance
create index matters_created_by_idx on public.matters using btree (created_by);
create index matters_status_idx on public.matters using btree (status);
create index matters_updated_at_idx on public.matters using btree (updated_at desc);

-- Enable Row Level Security
alter table public.matters enable row level security;

-- RLS Policy: Authenticated users can view matters they own or participate in
create policy "Users can view matters they own or participate in"
on public.matters
for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1 from public.matter_participants
    where matter_participants.matter_id = matters.id
    and matter_participants.user_id = (select auth.uid())
  )
);

-- RLS Policy: Authenticated users can create matters
create policy "Authenticated users can create matters"
on public.matters
for insert
to authenticated
with check (created_by = (select auth.uid()));

-- RLS Policy: Only owners can update their matters
create policy "Owners can update their matters"
on public.matters
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

-- RLS Policy: Only owners can delete their matters
create policy "Owners can delete their matters"
on public.matters
for delete
to authenticated
using (created_by = (select auth.uid()));

