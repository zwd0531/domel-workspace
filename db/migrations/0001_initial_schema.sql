create extension if not exists pgcrypto;

create type public.app_role as enum (
  'sales',
  'production_planner',
  'quality_engineer',
  'decision_owner',
  'admin'
);

create type public.scenario_status as enum ('draft', 'submitted', 'approved', 'rejected', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

create function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to authenticated;

create table public.plants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  timezone text not null default 'Asia/Shanghai',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid not null references public.plants(id),
  code text not null,
  name text not null,
  family text not null,
  application text not null,
  owner_label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plant_id, code)
);

create table public.monthly_operations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  month date not null check (date_trunc('month', month) = month),
  planned_units integer not null check (planned_units >= 0),
  produced_units integer not null check (produced_units >= 0),
  on_time_rate numeric(5,2) check (on_time_rate between 0 and 100),
  tested_units integer not null check (tested_units >= 0),
  passed_units integer not null check (passed_units between 0 and tested_units),
  field_returns integer not null check (field_returns >= 0),
  defect_rate numeric(5,2) check (defect_rate between 0 and 100),
  risk text not null check (risk in ('Low', 'Medium', 'High')),
  quality_note text,
  source_label text not null,
  imported_at timestamptz not null default now(),
  unique (product_id, month)
);

create table public.monthly_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  month date not null check (date_trunc('month', month) = month),
  order_count integer not null check (order_count >= 0),
  shipped_units integer not null check (shipped_units >= 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency char(3) not null default 'EUR',
  source_label text not null,
  imported_at timestamptz not null default now(),
  unique (product_id, month)
);

create table public.monthly_costs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  month date not null check (date_trunc('month', month) = month),
  unit_variable_cost numeric(14,2) not null check (unit_variable_cost >= 0),
  monthly_fixed_cost numeric(16,2) not null check (monthly_fixed_cost >= 0),
  currency char(3) not null default 'EUR',
  source_label text not null,
  imported_at timestamptz not null default now(),
  unique (product_id, month)
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id),
  assigned_role public.app_role not null,
  assigned_user_id uuid references public.profiles(id),
  title text not null,
  action text not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  due_at timestamptz,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  business_month date not null,
  owner_id uuid not null references public.profiles(id),
  name text not null,
  status public.scenario_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scenario_snapshots (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  inputs jsonb not null,
  calculated_result jsonb not null,
  formula_version text not null,
  rationale text not null default '',
  created_at timestamptz not null default now()
);

create table public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text not null,
  source_url text not null,
  published_on date,
  captured_on date not null default current_date,
  topic text not null,
  fact text not null,
  interpretation text not null,
  limitations text not null,
  verification_status text not null default 'unverified',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.scenario_evidence (
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  evidence_id uuid not null references public.evidence_records(id),
  linked_by uuid not null references public.profiles(id),
  linked_at timestamptz not null default now(),
  primary key (scenario_id, evidence_id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id),
  snapshot_id uuid not null references public.scenario_snapshots(id),
  title text not null,
  recommendation text not null,
  review_trigger text not null,
  status public.scenario_status not null default 'submitted',
  submitted_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_name text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  rows_received integer not null default 0,
  rows_imported integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  imported_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.plants enable row level security;
alter table public.products enable row level security;
alter table public.monthly_operations enable row level security;
alter table public.monthly_sales enable row level security;
alter table public.monthly_costs enable row level security;
alter table public.work_items enable row level security;
alter table public.scenarios enable row level security;
alter table public.scenario_snapshots enable row level security;
alter table public.evidence_records enable row level security;
alter table public.scenario_evidence enable row level security;
alter table public.decisions enable row level security;
alter table public.import_runs enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_read_self_or_admin on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role('admin'));
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
using (id = auth.uid() or public.has_role('admin'))
with check (id = auth.uid() or public.has_role('admin'));

