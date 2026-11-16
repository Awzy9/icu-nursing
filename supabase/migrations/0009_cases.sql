-- 0009_cases.sql
-- Phase 5: case-based learning. Branching, step-by-step scenarios with deterministic 0-2 partial-credit decisions.
-- Same security model as the question bank (0006/0007):
--   * scoring keys (points, next step, scope-of-practice label, feedback) live in a table learners cannot read; they are revealed
--     only for a decision the learner has already committed (or a completed case). Later steps are never sent early;
--   * learners cannot write any case table; everything goes through SECURITY DEFINER functions with auth.uid() checks;
--   * content gate: demo_synthetic cases need the SYNTHETIC FIXTURE label and a development database with fixtures switched on;
--     clinical cases need an approver, an independent clinical reviewer and a published topic. No function in this phase sets those
--     fields, and a guard trigger rejects any publication (by any writer) that lacks them or has an invalid structure.
-- Scores are educational feedback about alignment with a reference answer, not evidence of clinical competence.

create table public.case_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$'),
  kind public.content_kind not null,
  status public.content_status not null default 'draft',
  origin public.content_origin not null default 'human',
  domain_id uuid not null references public.nursing_domains (id),
  topic_id uuid references public.topics (id) on delete set null,
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  title jsonb not null check (jsonb_typeof(title) = 'object' and title ? 'en' and char_length(title ->> 'en') between 3 and 200),
  vignette jsonb not null check (jsonb_typeof(vignette) = 'object' and vignette ? 'en' and char_length(vignette ->> 'en') between 10 and 3000),
  source_note text check (char_length(source_note) <= 1000),
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index case_items_domain_idx on public.case_items (domain_id);
create index case_items_topic_idx on public.case_items (topic_id);
create index case_items_created_by_idx on public.case_items (created_by);
create index case_items_reviewed_by_idx on public.case_items (reviewed_by);
create index case_items_approved_by_idx on public.case_items (approved_by);
alter table public.case_items enable row level security;

create table public.case_steps (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.case_items (id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  info jsonb not null check (jsonb_typeof(info) = 'object' and info ? 'en'),
  prompt jsonb not null check (jsonb_typeof(prompt) = 'object' and prompt ? 'en'),
  unique (case_id, position),
  unique (case_id, id)
);
alter table public.case_steps enable row level security;

create table public.case_step_options (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  step_id uuid not null,
  position smallint not null check (position between 1 and 4),
  text jsonb not null check (jsonb_typeof(text) = 'object' and text ? 'en' and char_length(text ->> 'en') between 1 and 600),
  unique (step_id, position),
  unique (step_id, id),
  foreign key (case_id, step_id) references public.case_steps (case_id, id) on delete cascade
);
create index case_step_options_case_idx on public.case_step_options (case_id, step_id);
alter table public.case_step_options enable row level security;

-- Scoring key per option: never selectable by learners.
create table public.case_option_keys (
  option_id uuid primary key,
  case_id uuid not null,
  step_id uuid not null,
  points smallint not null check (points between 0 and 2),
  next_position smallint check (next_position between 2 and 8),   -- NULL ends the case
  scope text not null check (scope in ('assessment', 'monitoring', 'escalation', 'independent_nursing', 'order_or_protocol_required', 'prescriber_or_other_discipline')),
  feedback jsonb not null check (jsonb_typeof(feedback) = 'object' and feedback ? 'en' and char_length(feedback ->> 'en') >= 10),
  foreign key (step_id, option_id) references public.case_step_options (step_id, id) on delete cascade
);
create index case_option_keys_step_idx on public.case_option_keys (step_id, option_id);
create index case_option_keys_case_idx on public.case_option_keys (case_id);
alter table public.case_option_keys enable row level security;

create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.case_items (id),
  case_version integer not null,
  seed text not null check (char_length(seed) between 8 and 64),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  current_position smallint not null default 1,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  steps_taken integer,
  points integer,
  max_points integer,
  score_tenths integer check (score_tenths between 0 and 1000),
  check ((status = 'completed') = (completed_at is not null))
);
create index case_attempts_user_idx on public.case_attempts (user_id, started_at desc);
create index case_attempts_case_idx on public.case_attempts (case_id);
alter table public.case_attempts enable row level security;

