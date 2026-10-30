-- Use DeepSeek for new scenario analyses while preserving historical provider records.

alter table public.scenario_ai_analyses
  drop constraint if exists scenario_ai_analyses_engine_check;

alter table public.scenario_ai_analyses
  add constraint scenario_ai_analyses_engine_check
  check (engine in ('local_rules', 'deepseek', 'openai'));
