-- id and timestamp helpers
create extension if not exists "uuid-ossp";

-- competitions: each event your club participates in or hosts
create table if not exists public.competitions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  location text,
  start_date date,
  end_date date,
  open_for_registration boolean not null default true,
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- teams per competition (1..n members)
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- team_members relation
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text check (role in ('member','captain')) default 'member',
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- optional results table
create table if not exists public.competition_results (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  position int check (position >= 1),
  notes text,
  created_at timestamptz not null default now()
);

-- Updated at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_competitions_updated on public.competitions;
create trigger trg_competitions_updated before update on public.competitions
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_teams_updated on public.teams;
create trigger trg_teams_updated before update on public.teams
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.competition_results enable row level security;

-- Assume profiles table with role text in ('admin','faculty','member')
-- Helper: is_admin_or_faculty
create or replace function public.is_admin_or_faculty(uid uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.profiles p
    where p.user_id = uid and p.role in ('admin','faculty')
  );
$$;

-- competitions policies
drop policy if exists "competitions read" on public.competitions;
create policy "competitions read" on public.competitions
for select using (true);

drop policy if exists "competitions insert" on public.competitions;
create policy "competitions insert" on public.competitions
for insert with check (is_admin_or_faculty(auth.uid()));

drop policy if exists "competitions update" on public.competitions;
create policy "competitions update" on public.competitions
for update using (is_admin_or_faculty(auth.uid())) with check (is_admin_or_faculty(auth.uid()));

-- teams policies
drop policy if exists "teams read" on public.teams;
create policy "teams read" on public.teams
for select using (true);

drop policy if exists "teams insert" on public.teams;
create policy "teams insert" on public.teams
for insert with check (
  -- admins/faculty always allowed
  is_admin_or_faculty(auth.uid())
  or
  -- members may create teams only when competition is open
  exists (
    select 1
    from public.competitions c
    where c.id = competition_id and c.open_for_registration = true and c.archived = false
  )
);

drop policy if exists "teams update" on public.teams;
create policy "teams update" on public.teams
for update using (
  -- admins/faculty
  is_admin_or_faculty(auth.uid())
  or
  -- team creator can update while competition is open
  exists (
    select 1
    from public.competitions c
    where c.id = competition_id and c.open_for_registration = true
  ) and created_by = auth.uid()
) with check (true);

-- team_members policies
drop policy if exists "team_members read" on public.team_members;
create policy "team_members read" on public.team_members
for select using (true);

drop policy if exists "team_members insert" on public.team_members;
create policy "team_members insert" on public.team_members
for insert with check (
  -- a user can add themselves to a team if competition open
  user_id = auth.uid() and exists (
    select 1 from public.teams t
    join public.competitions c on c.id = t.competition_id
    where t.id = team_id and c.open_for_registration = true and c.archived = false
  )
  or
  -- admin/faculty may add any user
  is_admin_or_faculty(auth.uid())
);

drop policy if exists "team_members delete" on public.team_members;
create policy "team_members delete" on public.team_members
for delete using (
  -- a user can remove themselves, or admin/faculty can remove anyone
  user_id = auth.uid() or is_admin_or_faculty(auth.uid())
);

-- competition_results policies
drop policy if exists "results read" on public.competition_results;
create policy "results read" on public.competition_results
for select using (true);

drop policy if exists "results write" on public.competition_results;
create policy "results write" on public.competition_results
for all using (is_admin_or_faculty(auth.uid())) with check (is_admin_or_faculty(auth.uid()));