create policy user_roles_read_self_or_admin on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role('admin'));
create policy user_roles_admin_all on public.user_roles for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy plants_read_authenticated on public.plants for select to authenticated using (true);
create policy plants_admin_write on public.plants for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));
create policy products_read_authenticated on public.products for select to authenticated using (true);
create policy products_admin_write on public.products for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy operations_role_read on public.monthly_operations for select to authenticated
using (
  public.has_role('production_planner') or public.has_role('quality_engineer') or
  public.has_role('decision_owner') or public.has_role('admin')
);
create policy operations_admin_write on public.monthly_operations for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy sales_role_read on public.monthly_sales for select to authenticated
using (public.has_role('sales') or public.has_role('decision_owner') or public.has_role('admin'));
create policy sales_admin_write on public.monthly_sales for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy costs_finance_read on public.monthly_costs for select to authenticated
using (public.has_role('decision_owner') or public.has_role('admin'));
create policy costs_admin_write on public.monthly_costs for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy work_items_assigned_read on public.work_items for select to authenticated
using (
  assigned_user_id = auth.uid() or
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = assigned_role) or
  public.has_role('decision_owner') or public.has_role('admin')
);
create policy work_items_assigned_update on public.work_items for update to authenticated
using (
  assigned_user_id = auth.uid() or
  exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = assigned_role) or
  public.has_role('decision_owner') or public.has_role('admin')
);
create policy work_items_manager_insert on public.work_items for insert to authenticated
with check (public.has_role('decision_owner') or public.has_role('admin'));

create policy scenarios_owner_read on public.scenarios for select to authenticated
using (owner_id = auth.uid() or public.has_role('decision_owner') or public.has_role('admin'));
create policy scenarios_owner_insert on public.scenarios for insert to authenticated
with check ((owner_id = auth.uid() and public.has_role('decision_owner')) or public.has_role('admin'));
create policy scenarios_owner_update on public.scenarios for update to authenticated
using (owner_id = auth.uid() or public.has_role('admin'))
with check (owner_id = auth.uid() or public.has_role('admin'));

create policy snapshots_scenario_read on public.scenario_snapshots for select to authenticated
using (exists (select 1 from public.scenarios s where s.id = scenario_id));
create policy snapshots_creator_insert on public.scenario_snapshots for insert to authenticated
with check (
  created_by = auth.uid() and
  exists (select 1 from public.scenarios s where s.id = scenario_id and s.owner_id = auth.uid())
);

create policy evidence_authenticated_read on public.evidence_records for select to authenticated using (true);
create policy evidence_authorized_insert on public.evidence_records for insert to authenticated
with check (created_by = auth.uid() and (public.has_role('decision_owner') or public.has_role('admin')));
create policy evidence_authorized_update on public.evidence_records for update to authenticated
using (created_by = auth.uid() or public.has_role('admin'))
with check (created_by = auth.uid() or public.has_role('admin'));

create policy scenario_evidence_read on public.scenario_evidence for select to authenticated
using (exists (select 1 from public.scenarios s where s.id = scenario_id));
create policy scenario_evidence_owner_write on public.scenario_evidence for all to authenticated
using (exists (select 1 from public.scenarios s where s.id = scenario_id and s.owner_id = auth.uid()))
with check (linked_by = auth.uid() and exists (
  select 1 from public.scenarios s where s.id = scenario_id and s.owner_id = auth.uid()
));

create policy decisions_scenario_read on public.decisions for select to authenticated
using (exists (select 1 from public.scenarios s where s.id = scenario_id));
create policy decisions_owner_insert on public.decisions for insert to authenticated
with check (submitted_by = auth.uid() and exists (
  select 1 from public.scenarios s where s.id = scenario_id and s.owner_id = auth.uid()
));
create policy decisions_approver_update on public.decisions for update to authenticated
using (public.has_role('decision_owner') or public.has_role('admin'))
with check (public.has_role('decision_owner') or public.has_role('admin'));

create policy imports_admin_read on public.import_runs for select to authenticated
using (public.has_role('admin'));
create policy imports_admin_write on public.import_runs for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy audit_actor_insert on public.audit_events for insert to authenticated
with check (actor_id = auth.uid());
create policy audit_authorized_read on public.audit_events for select to authenticated
using (public.has_role('decision_owner') or public.has_role('admin'));

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.plants, public.products to authenticated;
grant select, insert, update, delete on public.monthly_operations, public.monthly_sales, public.monthly_costs to authenticated;
grant select, insert, update on public.work_items to authenticated;
grant select, insert, update on public.scenarios to authenticated;
grant select, insert on public.scenario_snapshots to authenticated;
grant select, insert, update on public.evidence_records to authenticated;
grant select, insert, update, delete on public.scenario_evidence to authenticated;
grant select, insert, update on public.decisions to authenticated;
grant select, insert, update, delete on public.import_runs to authenticated;
grant select, insert on public.audit_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;
