-- Lightweight history for the Industry Intelligence research-agent MVP.

create table public.intelligence_research_runs (
  id uuid primary key default gen_random_uuid(),
  brief text not null check (char_length(brief) between 10 and 800),
  search_query text not null check (char_length(search_query) between 1 and 128),
  result jsonb not null,
  engine text not null check (engine in ('deepseek', 'search_only')),
  model text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index intelligence_research_runs_creator_created_idx
  on public.intelligence_research_runs (created_by, created_at desc);

alter table public.intelligence_research_runs enable row level security;

create policy intelligence_research_runs_read
  on public.intelligence_research_runs for select to authenticated
  using (
    created_by = auth.uid() or
    public.has_role('decision_owner') or
    public.has_role('admin')
  );

create policy intelligence_research_runs_insert
  on public.intelligence_research_runs for insert to authenticated
  with check (created_by = auth.uid());

revoke all on public.intelligence_research_runs from public, anon, authenticated;
grant select, insert on public.intelligence_research_runs to authenticated;
