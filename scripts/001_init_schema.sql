-- Initial RCMS schema with RLS (profiles, fees, expenses, competitions, teams, assets, inventory, receipts)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  college_uid text,
  year text,
  dept text,
  skills text[],
  role text check (role in ('admin','member','faculty')) default 'member',
  created_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key references public.profiles(id) on delete cascade,
  team text,
  performance jsonb default '{}'::jsonb
);

create table if not exists public.fees (
  id bigint primary key generated always as identity,
  member_id uuid references public.profiles(id) on delete set null,
  amount numeric(12,2) not null,
  mode text check (mode in ('cash','online')) not null,
  txn_id text,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.expenses (
  id bigint primary key generated always as identity,
  category text check (category in ('robot_parts','competition_registration','travel_accommodation','tools_workshop')) not null,
  title text not null,
  amount numeric(12,2) not null,
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.competitions (
  id bigint primary key generated always as identity,
  name text not null,
  description text,
  rules text,
  fee numeric(12,2),
  status text check (status in ('upcoming','active','archived')) default 'upcoming',
  created_at timestamptz default now()
);

create table if not exists public.teams (
  id bigint primary key generated always as identity,
  competition_id bigint references public.competitions(id) on delete cascade,
  name text not null
);

create table if not exists public.team_members (
  team_id bigint references public.teams(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete cascade,
  primary key (team_id, member_id)
);

create table if not exists public.results (
  id bigint primary key generated always as identity,
  competition_id bigint references public.competitions(id) on delete cascade,
  team_id bigint references public.teams(id) on delete set null,
  position int,
  notes text
);

create table if not exists public.bots (
  id bigint primary key generated always as identity,
  name text not null,
  type text,
  assigned_team_id bigint references public.teams(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.bot_maintenance (
  id bigint primary key generated always as identity,
  bot_id bigint references public.bots(id) on delete cascade,
  notes text,
  cost numeric(12,2),
  created_at timestamptz default now()
);

create table if not exists public.inventory_parts (
  id bigint primary key generated always as identity,
  name text not null,
  spec text,
  quantity int not null default 0,
  unit text default 'pcs'
);

create table if not exists public.part_transactions (
  id bigint primary key generated always as identity,
  part_id bigint references public.inventory_parts(id) on delete cascade,
  delta int not null,
  reason text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.receipts (
  id bigint primary key generated always as identity,
  fee_id bigint references public.fees(id) on delete cascade,
  receipt_no text unique,
  issued_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.fees enable row level security;
alter table public.expenses enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.results enable row level security;
alter table public.bots enable row level security;
alter table public.bot_maintenance enable row level security;
alter table public.inventory_parts enable row level security;
alter table public.part_transactions enable row level security;
alter table public.receipts enable row level security;

create or replace function public.is_admin(uid uuid) returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

create or replace function public.is_faculty(uid uuid) returns boolean language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = uid and p.role = 'faculty');
$$;

-- Profiles
create policy "profiles_select" on public.profiles for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Members
create policy "members_select" on public.members for select using (auth.uid() = id or public.is_admin(auth.uid()) or public.is_faculty(auth.uid()));
create policy "members_insert" on public.members for insert with check (auth.uid() = id or public.is_admin(auth.uid()));
create policy "members_update" on public.members for update using (auth.uid() = id or public.is_admin(auth.uid())) with check (auth.uid() = id or public.is_admin(auth.uid()));

-- Fees
create policy "fees_select" on public.fees for select using (public.is_admin(auth.uid()) or public.is_faculty(auth.uid()) or member_id = auth.uid());
create policy "fees_insert_member_or_admin" on public.fees for insert with check (auth.uid() = member_id or public.is_admin(auth.uid()));
create policy "fees_update_admin" on public.fees for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Expenses
create policy "expenses_select" on public.expenses for select using (public.is_admin(auth.uid()) or public.is_faculty(auth.uid()));
create policy "expenses_modify_admin" on public.expenses for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Competitions & Teams
create policy "competitions_read" on public.competitions for select using (true);
create policy "competitions_modify_admin" on public.competitions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "teams_read" on public.teams for select using (true);
create policy "teams_modify_admin" on public.teams for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "team_members_read" on public.team_members for select using (true);
create policy "team_members_modify_admin" on public.team_members for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "results_read" on public.results for select using (true);
create policy "results_modify_admin" on public.results for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Bots / Inventory
create policy "bots_read" on public.bots for select using (true);
create policy "bots_modify_admin" on public.bots for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "bot_maintenance_read" on public.bot_maintenance for select using (public.is_admin(auth.uid()) or public.is_faculty(auth.uid()));
create policy "bot_maintenance_modify_admin" on public.bot_maintenance for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "inventory_parts_read" on public.inventory_parts for select using (public.is_admin(auth.uid()) or public.is_faculty(auth.uid()));
create policy "inventory_parts_modify_admin" on public.inventory_parts for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "part_transactions_read" on public.part_transactions for select using (public.is_admin(auth.uid()) or public.is_faculty(auth.uid()));
create policy "part_transactions_modify_admin" on public.part_transactions for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Receipts
create policy "receipts_read" on public.receipts for select using (
  public.is_admin(auth.uid()) or exists(select 1 from public.fees f where f.id = fee_id and f.member_id = auth.uid())
);
create policy "receipts_modify_admin" on public.receipts for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
