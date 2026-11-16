-- 0006_question_bank.sql
-- Phase 4: interactive question bank (practice and exam modes).
--
-- SECURITY MODEL (read this before changing anything)
--   1. Question content, answer keys and explanations are NOT readable by learners through the table API. Learners reach
--      questions only through the SECURITY DEFINER qb_* functions below, which apply the content gate.
--   2. The answer key and explanations live in separate tables from the stem and options. A function that returns an
--      in-progress question never touches them; they are returned only for an answer already revealed (practice mode, after
--      the learner submitted that answer) or for a completed attempt.
--   3. Correctness (quiz_answers.is_correct) is NULL until it is revealed, so even the learner's own rows leak nothing early.
--   4. Learners have no INSERT/UPDATE/DELETE on any question-bank table. Scoring is deterministic and server-side.
--   5. CONTENT GATE (private.question_is_visible + private.question_publish_guard):
--        * demo_synthetic questions (source_note must start with 'SYNTHETIC FIXTURE') are learner-visible only while
--          app_settings.question_fixtures_visible is true (default false: production never shows them);
--        * clinical questions are learner-visible only when published AND independently clinically reviewed AND their topic is
--          published. No function in this phase sets those fields, so the existing clinical draft MCQs cannot become visible by
--          accident, import, or direct SQL: the guard trigger rejects the write.

alter table public.app_settings add column question_fixtures_visible boolean not null default false;

-- ---------------------------------------------------------------------------------------------
-- Content tables
-- ---------------------------------------------------------------------------------------------
create table public.question_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$'),
  kind public.content_kind not null,
  status public.content_status not null default 'draft',
  origin public.content_origin not null default 'human',
  domain_id uuid not null references public.nursing_domains (id),
  topic_id uuid references public.topics (id) on delete set null,
  difficulty smallint not null default 2 check (difficulty between 1 and 3),
  stem jsonb not null check (jsonb_typeof(stem) = 'object' and stem ? 'en' and char_length(stem ->> 'en') between 10 and 2000),
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
create index question_items_domain_idx on public.question_items (domain_id);
create index question_items_topic_idx on public.question_items (topic_id);
create index question_items_gate_idx on public.question_items (status, kind) where retired_at is null;
create index question_items_created_by_idx on public.question_items (created_by);
create index question_items_reviewed_by_idx on public.question_items (reviewed_by);
create index question_items_approved_by_idx on public.question_items (approved_by);
alter table public.question_items enable row level security;

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_items (id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  text jsonb not null check (jsonb_typeof(text) = 'object' and text ? 'en' and char_length(text ->> 'en') between 1 and 600),
  unique (question_id, position),
  unique (question_id, id)
);
alter table public.question_options enable row level security;

-- Answer key and rationale: never selectable by learners.
create table public.question_answer_keys (
  question_id uuid primary key references public.question_items (id) on delete cascade,
  correct_option_id uuid not null,
  rationale jsonb not null check (jsonb_typeof(rationale) = 'object' and rationale ? 'en'),
  foreign key (question_id, correct_option_id) references public.question_options (question_id, id) on delete restrict
);
alter table public.question_answer_keys enable row level security;

-- One explanation per option: why the correct option is right, or why an incorrect one is wrong.
create table public.question_explanations (
  option_id uuid primary key references public.question_options (id) on delete cascade,
  question_id uuid not null references public.question_items (id) on delete cascade,
  explanation jsonb not null check (jsonb_typeof(explanation) = 'object' and explanation ? 'en' and char_length(explanation ->> 'en') >= 5),
  foreign key (question_id, option_id) references public.question_options (question_id, id) on delete cascade
);
create index question_explanations_question_idx on public.question_explanations (question_id);
alter table public.question_explanations enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Learner state
-- ---------------------------------------------------------------------------------------------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('practice', 'exam')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  seed text not null check (char_length(seed) between 8 and 64),
  question_count integer not null check (question_count between 1 and 100),
  domain_filter text[] not null default '{}',
  bookmarked_only boolean not null default false,
  time_limit_seconds integer check (time_limit_seconds between 60 and 14400),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  last_activity_at timestamptz not null default now(),
  last_position integer not null default 1 check (last_position >= 1),
  completed_at timestamptz,
  timed_out boolean not null default false,
  scored_total integer,
  correct_count integer,
  score_tenths integer check (score_tenths between 0 and 1000),
  check (mode = 'exam' or time_limit_seconds is null),
  check ((time_limit_seconds is null) = (expires_at is null)),
  check ((status = 'completed') = (completed_at is not null))
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, started_at desc);
alter table public.quiz_attempts enable row level security;

