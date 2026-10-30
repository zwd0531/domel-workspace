create table public.monthly_production (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  month date not null check (date_trunc('month', month) = month),
  planned_units integer not null check (planned_units >= 0),
  produced_units integer not null check (produced_units >= 0),
  on_time_rate numeric(5,2) check (on_time_rate between 0 and 100),
  source_label text not null,
  imported_at timestamptz not null default now(),
  unique (product_id, month)
);

create table public.monthly_quality (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  month date not null check (date_trunc('month', month) = month),
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

insert into public.monthly_production
  (product_id, month, planned_units, produced_units, on_time_rate, source_label, imported_at)
select product_id, month, planned_units, produced_units, on_time_rate, source_label, imported_at
from public.monthly_operations;

insert into public.monthly_quality
  (product_id, month, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label, imported_at)
select product_id, month, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label, imported_at
from public.monthly_operations;

alter table public.monthly_production enable row level security;
alter table public.monthly_quality enable row level security;

create policy production_role_read on public.monthly_production for select to authenticated
using (public.has_role('production_planner') or public.has_role('decision_owner') or public.has_role('admin'));
create policy production_admin_write on public.monthly_production for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

create policy quality_role_read on public.monthly_quality for select to authenticated
using (public.has_role('quality_engineer') or public.has_role('decision_owner') or public.has_role('admin'));
create policy quality_admin_write on public.monthly_quality for all to authenticated
using (public.has_role('admin')) with check (public.has_role('admin'));

revoke all on public.monthly_production, public.monthly_quality from anon, authenticated;
grant select, insert, update, delete on public.monthly_production, public.monthly_quality to authenticated;

drop table public.monthly_operations;