create table public.case_attempt_steps (
  attempt_id uuid not null references public.case_attempts (id) on delete cascade,
  position smallint not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_id uuid not null references public.case_step_options (id),
  points smallint not null check (points between 0 and 2),   -- written only at commit, so own rows leak nothing early
  committed_at timestamptz not null default now(),
  primary key (attempt_id, position)
);
create index case_attempt_steps_user_idx on public.case_attempt_steps (user_id);
create index case_attempt_steps_option_idx on public.case_attempt_steps (option_id);
alter table public.case_attempt_steps enable row level security;

create trigger case_items_updated before update on public.case_items for each row execute function private.set_updated_at();
create trigger case_items_audit after insert or update or delete on public.case_items for each row execute function private.audit_row();

-- ---------------------------------------------------------------------------------------------
-- Content gate
-- ---------------------------------------------------------------------------------------------
create or replace function private.case_is_visible(p_case uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.case_items c
    where c.id = p_case
      and c.status = 'published' and c.retired_at is null
      and c.approved_at is not null and c.published_at is not null
      and (
        (c.kind = 'demo_synthetic' and c.source_note like 'SYNTHETIC FIXTURE%'
           and (select question_fixtures_visible and environment = 'development' from public.app_settings))
        or (c.kind = 'clinical'
            and c.approved_by is not null
            and c.reviewed_by is not null and c.reviewed_at is not null
            and c.topic_id is not null and private.is_published_topic(c.topic_id))
      )
  )
$$;

-- Structural validation of a case; returns a list of problems (empty = valid).
create or replace function private.case_structure_errors(p_case uuid) returns text[]
language plpgsql stable set search_path = public, pg_temp as $$
declare errs text[] := '{}'; n_steps integer; r record;
begin
  select count(*) into n_steps from public.case_steps where case_id = p_case;
  if n_steps < 2 then errs := array_append(errs, 'a case needs at least two decision steps'::text); end if;
  if exists (select 1 from public.case_steps s where s.case_id = p_case and s.position > n_steps) then errs := array_append(errs, 'step positions must be 1..n without gaps'::text); end if;
  for r in select s.id, s.position,
              (select count(*) from public.case_step_options o where o.step_id = s.id) n_opt,
              (select count(*) from public.case_option_keys k where k.step_id = s.id) n_key,
              (select count(*) filter (where k.points = 2) from public.case_option_keys k where k.step_id = s.id) n_best,
              (select count(*) filter (where k.points < 2) from public.case_option_keys k where k.step_id = s.id) n_less,
              (select count(*) filter (where k.next_position is not null and (k.next_position <= s.position or not exists (select 1 from public.case_steps t where t.case_id = p_case and t.position = k.next_position))) from public.case_option_keys k where k.step_id = s.id) n_bad_next,
              (select count(*) filter (where k.next_position is null) from public.case_option_keys k where k.step_id = s.id) n_end
         from public.case_steps s where s.case_id = p_case loop
    if r.n_opt < 2 or r.n_opt > 4 then errs := array_append(errs, format('step %s needs 2-4 options', r.position)); end if;
    if r.n_key <> r.n_opt then errs := array_append(errs, format('step %s: every option needs a scoring key', r.position)); end if;
    if r.n_best < 1 or r.n_less < 1 then errs := array_append(errs, format('step %s needs at least one 2-point option and one lower-scoring option', r.position)); end if;
    if r.n_bad_next > 0 then errs := array_append(errs, format('step %s: next step must exist and come later', r.position)); end if;
    if r.position = n_steps and r.n_end <> r.n_opt then errs := array_append(errs, 'every option of the last step must end the case'::text); end if;
  end loop;
  -- every step must be reachable from step 1
  if exists (
    with recursive reach(pos) as (
      select 1::smallint
      union select k.next_position from reach r2
        join public.case_steps s on s.case_id = p_case and s.position = r2.pos
        join public.case_option_keys k on k.step_id = s.id and k.next_position is not null)
    select 1 from public.case_steps s where s.case_id = p_case and s.position not in (select pos from reach)
  ) then errs := array_append(errs, 'every step must be reachable from step 1'::text); end if;
  return errs;
