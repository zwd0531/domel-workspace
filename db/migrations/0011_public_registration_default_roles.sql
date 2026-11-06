-- Give Domel public signups the three operational demo roles atomically.
-- The registration marker grants no administrative or decision-owner access.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  if new.raw_user_meta_data ->> 'domel_registration' = 'public' then
    insert into public.user_roles (user_id, role)
    values
      (new.id, 'sales'),
      (new.id, 'production_planner'),
      (new.id, 'quality_engineer')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;
