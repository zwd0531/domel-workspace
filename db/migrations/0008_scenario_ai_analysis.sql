-- Simple persistence for scenario assumption analyses.

create table public.scenario_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  snapshot_id uuid references public.scenario_snapshots(id) on delete set null,
  input_text text not null check (char_length(input_text) between 10 and 4000),
  analysis jsonb not null,
  engine text not null check (engine in ('local_rules', 'openai')),
  model text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index scenario_ai_analyses_scenario_created_idx
  on public.scenario_ai_analyses (scenario_id, created_at desc);

alter table public.scenario_ai_analyses enable row level security;

create policy scenario_ai_analyses_read
  on public.scenario_ai_analyses for select to authenticated
  using (
    created_by = auth.uid() or
    public.has_role('decision_owner') or
    public.has_role('admin')
  );

create policy scenario_ai_analyses_insert
  on public.scenario_ai_analyses for insert to authenticated
  with check (
    created_by = auth.uid() and
    (public.has_role('decision_owner') or public.has_role('admin'))
  );

revoke all on public.scenario_ai_analyses from public, anon, authenticated;
grant select, insert on public.scenario_ai_analyses to authenticated;
