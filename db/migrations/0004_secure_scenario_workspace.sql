-- Secure scenario persistence. The client supplies inputs only; PostgreSQL
-- recalculates every stored result and writes the snapshot, evidence links and
-- audit event in one transaction.

drop policy if exists scenarios_owner_insert on public.scenarios;
create policy scenarios_owner_insert on public.scenarios for insert to authenticated
with check (
  owner_id = auth.uid() and
  (public.has_role('decision_owner') or public.has_role('admin'))
);

revoke insert on public.scenario_snapshots from authenticated;
revoke insert, update on public.evidence_records from authenticated;
revoke insert, update on public.scenarios from authenticated;
revoke insert, update, delete on public.scenario_evidence from authenticated;
revoke insert on public.audit_events from authenticated;

create or replace function public.save_scenario_snapshot(
  p_scenario_id uuid,
  p_product_id uuid,
  p_business_month date,
  p_name text,
  p_inputs jsonb,
  p_rationale text default '',
  p_evidence_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_scenario public.scenarios%rowtype;
  v_snapshot_id uuid;
  v_quantity numeric;
  v_price numeric;
  v_cost numeric;
  v_fixed numeric;
  v_capacity numeric;
  v_capex numeric;
  v_demand numeric;
  v_demand_units integer;
  v_units integer;
  v_revenue numeric;
  v_variable_cost numeric;
  v_gross_profit numeric;
  v_operating_profit numeric;
  v_result jsonb;
  v_evidence_ids uuid[] := coalesce(p_evidence_ids, '{}'::uuid[]);
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not (public.has_role('decision_owner') or public.has_role('admin')) then
    raise exception 'Scenario save permission required.' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) < 1 or char_length(btrim(p_name)) > 120 then
    raise exception 'Scenario name must contain 1 to 120 characters.' using errcode = '22023';
  end if;

  if char_length(coalesce(p_rationale, '')) > 2000 then
    raise exception 'Scenario rationale cannot exceed 2,000 characters.' using errcode = '22023';
  end if;

  if cardinality(v_evidence_ids) > 20 then
    raise exception 'A scenario can link at most 20 evidence records.' using errcode = '22023';
  end if;

  if p_business_month is null or date_trunc('month', p_business_month)::date <> p_business_month then
    raise exception 'Business month must be the first day of a month.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.products where id = p_product_id and active) then
    raise exception 'An active product is required.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_inputs) <> 'object' then
    raise exception 'Scenario inputs must be a JSON object.' using errcode = '22023';
  end if;

  begin
    v_quantity := (p_inputs ->> 'quantity')::numeric;
    v_price := (p_inputs ->> 'price')::numeric;
    v_cost := (p_inputs ->> 'cost')::numeric;
    v_fixed := (p_inputs ->> 'fixed')::numeric;
    v_capacity := (p_inputs ->> 'capacity')::numeric;
    v_capex := (p_inputs ->> 'capex')::numeric;
    v_demand := (p_inputs ->> 'demand')::numeric;
  exception when others then
    raise exception 'Scenario inputs contain invalid numeric values.' using errcode = '22023';
  end;

  if v_quantity is null or v_price is null or v_cost is null or v_fixed is null or
     v_capacity is null or v_capex is null or v_demand is null then
    raise exception 'Every scenario input is required.' using errcode = '22023';
  end if;

  if v_quantity < 0 or v_quantity > 1000000000 or trunc(v_quantity) <> v_quantity or
     v_price < 0 or v_price > 1000000000 or
     v_cost < 0 or v_cost > 1000000000 or
     v_fixed < 0 or v_fixed > 1000000000 or
     v_capacity < 0 or v_capacity > 1000000000 or trunc(v_capacity) <> v_capacity or
     v_capex < 0 or v_capex > 1000000000 or
     v_demand < -100 or v_demand > 200 then
    raise exception 'Scenario inputs are outside the accepted range.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(v_evidence_ids) as selected_id
    left join public.evidence_records evidence on evidence.id = selected_id
    where evidence.id is null
  ) then
    raise exception 'One or more evidence records do not exist.' using errcode = '22023';
  end if;

  v_demand_units := greatest(0, round(v_quantity * (1 + v_demand / 100)))::integer;
  v_units := least(v_demand_units, v_capacity)::integer;
  v_revenue := v_units * v_price;
  v_variable_cost := v_units * v_cost;
  v_gross_profit := v_revenue - v_variable_cost;
  v_operating_profit := v_gross_profit - v_fixed;

  v_result := jsonb_build_object(
    'formulaVersion', '2.0.0',
    'demandUnits', v_demand_units,
    'units', v_units,
    'revenue', v_revenue,
    'variableCost', v_variable_cost,
    'grossProfit', v_gross_profit,
    'operatingProfit', v_operating_profit,
    'grossMargin', case when v_revenue = 0 then null else v_gross_profit / v_revenue end,
    'capacityUtilization', case when v_capacity = 0 then null else v_units / v_capacity end,
    'unservedDemand', v_demand_units - v_units,
    'capex', v_capex
  );

  if p_scenario_id is null then
    insert into public.scenarios (product_id, business_month, owner_id, name)
    values (p_product_id, p_business_month, v_actor, btrim(p_name))
    returning * into v_scenario;
  else
    select * into v_scenario
    from public.scenarios
    where id = p_scenario_id
    for update;

    if not found then
      raise exception 'Scenario not found.' using errcode = '22023';
    end if;

    if v_scenario.owner_id <> v_actor and not public.has_role('admin') then
      raise exception 'Only the scenario owner or an administrator can save a new snapshot.' using errcode = '42501';
    end if;

    if v_scenario.product_id <> p_product_id or v_scenario.business_month <> p_business_month then
      raise exception 'Product and business month cannot change after scenario creation.' using errcode = '22023';
    end if;

    update public.scenarios
    set name = btrim(p_name), version = version + 1, updated_at = now()
    where id = p_scenario_id
    returning * into v_scenario;
  end if;

  insert into public.scenario_snapshots
    (scenario_id, created_by, inputs, calculated_result, formula_version, rationale)
  values
    (v_scenario.id, v_actor, p_inputs, v_result, '2.0.0', coalesce(p_rationale, ''))
  returning id into v_snapshot_id;

  delete from public.scenario_evidence where scenario_id = v_scenario.id;
  insert into public.scenario_evidence (scenario_id, evidence_id, linked_by)
  select v_scenario.id, selected_id, v_actor
  from (select distinct unnest(v_evidence_ids) as selected_id) selected;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    case when p_scenario_id is null then 'scenario.created' else 'scenario.snapshot_saved' end,
    'scenario',
    v_scenario.id::text,
    jsonb_build_object(
      'snapshot_id', v_snapshot_id,
      'formula_version', '2.0.0',
      'scenario_version', v_scenario.version,
      'evidence_count', cardinality(v_evidence_ids)
    )
  );

  return jsonb_build_object(
    'scenarioId', v_scenario.id,
    'snapshotId', v_snapshot_id,
    'version', v_scenario.version,
    'result', v_result
  );
