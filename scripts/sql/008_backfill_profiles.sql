-- backfill profiles for existing auth.users that lack a profile row
insert into public.profiles (id, full_name, role, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  'member',
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
