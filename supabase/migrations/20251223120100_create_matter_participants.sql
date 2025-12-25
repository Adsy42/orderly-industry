-- Migration: Create matter_participants table
-- Purpose: Store user access to matters with role-based permissions
-- Affected tables: public.matter_participants
-- Special considerations: Must be created before documents table (referenced in matters RLS)

-- Create matter_participants table
create table public.matter_participants (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters (id) on delete cascade not null,
  user_id uuid references public.profiles (id) on delete cascade not null,
  role text not null,
  added_at timestamptz not null default now(),
  
  -- Constraints
  constraint matter_participants_unique unique (matter_id, user_id),
  constraint matter_participants_role_valid check (role in ('counsel', 'client', 'observer'))
);

-- Add table comment
comment on table public.matter_participants is 'Tracks user access to matters with role-based permissions (counsel, client, observer).';

-- Create indexes for performance
create index matter_participants_matter_id_idx on public.matter_participants using btree (matter_id);
create index matter_participants_user_id_idx on public.matter_participants using btree (user_id);

-- Enable Row Level Security
alter table public.matter_participants enable row level security;

-- Create helper function to check matter access
create or replace function public.user_can_access_matter(matter_uuid uuid)
returns boolean
language plpgsql
security invoker
stable
set search_path = ''
as $$
begin
  return exists (
    select 1 from public.matters
    where id = matter_uuid
    and created_by = (select auth.uid())
  ) or exists (
    select 1 from public.matter_participants
    where matter_id = matter_uuid
    and user_id = (select auth.uid())
  );
end;
$$;

comment on function public.user_can_access_matter is 'Helper function to check if current user has access to a matter (owner or participant).';

-- RLS Policy: Participants can view other participants in matters they have access to
create policy "Participants can view other participants"
on public.matter_participants
for select
to authenticated
using (public.user_can_access_matter(matter_id));

-- RLS Policy: Only matter owners can add participants
create policy "Owners can add participants"
on public.matter_participants
for insert
to authenticated
with check (
  exists (
    select 1 from public.matters
    where id = matter_id
    and created_by = (select auth.uid())
  )
);

-- RLS Policy: Only matter owners can update participant roles
create policy "Owners can update participant roles"
on public.matter_participants
for update
to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id
    and created_by = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.matters
    where id = matter_id
    and created_by = (select auth.uid())
  )
);

-- RLS Policy: Only matter owners can remove participants
create policy "Owners can remove participants"
on public.matter_participants
for delete
to authenticated
using (
  exists (
    select 1 from public.matters
    where id = matter_id
    and created_by = (select auth.uid())
  )
);





