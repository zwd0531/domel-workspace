-- Formal Industry Intelligence review workflow.

alter table public.evidence_records
  add column review_note text not null default '',
  add column reviewed_by uuid references public.profiles(id),
  add column reviewed_at timestamptz;

update public.evidence_records
set verification_status = case lower(replace(verification_status, ' ', '_'))
  when 'source_reviewed' then 'source_reviewed'
  when 'needs_follow_up' then 'needs_follow_up'
  when 'rejected' then 'rejected'
  else 'unverified'
end;

alter table public.evidence_records
  add constraint evidence_verification_status_check
  check (verification_status in ('unverified', 'source_reviewed', 'needs_follow_up', 'rejected')),
  add constraint evidence_review_note_length_check
  check (char_length(review_note) <= 2000);

create index evidence_topic_status_idx
  on public.evidence_records (topic, verification_status, published_on desc);

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
     p_topic not in ('Technology', 'Competition', 'Policy', 'Demand', 'Supply chain', 'Cost', 'Capacity', 'Quality', 'Regulation') or
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

create or replace function public.review_evidence_record(
  p_evidence_id uuid,
  p_status text,
  p_review_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_title text;
begin
  if v_actor is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not (public.has_role('decision_owner') or public.has_role('admin')) then
    raise exception 'Evidence review permission required.' using errcode = '42501';
  end if;

  if p_status not in ('unverified', 'source_reviewed', 'needs_follow_up', 'rejected') or
     char_length(coalesce(p_review_note, '')) > 2000 then
    raise exception 'Evidence review is invalid.' using errcode = '22023';
  end if;

  if p_status in ('needs_follow_up', 'rejected') and char_length(btrim(coalesce(p_review_note, ''))) = 0 then
    raise exception 'A review note is required for this status.' using errcode = '22023';
  end if;

  update public.evidence_records
  set verification_status = p_status,
      review_note = btrim(coalesce(p_review_note, '')),
      reviewed_by = v_actor,
      reviewed_at = now()
  where id = p_evidence_id
  returning title into v_title;

  if not found then
    raise exception 'Evidence record not found.' using errcode = '22023';
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    v_actor,
    'evidence.reviewed',
    'evidence_record',
    p_evidence_id::text,
    jsonb_build_object('status', p_status, 'review_note', btrim(coalesce(p_review_note, '')))
  );

  return jsonb_build_object(
    'id', p_evidence_id,
    'title', v_title,
    'status', p_status,
    'reviewedAt', now()
  );
end;
$$;

revoke all on function public.review_evidence_record(uuid, text, text) from public, anon;
grant execute on function public.review_evidence_record(uuid, text, text) to authenticated;