end $$;

create or replace function private.case_publish_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare errs text[];
begin
  if new.status = 'published' then
    if new.approved_at is null or new.published_at is null then
      raise exception 'a published case needs approval metadata (approved_at, published_at)' using errcode = '55000';
    end if;
    if new.kind = 'demo_synthetic' and coalesce(new.source_note, '') not like 'SYNTHETIC FIXTURE%' then
      raise exception 'a demo_synthetic case must be labelled SYNTHETIC FIXTURE in source_note' using errcode = '55000';
    end if;
    if new.kind = 'clinical' then
      if new.approved_by is null then raise exception 'a clinical case needs a named approver (approved_by)' using errcode = '55000'; end if;
      if new.reviewed_by is null or new.reviewed_at is null then raise exception 'a clinical case cannot be published without an independent clinical review' using errcode = '55000'; end if;
      if new.created_by is not null and new.reviewed_by = new.created_by then raise exception 'the clinical reviewer must differ from the author' using errcode = '55000'; end if;
      if not private.user_has_role(new.reviewed_by, 'clinical_reviewer') then raise exception 'reviewed_by must hold the clinical_reviewer role' using errcode = '55000'; end if;
      if new.topic_id is null or not private.is_published_topic(new.topic_id) then raise exception 'a clinical case can only be published for a published topic' using errcode = '55000'; end if;
    end if;
    errs := private.case_structure_errors(new.id);
    if cardinality(errs) > 0 then raise exception 'invalid case structure: %', array_to_string(errs, '; ') using errcode = '55000'; end if;
  end if;
  return new;
end $$;
create trigger case_items_publish_guard before insert or update on public.case_items for each row execute function private.case_publish_guard();

create or replace function private.case_content_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare c uuid := coalesce(new.case_id, old.case_id);
begin
  if exists (select 1 from public.case_items where id = c and status = 'published') then
    raise exception 'a published case is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return coalesce(new, old);
end $$;
create trigger case_steps_frozen before insert or update or delete on public.case_steps for each row execute function private.case_content_frozen();
create trigger case_options_frozen before insert or update or delete on public.case_step_options for each row execute function private.case_content_frozen();
create trigger case_keys_frozen before insert or update or delete on public.case_option_keys for each row execute function private.case_content_frozen();

create or replace function private.case_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.title is distinct from old.title or new.vignette is distinct from old.vignette or new.kind is distinct from old.kind
       or new.domain_id is distinct from old.domain_id or new.version is distinct from old.version or new.code is distinct from old.code) then
    raise exception 'a published case is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;
create trigger case_items_frozen before update on public.case_items for each row execute function private.case_item_frozen();

-- ---------------------------------------------------------------------------------------------
-- Learner functions
-- ---------------------------------------------------------------------------------------------
create or replace function private.own_case_attempt(p_attempt uuid, p_lock boolean default false) returns public.case_attempts
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.case_attempts; u uuid := private.require_user();
begin
  if p_lock then select * into a from public.case_attempts where id = p_attempt and user_id = u for update;
  else select * into a from public.case_attempts where id = p_attempt and user_id = u; end if;
  if not found then raise exception 'attempt not found' using errcode = 'P0002'; end if;
  return a;
end $$;

