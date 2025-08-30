alter table profiles enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table competitions enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table bots enable row level security;
alter table maintenance_logs enable row level security;
alter table inventory_parts enable row level security;

-- Helpers
create or replace function is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = uid and p.role = 'admin')
$$;

create or replace function is_faculty(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = uid and p.role = 'faculty')
$$;

-- profiles
create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id or is_admin(auth.uid()) or is_faculty(auth.uid()));

create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id or is_admin(auth.uid()));

create policy "profiles_admin_insert" on profiles
  for insert with check (is_admin(auth.uid()));

-- payments
create policy "payments_read" on payments
  for select using (user_id = auth.uid() or is_admin(auth.uid()) or is_faculty(auth.uid()));

create policy "payments_member_online_insert" on payments
  for insert with check (
    auth.uid() = user_id and mode in ('online') and status = 'pending'
  );

create policy "payments_admin_cash_insert" on payments
  for insert with check (is_admin(auth.uid()));

create policy "payments_admin_update_approval" on payments
  for update using (is_admin(auth.uid()));

-- expenses
create policy "expenses_read" on expenses
  for select using (is_admin(auth.uid()) or is_faculty(auth.uid()));

create policy "expenses_admin_write" on expenses
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- competitions
create policy "competitions_read" on competitions
  for select using (true);

create policy "competitions_admin_write" on competitions
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- teams
create policy "teams_read" on teams
  for select using (true);

create policy "teams_admin_write" on teams
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- team_members
create policy "team_members_read" on team_members
  for select using (
    is_admin(auth.uid()) or exists (
      select 1 from team_members tm2 where tm2.user_id = auth.uid() and tm2.team_id = team_id
    )
  );

create policy "team_members_admin_write" on team_members
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- bots
create policy "bots_read" on bots
  for select using (true);

create policy "bots_admin_write" on bots
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- maintenance logs
create policy "maintenance_read" on maintenance_logs
  for select using (true);

create policy "maintenance_admin_write" on maintenance_logs
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- inventory parts
create policy "inventory_read" on inventory_parts
  for select using (true);

create policy "inventory_admin_write" on inventory_parts
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
