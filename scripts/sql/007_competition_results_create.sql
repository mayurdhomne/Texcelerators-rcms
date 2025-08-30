-- Create competition_results and add robust, idempotent RLS policies
-- Safe to run multiple times.

-- 1) Table
create table if not exists public.competition_results (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  participant_id uuid references public.profiles(id) on delete set null,
  position int check (position is null or position >= 1),
  points numeric,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Indexes (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'idx_comp_results_competition_id'
  ) then
    create index idx_comp_results_competition_id on public.competition_results(competition_id);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'idx_comp_results_team_id'
  ) then
    create index idx_comp_results_team_id on public.competition_results(team_id);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'idx_comp_results_participant_id'
  ) then
    create index idx_comp_results_participant_id on public.competition_results(participant_id);
  end if;
end$$;

-- 3) updated_at trigger (shared utility)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'competition_results'
      and t.tgname = 'trg_competition_results_updated_at'
  ) then
    create trigger trg_competition_results_updated_at
      before update on public.competition_results
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- 4) Enable RLS
alter table public.competition_results enable row level security;

-- 5) Policies (use DO blocks; no IF NOT EXISTS on CREATE POLICY)

-- Admin: full access
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_admin_all'
  ) then
    create policy "competition_results_admin_all"
      on public.competition_results
      for all
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end$$;

-- Staff (admin/faculty): read all
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_staff_read'
  ) then
    create policy "competition_results_staff_read"
      on public.competition_results
      for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      );
  end if;
end$$;

-- Staff (admin/faculty): insert
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_staff_insert'
  ) then
    create policy "competition_results_staff_insert"
      on public.competition_results
      for insert
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin','faculty')
        )
      );
  end if;
end$$;

-- Admin: update
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_admin_update'
  ) then
    create policy "competition_results_admin_update"
      on public.competition_results
      for update
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end$$;

-- Admin: delete
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_admin_delete'
  ) then
    create policy "competition_results_admin_delete"
      on public.competition_results
      for delete
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role = 'admin'
        )
      );
  end if;
end$$;

-- Members: read own results (participant_id = auth.uid())
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competition_results'
      and policyname = 'competition_results_member_read_self'
  ) then
    create policy "competition_results_member_read_self"
      on public.competition_results
      for select
      using (participant_id = auth.uid());
  end if;
end$$;
