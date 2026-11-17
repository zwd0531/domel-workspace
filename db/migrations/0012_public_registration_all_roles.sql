-- New Domel public signups receive all five application roles.
-- Applies to future registrations only; existing role assignments are preserved.
begin;

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
      (new.id, 'quality_engineer'),
      (new.id, 'decision_owner'),
      (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

commit;