create or replace function public.cs_list() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'code', c.code, 'title', c.title, 'difficulty', c.difficulty, 'synthetic', (c.kind = 'demo_synthetic'),
      'domain_slug', d.slug, 'domain_title', d.title,
      'steps', (select count(*) from public.case_steps s where s.case_id = c.id),
      'in_progress_attempt', (select a.id from public.case_attempts a where a.user_id = u and a.case_id = c.id and a.status = 'in_progress' order by a.started_at desc limit 1),
      'in_progress_position', (select a.current_position from public.case_attempts a where a.user_id = u and a.case_id = c.id and a.status = 'in_progress' order by a.started_at desc limit 1),
      'completed', (select count(*) from public.case_attempts a where a.user_id = u and a.case_id = c.id and a.status = 'completed'),
      'best_score_tenths', (select max(a.score_tenths) from public.case_attempts a where a.user_id = u and a.case_id = c.id and a.status = 'completed'),
      'last_completed_attempt', (select a.id from public.case_attempts a where a.user_id = u and a.case_id = c.id and a.status = 'completed' order by a.completed_at desc limit 1)
    ) order by d.sort, c.code)
    from public.case_items c join public.nursing_domains d on d.id = c.domain_id
    where private.case_is_visible(c.id)), '[]'::jsonb);
end $$;

create or replace function public.cs_progress() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return jsonb_build_object(
    'available', (select count(*) from public.case_items c where private.case_is_visible(c.id)),
    'completed_cases', (select count(distinct a.case_id) from public.case_attempts a where a.user_id = u and a.status = 'completed' and private.case_is_visible(a.case_id)),
    'in_progress', (select count(*) from public.case_attempts a where a.user_id = u and a.status = 'in_progress'),
    'average_tenths', (select round(avg(a.score_tenths))::int from public.case_attempts a where a.user_id = u and a.status = 'completed'),
    'synthetic_fixtures', exists (select 1 from public.case_items c where c.kind = 'demo_synthetic' and private.case_is_visible(c.id)));
end $$;

-- Starts a case, or resumes the learner's unfinished attempt of the same case.
create or replace function public.cs_start(p_case uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); aid uuid; c public.case_items;
begin
  if not private.case_is_visible(p_case) then raise exception 'case not found' using errcode = 'P0002'; end if;
  select a.id into aid from public.case_attempts a where a.user_id = u and a.case_id = p_case and a.status = 'in_progress' order by a.started_at desc limit 1;
  if aid is not null then return aid; end if;
  if (select count(*) from public.case_attempts where user_id = u and status = 'in_progress') >= 5 then
    raise exception 'finish or discard an unfinished case before starting another (limit 5)' using errcode = '54000';
  end if;
  select * into c from public.case_items where id = p_case;
  aid := gen_random_uuid();
  insert into public.case_attempts (id, user_id, case_id, case_version, seed)
  values (aid, u, p_case, c.version, substr(md5(random()::text || clock_timestamp()::text || u::text || aid::text), 1, 16));
  return aid;
end $$;

create or replace function public.cs_get(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.case_attempts; c public.case_items; done boolean; trail jsonb; cur jsonb; summary jsonb; st public.case_steps;
begin
  perform private.require_user();
  a := private.own_case_attempt(p_attempt);
  done := a.status <> 'in_progress';
  if not done and not private.case_is_visible(a.case_id) then raise exception 'case no longer available' using errcode = 'P0002'; end if;
  select * into c from public.case_items where id = a.case_id;

  -- Committed steps: everything about them is revealed (all options with points, scope and feedback).
  select coalesce(jsonb_agg(jsonb_build_object(
      'position', s.position, 'info', s.info, 'prompt', s.prompt, 'chosen_option_id', t.option_id, 'points', t.points,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text, 'points', k.points, 'scope', k.scope, 'feedback', k.feedback)
                                   order by array_position((select array_agg(o2.id order by md5(a.seed || s.id::text || o2.id::text) collate "C") from public.case_step_options o2 where o2.step_id = s.id), o.id))
                  from public.case_step_options o join public.case_option_keys k on k.option_id = o.id where o.step_id = s.id)
    ) order by s.position), '[]'::jsonb) into trail
  from public.case_attempt_steps t join public.case_steps s on s.case_id = a.case_id and s.position = t.position
  where t.attempt_id = a.id;

  -- Current step: information and shuffled option TEXT only. No points, scope, feedback or next step.
  if not done then
    select * into st from public.case_steps where case_id = a.case_id and position = a.current_position;
    cur := jsonb_build_object('position', st.position, 'info', st.info, 'prompt', st.prompt,
      'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text)
                                   order by array_position((select array_agg(o2.id order by md5(a.seed || st.id::text || o2.id::text) collate "C") from public.case_step_options o2 where o2.step_id = st.id), o.id))
                  from public.case_step_options o where o.step_id = st.id));
  end if;

  if a.status = 'completed' then
    summary := jsonb_build_object('points', a.points, 'max_points', a.max_points, 'score_tenths', a.score_tenths, 'steps', a.steps_taken,
      'duration_seconds', extract(epoch from (a.completed_at - a.started_at))::int);
  end if;

  return jsonb_build_object(
    'id', a.id, 'status', a.status, 'started_at', a.started_at, 'completed_at', a.completed_at, 'current_position', a.current_position,
    'case', jsonb_build_object('id', c.id, 'code', c.code, 'title', c.title, 'vignette', c.vignette, 'difficulty', c.difficulty, 'synthetic', (c.kind = 'demo_synthetic'),
       'steps', (select count(*) from public.case_steps where case_id = c.id),
       'domain_slug', (select slug from public.nursing_domains where id = c.domain_id), 'domain_title', (select title from public.nursing_domains where id = c.domain_id)),
    'trail', trail, 'current', cur, 'summary', summary);