create table public.quiz_attempt_items (
  attempt_id uuid not null references public.quiz_attempts (id) on delete cascade,
  position integer not null check (position >= 1),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.question_items (id),
  question_version integer not null,
  option_order uuid[] not null check (cardinality(option_order) = 4),
  flagged boolean not null default false,
  voided boolean not null default false,
  primary key (attempt_id, position)
);
create index quiz_attempt_items_question_idx on public.quiz_attempt_items (question_id);
create index quiz_attempt_items_user_idx on public.quiz_attempt_items (user_id);
alter table public.quiz_attempt_items enable row level security;

create table public.quiz_answers (
  attempt_id uuid not null,
  position integer not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  selected_option_id uuid not null references public.question_options (id),
  is_correct boolean,            -- NULL until revealed (practice: at answer time; exam: at submission)
  answered_at timestamptz not null default now(),
  changed_count integer not null default 0,
  revealed_at timestamptz,
  primary key (attempt_id, position),
  foreign key (attempt_id, position) references public.quiz_attempt_items (attempt_id, position) on delete cascade
);
create index quiz_answers_user_idx on public.quiz_answers (user_id);
create index quiz_answers_option_idx on public.quiz_answers (selected_option_id);
alter table public.quiz_answers enable row level security;

create table public.learner_question_stats (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.question_items (id) on delete cascade,
  times_answered integer not null default 0,
  times_correct integer not null default 0,
  last_correct boolean not null,
  last_answered_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index learner_question_stats_question_idx on public.learner_question_stats (question_id);
alter table public.learner_question_stats enable row level security;

-- Aggregate item statistics (all learners). Staff only; never exposed to learners.
create table public.question_stats (
  question_id uuid primary key references public.question_items (id) on delete cascade,
  times_answered integer not null default 0,
  times_correct integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.question_stats enable row level security;

create table public.question_bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  question_id uuid not null references public.question_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index question_bookmarks_question_idx on public.question_bookmarks (question_id);
alter table public.question_bookmarks enable row level security;

create trigger question_items_updated before update on public.question_items for each row execute function private.set_updated_at();
create trigger question_items_audit after insert or update or delete on public.question_items for each row execute function private.audit_row();

-- ---------------------------------------------------------------------------------------------
-- Content gate
-- ---------------------------------------------------------------------------------------------
-- The single definition of "a learner may see this question".
create or replace function private.question_is_visible(p_question uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.question_items q
    where q.id = p_question
      and q.status = 'published' and q.retired_at is null
      and q.approved_at is not null and q.published_at is not null
      and (
        (q.kind = 'demo_synthetic' and q.source_note like 'SYNTHETIC FIXTURE%' and (select question_fixtures_visible from public.app_settings))
        or (q.kind = 'clinical'
            and q.approved_by is not null
            and q.reviewed_by is not null and q.reviewed_at is not null
            and q.topic_id is not null and private.is_published_topic(q.topic_id))
      )
  )
$$;

-- Defence in depth: whoever writes (API, owner, import script), a question cannot be published without its gate evidence,
-- and a published question's content is frozen (edit = retire + new version).
create or replace function private.question_publish_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare
  n_opt integer; n_exp integer; k public.question_answer_keys;
begin
  if new.status = 'published' then
    if new.approved_at is null or new.published_at is null then
      raise exception 'a published question needs approval metadata (approved_at, published_at)' using errcode = '55000';
    end if;
    if new.kind = 'demo_synthetic' and coalesce(new.source_note, '') not like 'SYNTHETIC FIXTURE%' then
      raise exception 'a demo_synthetic question must be labelled SYNTHETIC FIXTURE in source_note' using errcode = '55000';
    end if;
    if new.kind = 'clinical' then
      if new.approved_by is null then
        raise exception 'a clinical question needs a named approver (approved_by)' using errcode = '55000';
      end if;
      if new.reviewed_by is null or new.reviewed_at is null then
        raise exception 'a clinical question cannot be published without an independent clinical review' using errcode = '55000';
      end if;
      if new.created_by is not null and new.reviewed_by = new.created_by then
        raise exception 'the clinical reviewer must differ from the author' using errcode = '55000';
      end if;
      if not private.user_has_role(new.reviewed_by, 'clinical_reviewer') then
        raise exception 'reviewed_by must hold the clinical_reviewer role' using errcode = '55000';
      end if;
      if new.topic_id is null or not private.is_published_topic(new.topic_id) then
        raise exception 'a clinical question can only be published for a published topic' using errcode = '55000';
      end if;
    end if;
    select count(*) into n_opt from public.question_options where question_id = new.id;
    select * into k from public.question_answer_keys where question_id = new.id;
    select count(*) into n_exp from public.question_explanations where question_id = new.id;
    if n_opt <> 4 or k.question_id is null or n_exp <> 4 then
      raise exception 'a published question needs exactly 4 options, an answer key and 4 explanations' using errcode = '55000';
    end if;
  end if;
  return new;
end $$;
create trigger question_items_publish_guard before insert or update on public.question_items for each row execute function private.question_publish_guard();

-- Published content is immutable.
create or replace function private.question_content_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare q uuid := coalesce(new.question_id, old.question_id);
begin
  if exists (select 1 from public.question_items where id = q and status = 'published') then
    raise exception 'a published question is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return coalesce(new, old);
end $$;
create trigger question_options_frozen before insert or update or delete on public.question_options for each row execute function private.question_content_frozen();
create trigger question_keys_frozen before insert or update or delete on public.question_answer_keys for each row execute function private.question_content_frozen();
create trigger question_expl_frozen before insert or update or delete on public.question_explanations for each row execute function private.question_content_frozen();

create or replace function private.question_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (
       new.stem is distinct from old.stem or new.kind is distinct from old.kind or new.domain_id is distinct from old.domain_id
       or new.version is distinct from old.version or new.code is distinct from old.code) then
    raise exception 'a published question is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;
create trigger question_items_frozen before update on public.question_items for each row execute function private.question_item_frozen();

-- ---------------------------------------------------------------------------------------------
-- Deterministic helpers (same algorithm is implemented in src/lib/question-bank/shuffle.ts and cross-tested)
-- ---------------------------------------------------------------------------------------------
-- Percentage in tenths, rounded half up using integer arithmetic only.
create or replace function private.score_tenths(p_correct integer, p_total integer) returns integer
language sql immutable set search_path = '' as $$
  select case when p_total <= 0 then 0 else ((2000 * p_correct + p_total) / (2 * p_total))::integer end
$$;

create or replace function private.reveal_answer(p_user uuid, p_question uuid, p_correct boolean) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.learner_question_stats (user_id, question_id, times_answered, times_correct, last_correct)
  values (p_user, p_question, 1, case when p_correct then 1 else 0 end, p_correct)
  on conflict (user_id, question_id) do update
    set times_answered = public.learner_question_stats.times_answered + 1,
        times_correct = public.learner_question_stats.times_correct + (case when p_correct then 1 else 0 end),
        last_correct = p_correct, last_answered_at = now();
  insert into public.question_stats (question_id, times_answered, times_correct)
  values (p_question, 1, case when p_correct then 1 else 0 end)
  on conflict (question_id) do update
    set times_answered = public.question_stats.times_answered + 1,
        times_correct = public.question_stats.times_correct + (case when p_correct then 1 else 0 end), updated_at = now();
$$;

-- Score and close an attempt. Idempotent. Items whose question was withdrawn before the learner answered are voided.
create or replace function private.finalize_attempt(p_attempt uuid, p_timed_out boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.quiz_attempts; r record; ok boolean; total integer; correct integer;
begin
  select * into a from public.quiz_attempts where id = p_attempt for update;
  if not found or a.status <> 'in_progress' then return; end if;
  for r in
    select i.position, i.question_id, ans.selected_option_id, ans.revealed_at, k.correct_option_id
    from public.quiz_attempt_items i
    left join public.quiz_answers ans on ans.attempt_id = i.attempt_id and ans.position = i.position
    left join public.question_answer_keys k on k.question_id = i.question_id
    where i.attempt_id = p_attempt
  loop
    if r.selected_option_id is null then
      if not private.question_is_visible(r.question_id) then
        update public.quiz_attempt_items set voided = true where attempt_id = p_attempt and position = r.position;
      end if;
    elsif r.revealed_at is null then
      ok := (r.selected_option_id = r.correct_option_id);
      update public.quiz_answers set is_correct = ok, revealed_at = now() where attempt_id = p_attempt and position = r.position;
      perform private.reveal_answer(a.user_id, r.question_id, ok);
    end if;
  end loop;
  select count(*) filter (where not i.voided),
         count(*) filter (where not i.voided and ans.is_correct)
    into total, correct
  from public.quiz_attempt_items i
  left join public.quiz_answers ans on ans.attempt_id = i.attempt_id and ans.position = i.position
  where i.attempt_id = p_attempt;
  update public.quiz_attempts
     set status = 'completed', completed_at = now(), timed_out = p_timed_out,
         scored_total = total, correct_count = correct, score_tenths = private.score_tenths(correct, total),
         last_activity_at = now()
   where id = p_attempt;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Learner RPC surface
-- ---------------------------------------------------------------------------------------------
create or replace function private.require_user() returns uuid
language plpgsql stable set search_path = '' as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  return u;
end $$;

-- Owner-checked attempt lookup (not found and not-yours are indistinguishable).
create or replace function private.own_attempt(p_attempt uuid, p_lock boolean default false) returns public.quiz_attempts
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts; u uuid := private.require_user();
begin
  if p_lock then select * into a from public.quiz_attempts where id = p_attempt and user_id = u for update;
  else select * into a from public.quiz_attempts where id = p_attempt and user_id = u; end if;
  if not found then raise exception 'attempt not found' using errcode = 'P0002'; end if;
  return a;
end $$;

-- Close an in-progress attempt whose time ran out.
create or replace function private.expire_if_due(p_attempt uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts;
begin
  select * into a from public.quiz_attempts where id = p_attempt;
  if found and a.status = 'in_progress' and a.expires_at is not null and a.expires_at <= now() then
    perform private.finalize_attempt(p_attempt, true);
  end if;
end $$;

-- Learner progress overview plus the filter options (domains with their number of available questions).
create or replace function public.qb_progress() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); res jsonb;
begin
  select jsonb_build_object(
    'domains', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', d.slug, 'title', d.title,
        'available', (select count(*) from public.question_items q where q.domain_id = d.id and private.question_is_visible(q.id)),
        'answered', (select count(*) from public.learner_question_stats s join public.question_items q on q.id = s.question_id
                     where s.user_id = u and q.domain_id = d.id and private.question_is_visible(q.id)),
        'correct', (select count(*) from public.learner_question_stats s join public.question_items q on q.id = s.question_id
                    where s.user_id = u and q.domain_id = d.id and s.last_correct and private.question_is_visible(q.id))
      ) order by d.sort) from public.nursing_domains d), '[]'::jsonb),
    'completed_attempts', (select count(*) from public.quiz_attempts where user_id = u and status = 'completed'),
    'average_tenths', (select round(avg(score_tenths))::int from public.quiz_attempts where user_id = u and status = 'completed'),
    'bookmarked', (select count(*) from public.question_bookmarks b where b.user_id = u and private.question_is_visible(b.question_id)),
    'synthetic_fixtures', exists (select 1 from public.question_items q where q.kind = 'demo_synthetic' and private.question_is_visible(q.id))
  ) into res;
  return res;
