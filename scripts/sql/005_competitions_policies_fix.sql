/*
  Fix CREATE POLICY syntax errors by replacing 'IF NOT EXISTS' with conditional DO blocks.
  This script is forward-only and idempotent. It:
  - Ensures RLS is enabled on competitions, teams, and team_members
  - Creates missing policies using pg_policies checks (no 'IF NOT EXISTS' on CREATE POLICY)
  - Uses profiles.id (UUID) semantics aligned with Supabase auth.uid()
  - Keeps names stable so future runs won't duplicate policies
*/

/* Enable RLS (safe to run multiple times) */
alter table if exists public.competitions enable row level security;
alter table if exists public.teams enable row level security;
alter table if exists public.team_members enable row level security;

/* competitions: allow public read, staff create/update, and owner filters if needed */
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='competitions' and policyname='competitions_select_all'
  ) then
    execute $SQL$
      create policy "competitions_select_all" on public.competitions
      for select
      using (true);
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='competitions' and policyname='competitions_insert_admin_faculty'
  ) then
    execute $SQL$
      create policy "competitions_insert_admin_faculty" on public.competitions
      for insert to authenticated
      with check (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ));
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='competitions' and policyname='competitions_update_admin_faculty'
  ) then
    execute $SQL$
      create policy "competitions_update_admin_faculty" on public.competitions
      for update to authenticated
      using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ))
      with check (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ));
    $SQL$;
  end if;
end$$;

/* teams: public read, staff create/update */
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='teams' and policyname='teams_select_all'
  ) then
    execute $SQL$
      create policy "teams_select_all" on public.teams
      for select
      using (true);
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='teams' and policyname='teams_insert_admin_faculty'
  ) then
    execute $SQL$
      create policy "teams_insert_admin_faculty" on public.teams
      for insert to authenticated
      with check (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ));
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='teams' and policyname='teams_update_admin_faculty'
  ) then
    execute $SQL$
      create policy "teams_update_admin_faculty" on public.teams
      for update to authenticated
      using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ))
      with check (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('admin','faculty')
      ));
    $SQL$;
  end if;
end$$;

/* team_members: self-insert for members into active competitions, read own or staff, owner delete or staff */
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='team_members' and policyname='team_members_self_insert'
  ) then
    execute $SQL$
      create policy "team_members_self_insert" on public.team_members
      for insert to authenticated
      with check (
        -- user can only insert themselves
        auth.uid() = user_id
        and exists (
          select 1
          from public.teams t
          join public.competitions c on c.id = t.competition_id
          where t.id = team_id
          and coalesce(c.status, 'active') in ('active','open')
        )
      );
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='team_members' and policyname='team_members_select_own_or_staff'
  ) then
    execute $SQL$
      create policy "team_members_select_own_or_staff" on public.team_members
      for select to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      );
    $SQL$;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='team_members' and policyname='team_members_delete_owner_or_staff'
  ) then
    execute $SQL$
      create policy "team_members_delete_owner_or_staff" on public.team_members
      for delete to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      );
    $SQL$;
  end if;
end$$;

/* Optional: tighten update (if table allows updates) */
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='team_members' and policyname='team_members_update_owner_or_staff'
  ) then
    execute $SQL$
      create policy "team_members_update_owner_or_staff" on public.team_members
      for update to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      )
      with check (
        user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      );
    $SQL$;
  end if;
end$$;