end $$;

-- Commits a decision (final), scores it deterministically on the server and advances (or completes) the case.
create or replace function public.cs_choose(p_attempt uuid, p_position integer, p_option uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.case_attempts; st public.case_steps; k public.case_option_keys; n integer; pts integer;
begin
  perform private.require_user();
  a := private.own_case_attempt(p_attempt, true);
  if a.status <> 'in_progress' then raise exception 'this case attempt is no longer in progress' using errcode = '55000'; end if;
  if not private.case_is_visible(a.case_id) then raise exception 'case no longer available' using errcode = '55000'; end if;
  if p_position is distinct from a.current_position::integer then raise exception 'that step is not the current step' using errcode = '55000'; end if;
  select * into st from public.case_steps where case_id = a.case_id and position = a.current_position;
  select kk.* into k from public.case_option_keys kk where kk.option_id = p_option and kk.step_id = st.id;
  if not found then raise exception 'option does not belong to this step' using errcode = '22023'; end if;
  insert into public.case_attempt_steps (attempt_id, position, user_id, option_id, points) values (a.id, a.current_position, a.user_id, p_option, k.points);
  if k.next_position is null then
    select count(*), coalesce(sum(points), 0) into n, pts from public.case_attempt_steps where attempt_id = a.id;
    update public.case_attempts set status = 'completed', completed_at = now(), steps_taken = n, points = pts, max_points = 2 * n,
           score_tenths = private.score_tenths(pts, 2 * n), last_activity_at = now() where id = a.id;
  else
    update public.case_attempts set current_position = k.next_position, last_activity_at = now() where id = a.id;
  end if;
  return public.cs_get(a.id);
end $$;

create or replace function public.cs_discard(p_attempt uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.case_attempts;
begin
  a := private.own_case_attempt(p_attempt, true);
  if a.status = 'in_progress' then update public.case_attempts set status = 'abandoned' where id = a.id; end if;
end $$;

revoke all on public.case_items, public.case_steps, public.case_step_options, public.case_option_keys, public.case_attempts, public.case_attempt_steps from public, anon, authenticated;
grant select on public.case_items, public.case_steps, public.case_step_options, public.case_option_keys to authenticated;
create policy case_items_staff_read on public.case_items for select to authenticated using (private.is_staff());
create policy case_steps_staff_read on public.case_steps for select to authenticated using (private.is_staff());
create policy case_options_staff_read on public.case_step_options for select to authenticated using (private.is_staff());
create policy case_keys_staff_read on public.case_option_keys for select to authenticated using (private.is_staff());
grant select on public.case_attempts, public.case_attempt_steps to authenticated;
create policy case_attempts_own_read on public.case_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy case_attempt_steps_own_read on public.case_attempt_steps for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.cs_list(), public.cs_progress(), public.cs_start(uuid), public.cs_get(uuid), public.cs_choose(uuid, integer, uuid), public.cs_discard(uuid) to authenticated;