end;
$$;

revoke all on function public.save_scenario_snapshot(uuid, uuid, date, text, jsonb, text, uuid[]) from public, anon;
grant execute on function public.save_scenario_snapshot(uuid, uuid, date, text, jsonb, text, uuid[]) to authenticated;

create or replace function public.create_evidence_record(
  p_title text,
  p_publisher text,
  p_source_url text,
  p_published_on date,
  p_topic text,
  p_fact text,
  p_interpretation text,
  p_limitations text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_evidence_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not (public.has_role('decision_owner') or public.has_role('admin')) then
    raise exception 'Evidence write permission required.' using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(p_title, ''))) not between 1 and 180 or
     char_length(btrim(coalesce(p_publisher, ''))) not between 1 and 120 or
     p_source_url !~* '^https?://' or char_length(p_source_url) > 2000 or
     p_topic not in ('Demand', 'Competition', 'Cost', 'Capacity', 'Quality', 'Regulation') or
     char_length(btrim(coalesce(p_fact, ''))) not between 1 and 2000 or
     char_length(btrim(coalesce(p_interpretation, ''))) not between 1 and 2000 or
     char_length(btrim(coalesce(p_limitations, ''))) not between 1 and 2000 then
    raise exception 'Evidence record is invalid.' using errcode = '22023';
  end if;

  insert into public.evidence_records
    (title, publisher, source_url, published_on, topic, fact, interpretation, limitations, verification_status, created_by)
  values
    (btrim(p_title), btrim(p_publisher), p_source_url, p_published_on, p_topic,
     btrim(p_fact), btrim(p_interpretation), btrim(p_limitations), 'unverified', v_actor)
  returning id into v_evidence_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'evidence.created',
    'evidence_record',
    v_evidence_id::text,
    jsonb_build_object('topic', p_topic, 'publisher', btrim(p_publisher))
  );

  return jsonb_build_object('id', v_evidence_id, 'title', btrim(p_title));
end;
$$;

revoke all on function public.create_evidence_record(text, text, text, date, text, text, text, text) from public, anon;
grant execute on function public.create_evidence_record(text, text, text, date, text, text, text, text) to authenticated;
