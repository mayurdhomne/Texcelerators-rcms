-- Create profile row automatically on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert a matching profile for the new auth user.
  -- Live schema uses profiles(id, full_name, role, ...); there is no 'email' or 'name' column,
  -- and there is no 'members' table in the live schema.
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      null
    ),
    'member'
  )
  on conflict (id) do nothing;

  -- Removed insert into public.members; that table does not exist in the live schema.

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
