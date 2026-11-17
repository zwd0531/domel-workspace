-- Run only in a fresh disposable PostgreSQL database; no cloud credentials needed.
\set ON_ERROR_STOP on

create schema auth;
create table auth.users (id uuid primary key, email text not null, raw_user_meta_data jsonb not null default '{}');
create type public.app_role as enum ('sales', 'production_planner', 'quality_engineer', 'decision_owner', 'admin');
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120)
);
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);

\ir ../migrations/0002_auth_profile_trigger.sql
\ir ../migrations/0011_public_registration_default_roles.sql

insert into auth.users values ('11111111-1111-4111-8111-111111111111', 'existing@example.invalid', '{"domel_registration":"public","display_name":"Existing User"}');

\ir ../migrations/0012_public_registration_all_roles.sql
-- The migration can be safely reapplied.
\ir ../migrations/0012_public_registration_all_roles.sql

insert into auth.users values ('22222222-2222-4222-8222-222222222222', 'new@example.invalid', '{"domel_registration":"public","display_name":"  New User  ","role":"unknown"}');
insert into auth.users values ('33333333-3333-4333-8333-333333333333', 'other@example.invalid', '{"role":"admin"}');

do $$
declare
  actual text[];
begin
  select array_agg(role::text order by role::text) into actual from public.user_roles
  where user_id = '22222222-2222-4222-8222-222222222222';
  if actual is distinct from array['admin','decision_owner','production_planner','quality_engineer','sales'] then
    raise exception 'New Domel signup did not receive exactly all five roles: %', actual;
  end if;

  if (select count(*) from public.user_roles where user_id = '11111111-1111-4111-8111-111111111111') <> 3 then
    raise exception 'Existing roles were unexpectedly changed';
  end if;
  if exists (select 1 from public.user_roles where user_id = '33333333-3333-4333-8333-333333333333') then
    raise exception 'A separately created user bypassed the Domel registration policy';
  end if;
  if (select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222') <> 'New User' then
    raise exception 'Profile was not created with the normalized name';
  end if;
end;
$$;

-- A failed role grant must roll back the entire signup, including the profile.
alter table public.user_roles add constraint reject_test_admin
check (user_id <> '44444444-4444-4444-8444-444444444444' or role <> 'admin');
do $$
begin
  begin
    insert into auth.users values ('44444444-4444-4444-8444-444444444444', 'failed@example.invalid', '{"domel_registration":"public"}');
    raise exception 'Expected the test role constraint to reject registration';
  exception when check_violation then
    null;
  end;
  if exists (select 1 from auth.users where id = '44444444-4444-4444-8444-444444444444')
    or exists (select 1 from public.profiles where id = '44444444-4444-4444-8444-444444444444')
    or exists (select 1 from public.user_roles where user_id = '44444444-4444-4444-8444-444444444444') then
    raise exception 'A failed signup left partial records';
  end if;
end;
$$;

-- Restoring the previous default affects future signups only.
\ir ../migrations/0011_public_registration_default_roles.sql
insert into auth.users values ('55555555-5555-4555-8555-555555555555', 'rollback@example.invalid', '{"domel_registration":"public"}');
do $$
begin
  if (select count(*) from public.user_roles where user_id = '55555555-5555-4555-8555-555555555555') <> 3 then
    raise exception 'Rollback did not restore the three-role signup default';
  end if;
  if (select count(*) from public.user_roles where user_id = '22222222-2222-4222-8222-222222222222') <> 5 then
    raise exception 'Rollback unexpectedly removed previously granted roles';
  end if;
end;
$$;

select 'PASS: five roles, fixed policy, profile creation, existing users, atomic rollback, repeat migration and policy rollback' as result;
