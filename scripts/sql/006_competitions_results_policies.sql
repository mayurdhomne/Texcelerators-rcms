/*
  006_competitions_results_policies.sql
  Purpose: Finish competitions RLS setup without using invalid "IF NOT EXISTS" on CREATE POLICY.
  This script:
    - Ensures RLS on competition_results
    - Adds select/write policies for competition_results via conditional DO blocks
    - Removes legacy policy names attempted by 004 to avoid duplication/confusion
  Notes:
    - Uses inline role checks against public.profiles (id = auth.uid(), role in ('admin','faculty'))
    - Forward-only, idempotent
*/

-- Ensure RLS is enabled (safe to run multiple times)
alter table if exists public.competition_results enable row level security;

-- Drop legacy policy names from 004 if they exist (harmless if missing)
drop policy if exists "competition_results_read" on public.competition_results;
drop policy if exists "competition_results_write" on public.competition_results;

-- Some environments may have a legacy team_members policy name from 004; drop to avoid overlap with 005's policies
drop policy if exists "team_members_self_delete" on public.team_members;

-- competition_results: readable by all authenticated users
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_select_all'
  ) then
    execute $SQL$
      create policy "competition_results_select_all" on public.competition_results
      for select
      to authenticated
      using (true);
    $SQL$;
  end if;
end
$$;

-- competition_results write access (insert/update/delete) limited to admins or faculty
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_write_admin_faculty'
  ) then
    execute $SQL$
      create policy "competition_results_write_admin_faculty" on public.competition_results
      for all
      to authenticated
      using (exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('admin','faculty')
      ))
      with check (exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role in ('admin','faculty')
      ));
    $SQL$;
  end if;
end
$$;
