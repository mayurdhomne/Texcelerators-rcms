-- 004_competitions_fix.sql
-- Fix broken references from 003_competitions.sql and align policies to live schema
-- Safe, forward-only fix. Do NOT edit previously-run scripts.

-- 1) Helper: is_admin_or_faculty(uid) should reference profiles.id (not user_id)
create or replace function public.is_admin_or_faculty(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin','faculty')
  );
$$;

-- 2) Optional results table compatible with existing UUID schema
create table if not exists public.competition_results (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  position int check (position >= 1),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.competition_results enable row level security;

-- 3) Clean up any partially-created policies from 003_competitions.sql (names differ from 002_policies.sql)
-- These drops are idempotent and won't affect the policies created in scripts/sql/002_policies.sql
drop policy if exists "competitions read" on public.competitions;
drop policy if exists "competitions insert" on public.competitions;
drop policy if exists "competitions update" on public.competitions;

drop policy if exists "teams read" on public.teams;
drop policy if exists "teams insert" on public.teams;
drop policy if exists "teams update" on public.teams;

drop policy if exists "team_members read" on public.team_members;
drop policy if exists "team_members insert" on public.team_members;
drop policy if exists "team_members delete" on public.team_members;

drop policy if exists "results read" on public.competition_results;
drop policy if exists "results write" on public.competition_results;

-- 4) Add policies aligned with the live schema (status='active' instead of open_for_registration)
-- competitions: keep existing policies from 002_policies.sql (competitions_read, competitions_admin_write)

-- teams: keep existing admin write policy; no change here necessary.

-- team_members:
-- Allow members to add themselves to a team when the competition is active.
create policy if not exists "team_members_self_insert" on public.team_members
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.teams t
    join public.competitions c on c.id = t.competition_id
    where t.id = team_id
      and c.status = 'active'
  )
);

-- Allow members to remove themselves; admins retain full control via existing admin policy.
create policy if not exists "team_members_self_delete" on public.team_members
for delete
using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- competition_results: readable by all; writeable by admin or faculty
create policy if not exists "competition_results_read" on public.competition_results
for select using (true);

create policy if not exists "competition_results_write" on public.competition_results
for all
using (public.is_admin_or_faculty(auth.uid()))
with check (public.is_admin_or_faculty(auth.uid()));
