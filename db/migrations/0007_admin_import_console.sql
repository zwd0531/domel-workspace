-- Audited administrator imports and controlled role assignment.

revoke insert, update, delete on public.monthly_sales from authenticated;
revoke insert, update, delete on public.monthly_production from authenticated;
revoke insert, update, delete on public.monthly_quality from authenticated;
revoke insert, update, delete on public.monthly_costs from authenticated;
revoke insert, update, delete on public.import_runs from authenticated;
revoke insert, update, delete on public.user_roles from authenticated;

create or replace function public.import_operational_dataset(
  p_source_type text,
  p_source_name text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_run_id uuid;
  v_row_count integer;
  v_missing_products text[];
  v_error_code text;
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not public.has_role('admin') then
    raise exception 'Administrator import permission required.' using errcode = '42501';
  end if;

  if p_source_type not in ('sales', 'production', 'quality', 'costs') or
     char_length(btrim(coalesce(p_source_name, ''))) not between 1 and 180 or
     jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Import request is invalid.' using errcode = '22023';
  end if;

  v_row_count := jsonb_array_length(p_rows);
  if v_row_count not between 1 and 500 then
    raise exception 'Import must contain 1 to 500 rows.' using errcode = '22023';
  end if;

  insert into public.import_runs
    (source_type, source_name, status, rows_received, imported_by)
  values
    (p_source_type, btrim(p_source_name), 'pending', v_row_count, v_actor)
  returning id into v_run_id;

  begin
    select array_agg(source_key order by source_key) into v_missing_products
    from (
      select distinct concat(row_data ->> 'plant_code', '/', row_data ->> 'product_code') as source_key
      from jsonb_array_elements(p_rows) row_data
      left join public.plants plant on plant.code = row_data ->> 'plant_code'
      left join public.products product
        on product.plant_id = plant.id
       and product.code = row_data ->> 'product_code'
       and product.active
      where product.id is null
    ) missing;

    if cardinality(v_missing_products) > 0 then
      raise exception 'Unknown or inactive products: %', array_to_string(v_missing_products, ', ')
        using errcode = '22023';
    end if;

    if p_source_type = 'sales' then
      insert into public.monthly_sales
        (product_id, month, order_count, shipped_units, unit_price, currency, source_label, imported_at)
      select
        product.id, row_data.month, row_data.order_count, row_data.shipped_units,
        row_data.unit_price, upper(row_data.currency), btrim(p_source_name), now()
      from jsonb_to_recordset(p_rows) as row_data(
        plant_code text, product_code text, month date, order_count integer,
        shipped_units integer, unit_price numeric, currency text
      )
      join public.plants plant on plant.code = row_data.plant_code
      join public.products product
        on product.plant_id = plant.id and product.code = row_data.product_code and product.active
      on conflict (product_id, month) do update set
        order_count = excluded.order_count,
        shipped_units = excluded.shipped_units,
        unit_price = excluded.unit_price,
        currency = excluded.currency,
        source_label = excluded.source_label,
        imported_at = excluded.imported_at;
    elsif p_source_type = 'production' then
      insert into public.monthly_production
        (product_id, month, planned_units, produced_units, on_time_rate, source_label, imported_at)
      select
        product.id, row_data.month, row_data.planned_units, row_data.produced_units,
        row_data.on_time_rate, btrim(p_source_name), now()
      from jsonb_to_recordset(p_rows) as row_data(
        plant_code text, product_code text, month date, planned_units integer,
        produced_units integer, on_time_rate numeric
      )
      join public.plants plant on plant.code = row_data.plant_code
      join public.products product
        on product.plant_id = plant.id and product.code = row_data.product_code and product.active
      on conflict (product_id, month) do update set
        planned_units = excluded.planned_units,
        produced_units = excluded.produced_units,
        on_time_rate = excluded.on_time_rate,
        source_label = excluded.source_label,
        imported_at = excluded.imported_at;
    elsif p_source_type = 'quality' then
      insert into public.monthly_quality
        (product_id, month, tested_units, passed_units, field_returns, defect_rate, risk, quality_note, source_label, imported_at)
      select
        product.id, row_data.month, row_data.tested_units, row_data.passed_units,
        row_data.field_returns, row_data.defect_rate, row_data.risk,
        nullif(btrim(row_data.quality_note), ''), btrim(p_source_name), now()
      from jsonb_to_recordset(p_rows) as row_data(
        plant_code text, product_code text, month date, tested_units integer,
        passed_units integer, field_returns integer, defect_rate numeric,
        risk text, quality_note text
      )
      join public.plants plant on plant.code = row_data.plant_code
      join public.products product
        on product.plant_id = plant.id and product.code = row_data.product_code and product.active
      on conflict (product_id, month) do update set
        tested_units = excluded.tested_units,
        passed_units = excluded.passed_units,
        field_returns = excluded.field_returns,
        defect_rate = excluded.defect_rate,
        risk = excluded.risk,
        quality_note = excluded.quality_note,
        source_label = excluded.source_label,
        imported_at = excluded.imported_at;
    else
      insert into public.monthly_costs
        (product_id, month, unit_variable_cost, monthly_fixed_cost, currency, source_label, imported_at)
      select
        product.id, row_data.month, row_data.unit_variable_cost, row_data.monthly_fixed_cost,
        upper(row_data.currency), btrim(p_source_name), now()
      from jsonb_to_recordset(p_rows) as row_data(
        plant_code text, product_code text, month date, unit_variable_cost numeric,
        monthly_fixed_cost numeric, currency text
      )
      join public.plants plant on plant.code = row_data.plant_code
      join public.products product
        on product.plant_id = plant.id and product.code = row_data.product_code and product.active
      on conflict (product_id, month) do update set
        unit_variable_cost = excluded.unit_variable_cost,
        monthly_fixed_cost = excluded.monthly_fixed_cost,
        currency = excluded.currency,
        source_label = excluded.source_label,
        imported_at = excluded.imported_at;
    end if;

    update public.import_runs
    set status = 'completed', rows_imported = v_row_count, completed_at = now()
    where id = v_run_id;

    insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
    values (
      v_actor,
      'import.completed',
      'import_run',
      v_run_id::text,
      jsonb_build_object('source_type', p_source_type, 'source_name', btrim(p_source_name), 'row_count', v_row_count)
    );

    return jsonb_build_object('id', v_run_id, 'status', 'completed', 'rowsImported', v_row_count);
  exception when others then
    get stacked diagnostics v_error_code = returned_sqlstate;

    update public.import_runs
    set status = 'failed',
        errors = jsonb_build_array('Database validation failed (' || v_error_code || ').'),
        completed_at = now()
    where id = v_run_id;

    insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
    values (
      v_actor,
      'import.failed',
      'import_run',
      v_run_id::text,
      jsonb_build_object('source_type', p_source_type, 'source_name', btrim(p_source_name), 'error_code', v_error_code)
    );

    return jsonb_build_object('id', v_run_id, 'status', 'failed', 'rowsImported', 0);
  end;
end;
$$;

create or replace function public.set_user_roles(
  p_user_id uuid,
  p_roles public.app_role[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_roles public.app_role[] := coalesce(p_roles, '{}'::public.app_role[]);
  v_other_active_admins integer;
  v_display_name text;
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not public.has_role('admin') then
    raise exception 'Administrator user-management permission required.' using errcode = '42501';
  end if;

  if cardinality(v_roles) > 5 or cardinality(v_roles) <> (
    select count(distinct selected_role) from unnest(v_roles) selected_role
  ) then
    raise exception 'Role assignment is invalid.' using errcode = '22023';
  end if;

  -- Serialize role mutations so two administrators cannot concurrently remove
  -- each other's final Administrator role.
  perform pg_advisory_xact_lock(hashtext('domel-admin-role-guard'));

  select display_name into v_display_name
  from public.profiles
  where id = p_user_id and active
  for update;

  if not found then
    raise exception 'Active user profile not found.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.user_roles where user_id = p_user_id and role = 'admin'
  ) and not ('admin' = any(v_roles)) then
    select count(distinct role.user_id) into v_other_active_admins
    from public.user_roles role
    join public.profiles profile on profile.id = role.user_id and profile.active
    where role.role = 'admin' and role.user_id <> p_user_id;

    if v_other_active_admins = 0 then
      raise exception 'The final active administrator role cannot be removed.' using errcode = '22023';
    end if;
  end if;

  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role, assigned_by)
  select p_user_id, selected_role, v_actor from unnest(v_roles) selected_role;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'user.roles_updated',
    'profile',
    p_user_id::text,
    jsonb_build_object('roles', to_jsonb(v_roles))
  );

  insert into public.workflow_notifications (user_id, title, body, entity_type, entity_id)
  values (
    p_user_id,
    'Access roles updated',
    'An administrator updated your Domel workspace roles. Sign in again if navigation does not refresh.',
    'profile',
    p_user_id::text
  );

  return jsonb_build_object('userId', p_user_id, 'displayName', v_display_name, 'roles', to_jsonb(v_roles));
end;
$$;

revoke all on function public.import_operational_dataset(text, text, jsonb) from public, anon;
grant execute on function public.import_operational_dataset(text, text, jsonb) to authenticated;

revoke all on function public.set_user_roles(uuid, public.app_role[]) from public, anon;
grant execute on function public.set_user_roles(uuid, public.app_role[]) to authenticated;
