-- Conditional decision submission and four-eyes approval workflow.

alter table public.decisions
  add column review_note text not null default '',
  add column reviewed_by uuid references public.profiles(id),
  add column reviewed_at timestamptz,
  add column updated_at timestamptz not null default now(),
  add constraint decision_review_note_length_check
    check (char_length(review_note) <= 2000);

update public.decisions
set reviewed_by = approved_by,
    reviewed_at = approved_at,
    updated_at = coalesce(approved_at, created_at)
where approved_by is not null or approved_at is not null;

create unique index decisions_one_pending_per_scenario_idx
  on public.decisions (scenario_id)
  where status = 'submitted';

create table public.workflow_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  body text not null check (char_length(body) between 1 and 1000),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text not null check (char_length(entity_id) between 1 and 120),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index workflow_notifications_user_created_idx
  on public.workflow_notifications (user_id, created_at desc);

alter table public.workflow_notifications enable row level security;

create policy workflow_notifications_read_self
  on public.workflow_notifications for select to authenticated
  using (user_id = auth.uid());

create policy workflow_notifications_mark_read_self
  on public.workflow_notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists decisions_owner_insert on public.decisions;
drop policy if exists decisions_approver_update on public.decisions;

revoke insert, update, delete on public.decisions from authenticated;
revoke all on public.workflow_notifications from public, anon, authenticated;
grant select on public.workflow_notifications to authenticated;
grant update (read_at) on public.workflow_notifications to authenticated;

create or replace function public.guard_locked_scenario_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.scenario_status;
begin
  select status into v_status from public.scenarios where id = new.scenario_id;
  if v_status in ('submitted', 'approved', 'archived') then
    raise exception 'A submitted, approved or archived scenario cannot receive another snapshot.' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger scenario_snapshots_guard_locked_status
before insert on public.scenario_snapshots
for each row execute function public.guard_locked_scenario_snapshot();

revoke all on function public.guard_locked_scenario_snapshot() from public, anon, authenticated;

create or replace function public.submit_scenario_decision(
  p_scenario_id uuid,
  p_snapshot_id uuid,
  p_title text,
  p_recommendation text,
  p_review_trigger text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_scenario public.scenarios%rowtype;
  v_decision_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not (public.has_role('decision_owner') or public.has_role('admin')) then
    raise exception 'Decision submission permission required.' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 180 or
     char_length(btrim(coalesce(p_recommendation, ''))) not between 1 and 3000 or
     char_length(btrim(coalesce(p_review_trigger, ''))) not between 1 and 2000 then
    raise exception 'Decision submission is invalid.' using errcode = '22023';
  end if;

  select * into v_scenario
  from public.scenarios
  where id = p_scenario_id
  for update;

  if not found then
    raise exception 'Scenario not found.' using errcode = '22023';
  end if;

  if v_scenario.owner_id <> v_actor and not public.has_role('admin') then
    raise exception 'Only the scenario owner or an administrator can submit a decision.' using errcode = '42501';
  end if;

  if v_scenario.status in ('approved', 'archived') then
    raise exception 'An approved or archived scenario cannot be submitted again.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.scenario_snapshots snapshot
    where snapshot.id = p_snapshot_id and snapshot.scenario_id = p_scenario_id
  ) then
    raise exception 'The selected snapshot does not belong to this scenario.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.decisions
    where scenario_id = p_scenario_id and status = 'submitted'
  ) then
    raise exception 'This scenario already has a decision awaiting review.' using errcode = '22023';
  end if;

  insert into public.decisions
    (scenario_id, snapshot_id, title, recommendation, review_trigger, status, submitted_by)
  values
    (p_scenario_id, p_snapshot_id, btrim(p_title), btrim(p_recommendation),
     btrim(p_review_trigger), 'submitted', v_actor)
  returning id into v_decision_id;

  update public.scenarios
  set status = 'submitted', updated_at = now()
  where id = p_scenario_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'decision.submitted',
    'decision',
    v_decision_id::text,
    jsonb_build_object('scenario_id', p_scenario_id, 'snapshot_id', p_snapshot_id)
  );

  insert into public.workflow_notifications
    (user_id, title, body, entity_type, entity_id)
  select distinct
    role.user_id,
    'Decision awaiting review',
    btrim(p_title) || ' requires approval from someone other than the submitter.',
    'decision',
    v_decision_id::text
  from public.user_roles role
  join public.profiles profile on profile.id = role.user_id and profile.active
  where role.role in ('decision_owner', 'admin')
    and role.user_id <> v_actor;

  return jsonb_build_object(
    'id', v_decision_id,
    'scenarioId', p_scenario_id,
    'snapshotId', p_snapshot_id,
    'status', 'submitted'
  );
