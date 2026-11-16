-- 0014_case_observations_debrief.sql
-- Phase 8: simulation expansion on the existing case engine (same security model as 0009):
--   * observations: each decision step may carry a set of named readings (the "changing patient"); a step's readings are shown with the step and,
--     afterwards, with the committed step. Readings of later steps are never sent early (they belong to those steps);
--   * consequence: what happened as a result of an option; stored in the scoring-key table, so it is revealed only for a committed decision;
--   * debrief: authored learning points and links per case, revealed only in the summary of a COMPLETED attempt, together with a computed path
--     summary (counts by scope-of-practice label, the steps to revisit).
-- No new function; cs_get is replaced with the extended output. Nothing here makes a clinical case visible: the content gate and publish guard are unchanged.

alter table public.case_steps add column observations jsonb not null default '[]'::jsonb
  check (jsonb_typeof(observations) = 'array' and jsonb_array_length(observations) <= 8);
alter table public.case_option_keys add column consequence jsonb
  check (consequence is null or (jsonb_typeof(consequence) = 'object' and consequence ? 'en' and char_length(consequence ->> 'en') between 10 and 600));
alter table public.case_items add column debrief jsonb
  check (debrief is null or (jsonb_typeof(debrief) = 'object' and debrief ? 'learning_points' and jsonb_typeof(debrief -> 'learning_points') = 'object'
         and (debrief -> 'learning_points') ? 'en' and jsonb_typeof(debrief -> 'learning_points' -> 'en') = 'array' and jsonb_array_length(debrief -> 'learning_points' -> 'en') between 1 and 8));

-- Structure of one reading: { key, label:{en}, value: number|string, unit?, low?, high? }
create or replace function private.case_observations_ok(p jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select jsonb_typeof(p) = 'array' and not exists (
    select 1 from jsonb_array_elements(p) e
    where jsonb_typeof(e) <> 'object' or not (e ? 'key' and e ? 'label' and e ? 'value')
       or jsonb_typeof(e -> 'key') <> 'string' or (e ->> 'key') !~ '^[a-z][a-z0-9_]{1,30}$'
       or jsonb_typeof(e -> 'label') <> 'object' or not ((e -> 'label') ? 'en')
       or jsonb_typeof(e -> 'value') not in ('number', 'string')
       or (e ? 'unit' and jsonb_typeof(e -> 'unit') <> 'string')
       or (e ? 'low' and jsonb_typeof(e -> 'low') <> 'number') or (e ? 'high' and jsonb_typeof(e -> 'high') <> 'number'))
$$;
alter table public.case_steps add constraint case_steps_observations_ok check (private.case_observations_ok(observations));

-- The debrief is part of a published case's content: freeze it with the rest.
create or replace function private.case_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.title is distinct from old.title or new.vignette is distinct from old.vignette or new.kind is distinct from old.kind
       or new.domain_id is distinct from old.domain_id or new.version is distinct from old.version or new.code is distinct from old.code
       or new.debrief is distinct from old.debrief) then
    raise exception 'a published case is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;

create or replace function public.cs_get(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.case_attempts; c public.case_items; done boolean; trail jsonb; cur jsonb; summary jsonb; st public.case_steps; debrief jsonb;
begin
  perform private.require_user();
  a := private.own_case_attempt(p_attempt);
  done := a.status <> 'in_progress';
  if not done and not private.case_is_visible(a.case_id) then raise exception 'case no longer available' using errcode = 'P0002'; end if;
  select * into c from public.case_items where id = a.case_id;

  -- Committed steps: everything about them is revealed (all options with points, scope, feedback and consequence).
  select coalesce(jsonb_agg(jsonb_build_object(
      'position', s.position, 'info', s.info, 'prompt', s.prompt, 'observations', s.observations, 'chosen_option_id', t.option_id, 'points', t.points,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text, 'points', k.points, 'scope', k.scope, 'feedback', k.feedback, 'consequence', k.consequence)
                                   order by array_position((select array_agg(o2.id order by md5(a.seed || s.id::text || o2.id::text) collate "C") from public.case_step_options o2 where o2.step_id = s.id), o.id))
                  from public.case_step_options o join public.case_option_keys k on k.option_id = o.id where o.step_id = s.id)
    ) order by s.position), '[]'::jsonb) into trail
  from public.case_attempt_steps t join public.case_steps s on s.case_id = a.case_id and s.position = t.position
  where t.attempt_id = a.id;

  -- Current step: information, readings and shuffled option TEXT only. No points, scope, feedback, consequence or next step.
  if not done then
    select * into st from public.case_steps where case_id = a.case_id and position = a.current_position;
    cur := jsonb_build_object('position', st.position, 'info', st.info, 'prompt', st.prompt, 'observations', st.observations,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text)
                                   order by array_position((select array_agg(o2.id order by md5(a.seed || st.id::text || o2.id::text) collate "C") from public.case_step_options o2 where o2.step_id = st.id), o.id))
                  from public.case_step_options o where o.step_id = st.id));
  end if;

  if a.status = 'completed' then
    debrief := jsonb_build_object(
      'learning_points', c.debrief -> 'learning_points', 'links', coalesce(c.debrief -> 'links', '[]'::jsonb),
      'scope_counts', coalesce((select jsonb_object_agg(x.scope, x.n) from (select k.scope, count(*) n from public.case_attempt_steps t join public.case_option_keys k on k.option_id = t.option_id where t.attempt_id = a.id group by k.scope) x), '{}'::jsonb),
      'revisit_positions', coalesce((select jsonb_agg(t.position order by t.position) from public.case_attempt_steps t where t.attempt_id = a.id and t.points < 2), '[]'::jsonb));
    summary := jsonb_build_object('points', a.points, 'max_points', a.max_points, 'score_tenths', a.score_tenths, 'steps', a.steps_taken,
      'duration_seconds', extract(epoch from (a.completed_at - a.started_at))::int, 'debrief', debrief);
  end if;

  return jsonb_build_object(
    'id', a.id, 'status', a.status, 'started_at', a.started_at, 'completed_at', a.completed_at, 'current_position', a.current_position,
    'case', jsonb_build_object('id', c.id, 'code', c.code, 'title', c.title, 'vignette', c.vignette, 'difficulty', c.difficulty, 'synthetic', (c.kind = 'demo_synthetic'),
       'steps', (select count(*) from public.case_steps where case_id = c.id),
       'domain_slug', (select slug from public.nursing_domains where id = c.domain_id), 'domain_title', (select title from public.nursing_domains where id = c.domain_id)),
    'trail', trail, 'current', cur, 'summary', summary);
end $$;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.cs_get(uuid) to authenticated;