end $$;

-- Questions a learner may be served for a selection. Every path that picks questions goes through the content gate here.
create or replace function private.qb_candidates(p_user uuid, p_domains text[], p_bookmarked_only boolean)
returns table (question_id uuid, version integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select q.id, q.version
  from public.question_items q
  join public.nursing_domains d on d.id = q.domain_id
  where private.question_is_visible(q.id)
    and (cardinality(p_domains) = 0 or d.slug = any (p_domains))
    and (not p_bookmarked_only or exists (select 1 from public.question_bookmarks b where b.user_id = p_user and b.question_id = q.id))
$$;

create or replace function public.qb_start_attempt(
  p_mode text, p_count integer, p_domains text[] default null, p_time_limit_seconds integer default null, p_bookmarked_only boolean default false
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  u uuid := private.require_user(); id uuid := gen_random_uuid(); seed text; n integer; domains text[] := coalesce(p_domains, '{}');
begin
  if p_mode not in ('practice', 'exam') then raise exception 'invalid mode' using errcode = '22023'; end if;
  if p_count is null or p_count not between 1 and 100 then raise exception 'question count must be 1-100' using errcode = '22023'; end if;
  if cardinality(domains) > 20 then raise exception 'too many domain filters' using errcode = '22023'; end if;
  if p_time_limit_seconds is not null and (p_mode <> 'exam' or p_time_limit_seconds not between 60 and 14400) then
    raise exception 'a time limit of 1-240 minutes is only available in exam mode' using errcode = '22023';
  end if;
  if (select count(*) from public.quiz_attempts where user_id = u and status = 'in_progress') >= 5 then
    raise exception 'finish or discard an unfinished attempt before starting another (limit 5)' using errcode = '54000';
  end if;
  seed := substr(md5(random()::text || clock_timestamp()::text || u::text || id::text), 1, 16);

  select count(*) into n from private.qb_candidates(u, domains, p_bookmarked_only);
  if n = 0 then raise exception 'no questions are available for this selection' using errcode = 'P0002'; end if;
  n := least(n, p_count);

  insert into public.quiz_attempts (id, user_id, mode, seed, question_count, domain_filter, bookmarked_only, time_limit_seconds, expires_at)
  values (id, u, p_mode, seed, n, domains, p_bookmarked_only, p_time_limit_seconds,
          case when p_time_limit_seconds is not null then now() + make_interval(secs => p_time_limit_seconds) end);

  insert into public.quiz_attempt_items (attempt_id, position, user_id, question_id, question_version, option_order)
  select id, p.pos::int, u, p.question_id, p.version,
         (select array_agg(o.id order by md5(seed || p.question_id::text || o.id::text) collate "C")
            from public.question_options o where o.question_id = p.question_id)
  from (select c.question_id, c.version, row_number() over (order by md5(seed || c.question_id::text) collate "C") as pos
          from private.qb_candidates(u, domains, p_bookmarked_only) c) p
  where p.pos <= n;
  return id;
end $$;

-- Build the learner-facing view of an attempt. Answer keys appear only where already revealed or the attempt is complete.
create or replace function public.qb_get_attempt(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.quiz_attempts; items jsonb; summary jsonb; done boolean;
begin
  perform private.require_user();
  perform private.expire_if_due(p_attempt);
  a := private.own_attempt(p_attempt);
  done := a.status <> 'in_progress';

  select coalesce(jsonb_agg(item order by pos), '[]'::jsonb) into items from (
    select i.position as pos, jsonb_build_object(
      'position', i.position,
      'question_id', i.question_id,
      'domain_slug', d.slug,
      'domain_title', d.title,
      'difficulty', q.difficulty,
      'synthetic', (q.kind = 'demo_synthetic'),
      'flagged', i.flagged,
      'bookmarked', exists (select 1 from public.question_bookmarks b where b.user_id = a.user_id and b.question_id = i.question_id),
      'voided', i.voided,
      'unavailable', (not done and not private.question_is_visible(i.question_id) and ans.selected_option_id is null),
      'selected_option_id', ans.selected_option_id,
      'revealed', (done or ans.revealed_at is not null),
      'stem', case when not done and not private.question_is_visible(i.question_id) and ans.selected_option_id is null then null else q.stem end,
      'options', case when not done and not private.question_is_visible(i.question_id) and ans.selected_option_id is null then '[]'::jsonb else
        (select jsonb_agg(jsonb_build_object('id', o.id, 'text', o.text) order by array_position(i.option_order, o.id))
           from public.question_options o where o.question_id = i.question_id) end,
      'feedback', case when done or ans.revealed_at is not null then jsonb_build_object(
          'correct_option_id', k.correct_option_id,
          'is_correct', (ans.selected_option_id is not null and ans.selected_option_id = k.correct_option_id),
          'rationale', k.rationale,
          'explanations', (select jsonb_object_agg(e.option_id::text, e.explanation) from public.question_explanations e where e.question_id = i.question_id)
        ) end
    ) as item
    from public.quiz_attempt_items i
    join public.question_items q on q.id = i.question_id
    join public.nursing_domains d on d.id = q.domain_id
    left join public.quiz_answers ans on ans.attempt_id = i.attempt_id and ans.position = i.position
    left join public.question_answer_keys k on k.question_id = i.question_id
    where i.attempt_id = a.id
  ) s;

  if a.status = 'completed' then
    summary := jsonb_build_object(
      'correct', a.correct_count, 'total', a.scored_total, 'score_tenths', a.score_tenths, 'timed_out', a.timed_out,
      'answered', (select count(*) from public.quiz_answers where attempt_id = a.id),
      'flagged', (select count(*) from public.quiz_attempt_items where attempt_id = a.id and flagged),
      'duration_seconds', extract(epoch from (a.completed_at - a.started_at))::int,
      'by_domain', coalesce((select jsonb_agg(jsonb_build_object('slug', d.slug, 'title', d.title, 'correct', c.correct, 'total', c.total) order by d.sort)
          from (select q.domain_id, count(*) filter (where not i.voided) as total, count(*) filter (where ans.is_correct) as correct
                from public.quiz_attempt_items i join public.question_items q on q.id = i.question_id
                left join public.quiz_answers ans on ans.attempt_id = i.attempt_id and ans.position = i.position
                where i.attempt_id = a.id group by q.domain_id) c join public.nursing_domains d on d.id = c.domain_id), '[]'::jsonb));
  end if;

  return jsonb_build_object(
    'id', a.id, 'mode', a.mode, 'status', a.status, 'question_count', a.question_count,
    'started_at', a.started_at, 'expires_at', a.expires_at, 'time_limit_seconds', a.time_limit_seconds,
    'server_now', now(), 'last_position', a.last_position, 'completed_at', a.completed_at,
    'domain_filter', to_jsonb(a.domain_filter), 'items', items, 'summary', summary);
end $$;

-- Submit (practice) or record (exam) an answer. p_option NULL clears an exam answer.
create or replace function public.qb_submit_answer(p_attempt uuid, p_position integer, p_option uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.quiz_attempts; it public.quiz_attempt_items; prev public.quiz_answers; k public.question_answer_keys; ok boolean;
begin
  perform private.require_user();
  perform private.expire_if_due(p_attempt);
  a := private.own_attempt(p_attempt, true);
  if a.status <> 'in_progress' then raise exception 'this attempt is no longer in progress' using errcode = '55000'; end if;
  select * into it from public.quiz_attempt_items where attempt_id = a.id and position = p_position;
  if not found then raise exception 'no such question in this attempt' using errcode = 'P0002'; end if;
  if not private.question_is_visible(it.question_id) then raise exception 'this question is no longer available' using errcode = '55000'; end if;
  select * into prev from public.quiz_answers where attempt_id = a.id and position = p_position;

  if p_option is null then
    if a.mode <> 'exam' then raise exception 'answers cannot be cleared in practice mode' using errcode = '55000'; end if;
    delete from public.quiz_answers where attempt_id = a.id and position = p_position;
    update public.quiz_attempts set last_activity_at = now(), last_position = p_position where id = a.id;
    return jsonb_build_object('ok', true, 'cleared', true);
  end if;
  if not (p_option = any (it.option_order)) then raise exception 'option does not belong to this question' using errcode = '22023'; end if;

  if a.mode = 'practice' then
    if prev.attempt_id is not null then raise exception 'this question has already been answered' using errcode = '55000'; end if;
    select * into k from public.question_answer_keys where question_id = it.question_id;
    ok := (p_option = k.correct_option_id);
    insert into public.quiz_answers (attempt_id, position, user_id, selected_option_id, is_correct, revealed_at)
    values (a.id, p_position, a.user_id, p_option, ok, now());
    perform private.reveal_answer(a.user_id, it.question_id, ok);
    update public.quiz_attempts set last_activity_at = now(), last_position = p_position where id = a.id;
    return jsonb_build_object('ok', true, 'feedback', jsonb_build_object(
      'correct_option_id', k.correct_option_id, 'is_correct', ok, 'rationale', k.rationale,
      'explanations', (select jsonb_object_agg(e.option_id::text, e.explanation) from public.question_explanations e where e.question_id = it.question_id)));
  end if;

  insert into public.quiz_answers (attempt_id, position, user_id, selected_option_id)
  values (a.id, p_position, a.user_id, p_option)
  on conflict (attempt_id, position) do update
    set selected_option_id = excluded.selected_option_id, answered_at = now(),
        changed_count = public.quiz_answers.changed_count + (case when public.quiz_answers.selected_option_id <> excluded.selected_option_id then 1 else 0 end);
  update public.quiz_attempts set last_activity_at = now(), last_position = p_position where id = a.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.qb_set_flag(p_attempt uuid, p_position integer, p_flagged boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts;
begin
  perform private.expire_if_due(p_attempt);
  a := private.own_attempt(p_attempt, true);
  if a.status <> 'in_progress' then raise exception 'this attempt is no longer in progress' using errcode = '55000'; end if;
  update public.quiz_attempt_items set flagged = coalesce(p_flagged, false) where attempt_id = a.id and position = p_position;
  if not found then raise exception 'no such question in this attempt' using errcode = 'P0002'; end if;
  update public.quiz_attempts set last_activity_at = now() where id = a.id;
end $$;

create or replace function public.qb_set_position(p_attempt uuid, p_position integer) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts;
begin
  perform private.expire_if_due(p_attempt);
  a := private.own_attempt(p_attempt, true);
  if a.status <> 'in_progress' then return; end if;
  if p_position is null or p_position not between 1 and a.question_count then raise exception 'invalid position' using errcode = '22023'; end if;
  update public.quiz_attempts set last_position = p_position, last_activity_at = now() where id = a.id;
end $$;

create or replace function public.qb_submit_attempt(p_attempt uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts;
begin
  perform private.require_user();
  a := private.own_attempt(p_attempt, true);
  if a.status = 'abandoned' then raise exception 'this attempt was discarded' using errcode = '55000'; end if;
  perform private.finalize_attempt(a.id, a.expires_at is not null and a.expires_at <= now());
  return public.qb_get_attempt(a.id);
end $$;

create or replace function public.qb_discard_attempt(p_attempt uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.quiz_attempts;
begin
  a := private.own_attempt(p_attempt, true);
  if a.status = 'in_progress' then update public.quiz_attempts set status = 'abandoned' where id = a.id; end if;
end $$;

create or replace function public.qb_list_attempts(p_limit integer default 20) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'mode', a.mode, 'status', a.status, 'question_count', a.question_count,
      'answered', (select count(*) from public.quiz_answers x where x.attempt_id = a.id),
      'correct', a.correct_count, 'total', a.scored_total, 'score_tenths', a.score_tenths, 'timed_out', a.timed_out,
      'started_at', a.started_at, 'completed_at', a.completed_at, 'expires_at', a.expires_at, 'time_limit_seconds', a.time_limit_seconds)
      order by a.started_at desc)
    from (select * from public.quiz_attempts where user_id = u and status <> 'abandoned' order by started_at desc limit greatest(1, least(coalesce(p_limit, 20), 50))) a), '[]'::jsonb);
end $$;

create or replace function public.qb_set_bookmark(p_question uuid, p_bookmarked boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if coalesce(p_bookmarked, false) then
    if not private.question_is_visible(p_question) then raise exception 'question not found' using errcode = 'P0002'; end if;
    insert into public.question_bookmarks (user_id, question_id) values (u, p_question) on conflict do nothing;
  else
    delete from public.question_bookmarks where user_id = u and question_id = p_question;
  end if;
end $$;

-- Grants and policies -------------------------------------------------------------------------
revoke all on public.question_items, public.question_options, public.question_answer_keys, public.question_explanations,
  public.quiz_attempts, public.quiz_attempt_items, public.quiz_answers, public.learner_question_stats, public.question_stats,
  public.question_bookmarks from public, anon, authenticated;

-- Staff (MFA enforced by has_staff_role) may read the working copy of question content; nobody can write through the API.
grant select on public.question_items, public.question_options, public.question_answer_keys, public.question_explanations, public.question_stats to authenticated;
create policy question_items_staff_read on public.question_items for select to authenticated using (private.is_staff());
create policy question_options_staff_read on public.question_options for select to authenticated using (private.is_staff());
create policy question_keys_staff_read on public.question_answer_keys for select to authenticated using (private.is_staff());
create policy question_expl_staff_read on public.question_explanations for select to authenticated using (private.is_staff());
create policy question_stats_staff_read on public.question_stats for select to authenticated using (private.is_staff());

-- Learners may read ONLY their own state (correctness is NULL until revealed, and they cannot read question content).
grant select on public.quiz_attempts, public.quiz_attempt_items, public.quiz_answers, public.learner_question_stats, public.question_bookmarks to authenticated;
create policy quiz_attempts_own_read on public.quiz_attempts for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_items_own_read on public.quiz_attempt_items for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_answers_own_read on public.quiz_answers for select to authenticated using (user_id = (select auth.uid()));
create policy lqs_own_read on public.learner_question_stats for select to authenticated using (user_id = (select auth.uid()));
create policy question_bookmarks_own_read on public.question_bookmarks for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function
  public.qb_progress(), public.qb_start_attempt(text, integer, text[], integer, boolean), public.qb_get_attempt(uuid),
  public.qb_submit_answer(uuid, integer, uuid), public.qb_set_flag(uuid, integer, boolean), public.qb_set_position(uuid, integer),
  public.qb_submit_attempt(uuid), public.qb_discard_attempt(uuid), public.qb_list_attempts(integer), public.qb_set_bookmark(uuid, boolean)
  to authenticated;