exception
  when unique_violation then
    raise exception 'This scenario already has a decision awaiting review.' using errcode = '22023';
end;
$$;

create or replace function public.review_scenario_decision(
  p_decision_id uuid,
  p_action text,
  p_review_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_decision public.decisions%rowtype;
  v_reviewed_at timestamptz := now();
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not (public.has_role('decision_owner') or public.has_role('admin')) then
    raise exception 'Decision approval permission required.' using errcode = '42501';
  end if;

  if p_action not in ('approved', 'rejected') or
     char_length(coalesce(p_review_note, '')) > 2000 then
    raise exception 'Decision review is invalid.' using errcode = '22023';
  end if;

  if p_action = 'rejected' and char_length(btrim(coalesce(p_review_note, ''))) = 0 then
    raise exception 'A rejection note is required.' using errcode = '22023';
  end if;

  select * into v_decision
  from public.decisions
  where id = p_decision_id
  for update;

  if not found then
    raise exception 'Decision not found.' using errcode = '22023';
  end if;

  if v_decision.status <> 'submitted' then
    raise exception 'Only a submitted decision can be reviewed.' using errcode = '22023';
  end if;

  if v_decision.submitted_by = v_actor then
    raise exception 'The submitter cannot approve or reject their own decision.' using errcode = '42501';
  end if;

  update public.decisions
  set status = p_action::public.scenario_status,
      review_note = btrim(coalesce(p_review_note, '')),
      reviewed_by = v_actor,
      reviewed_at = v_reviewed_at,
      approved_by = case when p_action = 'approved' then v_actor else null end,
      approved_at = case when p_action = 'approved' then v_reviewed_at else null end,
      updated_at = v_reviewed_at
  where id = p_decision_id;

  update public.scenarios
  set status = p_action::public.scenario_status, updated_at = v_reviewed_at
  where id = v_decision.scenario_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'decision.' || p_action,
    'decision',
    p_decision_id::text,
    jsonb_build_object(
      'scenario_id', v_decision.scenario_id,
      'snapshot_id', v_decision.snapshot_id,
      'review_note', btrim(coalesce(p_review_note, ''))
    )
  );

  insert into public.workflow_notifications
    (user_id, title, body, entity_type, entity_id)
  values (
    v_decision.submitted_by,
    case when p_action = 'approved' then 'Decision approved' else 'Decision rejected' end,
    v_decision.title || case
      when p_action = 'approved' then ' was approved by a second decision owner.'
      else ' was rejected. Review the recorded note before resubmitting.'
    end,
    'decision',
    p_decision_id::text
  );

  return jsonb_build_object(
    'id', p_decision_id,
    'scenarioId', v_decision.scenario_id,
    'status', p_action,
    'reviewedAt', v_reviewed_at
  );
end;
$$;

revoke all on function public.submit_scenario_decision(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.submit_scenario_decision(uuid, uuid, text, text, text) to authenticated;

revoke all on function public.review_scenario_decision(uuid, text, text) from public, anon;
grant execute on function public.review_scenario_decision(uuid, text, text) to authenticated;
