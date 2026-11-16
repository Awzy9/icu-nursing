-- 0008_study_modes.sql
-- Phase 5 (study and revision): deterministic spaced repetition (Leitner boxes), revision launchers (due, incorrect, flagged,
-- bookmarked), revision history, and a study overview. Everything is per-user, own-row RLS, written only through definer functions,
-- and every question served still passes private.question_is_visible() (the content gate is inherited, not re-implemented).
--
-- Leitner schedule (deterministic; no randomness, no ML):
--   a wrong answer returns the question to box 1, due immediately;
--   a correct answer moves it up one box (new questions enter at box 1), capped at box 5;
--   box -> next review after: 1: 0 days, 2: 1 day, 3: 3 days, 4: 7 days, 5: 14 days.

-- Covering indexes for the two composite foreign keys flagged by the performance advisor.
create index question_answer_keys_option_idx on public.question_answer_keys (question_id, correct_option_id);
create index question_explanations_question_option_idx on public.question_explanations (question_id, option_id);

create table public.learner_review_schedule (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.question_items (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  due_at timestamptz not null default now(),
  reps integer not null default 0,
  lapses integer not null default 0,
  last_reviewed_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index learner_review_due_idx on public.learner_review_schedule (user_id, due_at);
create index learner_review_schedule_question_idx on public.learner_review_schedule (question_id);
alter table public.learner_review_schedule enable row level security;

create or replace function private.leitner_next_box(p_box integer, p_correct boolean) returns integer
language sql immutable set search_path = '' as $$ select case when p_correct then least(coalesce(p_box, 1) + 1, 5) else 1 end $$;

create or replace function private.leitner_days(p_box integer) returns integer
language sql immutable set search_path = '' as $$ select (array[0, 0, 1, 3, 7, 14])[greatest(1, least(p_box, 5)) + 1] $$;

-- Same signature as before; additionally maintains the review schedule.
create or replace function private.reveal_answer(p_user uuid, p_question uuid, p_correct boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare cur public.learner_review_schedule; nb integer;
begin
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

  select * into cur from public.learner_review_schedule where user_id = p_user and question_id = p_question for update;
  nb := private.leitner_next_box(case when cur.user_id is null then 1 else cur.box end, p_correct);
  insert into public.learner_review_schedule (user_id, question_id, box, due_at, reps, lapses)
  values (p_user, p_question, nb, now() + make_interval(days => private.leitner_days(nb)), 1, case when p_correct then 0 else 1 end)
  on conflict (user_id, question_id) do update
    set box = nb, due_at = now() + make_interval(days => private.leitner_days(nb)), last_reviewed_at = now(),
        reps = public.learner_review_schedule.reps + 1,
        lapses = public.learner_review_schedule.lapses + (case when p_correct then 0 else 1 end);
end $$;

-- Attempt creation, shared by the question bank and revision launchers (optionally restricted to a set of question ids).
create or replace function private.qb_create_attempt(
  p_user uuid, p_mode text, p_count integer, p_domains text[], p_time_limit integer, p_bookmarked_only boolean, p_ids uuid[]
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  id uuid := gen_random_uuid(); seed text; n integer; domains text[] := coalesce(p_domains, '{}');
begin
  if p_mode not in ('practice', 'exam') then raise exception 'invalid mode' using errcode = '22023'; end if;
  if p_count is null or p_count not between 1 and 100 then raise exception 'question count must be 1-100' using errcode = '22023'; end if;
  if cardinality(domains) > 20 then raise exception 'too many domain filters' using errcode = '22023'; end if;
  if p_time_limit is not null and (p_mode <> 'exam' or p_time_limit not between 60 and 14400) then
    raise exception 'a time limit of 1-240 minutes is only available in exam mode' using errcode = '22023';
  end if;
  if (select count(*) from public.quiz_attempts where user_id = p_user and status = 'in_progress') >= 5 then
    raise exception 'finish or discard an unfinished attempt before starting another (limit 5)' using errcode = '54000';
  end if;
  seed := substr(md5(random()::text || clock_timestamp()::text || p_user::text || id::text), 1, 16);

  select count(*) into n from private.qb_candidates(p_user, domains, p_bookmarked_only) c where p_ids is null or c.question_id = any (p_ids);
  if n = 0 then raise exception 'no questions are available for this selection' using errcode = 'P0002'; end if;
  n := least(n, p_count);

  insert into public.quiz_attempts (id, user_id, mode, seed, question_count, domain_filter, bookmarked_only, time_limit_seconds, expires_at)
  values (id, p_user, p_mode, seed, n, domains, p_bookmarked_only, p_time_limit,
          case when p_time_limit is not null then now() + make_interval(secs => p_time_limit) end);

  insert into public.quiz_attempt_items (attempt_id, position, user_id, question_id, question_version, option_order)
  select id, p.pos::int, p_user, p.question_id, p.version,
         (select array_agg(o.id order by md5(seed || p.question_id::text || o.id::text) collate "C")
            from public.question_options o where o.question_id = p.question_id)
  from (select c.question_id, c.version, row_number() over (order by md5(seed || c.question_id::text) collate "C") as pos
          from private.qb_candidates(p_user, domains, p_bookmarked_only) c where p_ids is null or c.question_id = any (p_ids)) p
  where p.pos <= n;
  return id;
end $$;

create or replace function public.qb_start_attempt(
  p_mode text, p_count integer, p_domains text[] default null, p_time_limit_seconds integer default null, p_bookmarked_only boolean default false
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return private.qb_create_attempt(private.require_user(), p_mode, p_count, p_domains, p_time_limit_seconds, p_bookmarked_only, null);
end $$;

-- Question ids for a revision kind. Always intersected with the content gate by qb_candidates.
create or replace function private.st_revision_ids(p_user uuid, p_kind text) returns uuid[]
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(distinct x.q), '{}') from (
    select question_id q from public.learner_review_schedule where user_id = p_user and due_at <= now() and p_kind = 'due'
    union all select question_id from public.learner_question_stats where user_id = p_user and not last_correct and p_kind = 'incorrect'
    union all select question_id from public.quiz_attempt_items where user_id = p_user and flagged and p_kind = 'flagged'
    union all select question_id from public.question_bookmarks where user_id = p_user and p_kind = 'bookmarked'
  ) x
$$;

create or replace function public.st_start_revision(p_kind text, p_count integer default 10, p_domains text[] default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if p_kind not in ('due', 'incorrect', 'flagged', 'bookmarked') then raise exception 'invalid revision kind' using errcode = '22023'; end if;
  return private.qb_create_attempt(u, 'practice', p_count, p_domains, null, false, private.st_revision_ids(u, p_kind));
end $$;

create or replace function public.st_overview() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); res jsonb;
begin
  select jsonb_build_object(
    'due', (select count(*) from public.learner_review_schedule s where s.user_id = u and s.due_at <= now() and private.question_is_visible(s.question_id)),
    'incorrect', (select count(*) from public.learner_question_stats s where s.user_id = u and not s.last_correct and private.question_is_visible(s.question_id)),
    'flagged', (select count(distinct i.question_id) from public.quiz_attempt_items i where i.user_id = u and i.flagged and private.question_is_visible(i.question_id)),
    'bookmarked', (select count(*) from public.question_bookmarks b where b.user_id = u and private.question_is_visible(b.question_id)),
    'reviewed_today', (select count(*) from public.learner_review_schedule s where s.user_id = u and s.last_reviewed_at >= date_trunc('day', now()) and private.question_is_visible(s.question_id)),
    'next_due_at', (select min(s.due_at) from public.learner_review_schedule s where s.user_id = u and s.due_at > now() and private.question_is_visible(s.question_id)),
    'boxes', (select jsonb_agg(c order by b) from (select b, (select count(*) from public.learner_review_schedule s where s.user_id = u and s.box = b and private.question_is_visible(s.question_id)) c from generate_series(1, 5) b) x),
    'domains', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', d.slug, 'title', d.title,
        'available', (select count(*) from public.question_items q where q.domain_id = d.id and private.question_is_visible(q.id)),
        'answered', (select count(*) from public.learner_question_stats s join public.question_items q on q.id = s.question_id where s.user_id = u and q.domain_id = d.id and private.question_is_visible(q.id)),
        'correct', (select count(*) from public.learner_question_stats s join public.question_items q on q.id = s.question_id where s.user_id = u and q.domain_id = d.id and s.last_correct and private.question_is_visible(q.id)),
        'due', (select count(*) from public.learner_review_schedule s join public.question_items q on q.id = s.question_id where s.user_id = u and q.domain_id = d.id and s.due_at <= now() and private.question_is_visible(q.id))
      ) order by d.sort) from public.nursing_domains d), '[]'::jsonb),
    'synthetic_fixtures', exists (select 1 from public.question_items q where q.kind = 'demo_synthetic' and private.question_is_visible(q.id))
  ) into res;
  return res;
end $$;

-- Revision history: the learner's own revealed answers (correctness is only ever stored once revealed).
create or replace function public.st_history(p_limit integer default 30) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'attempt_id', r.attempt_id, 'mode', r.mode, 'question_id', r.question_id, 'domain_slug', r.slug, 'domain_title', r.title,
      'stem', r.stem, 'is_correct', r.is_correct, 'answered_at', r.revealed_at, 'synthetic', r.synthetic) order by r.revealed_at desc)
    from (
      select a.attempt_id, t.mode, i.question_id, d.slug, d.title, q.stem, a.is_correct, a.revealed_at, (q.kind = 'demo_synthetic') as synthetic
      from public.quiz_answers a
      join public.quiz_attempts t on t.id = a.attempt_id
      join public.quiz_attempt_items i on i.attempt_id = a.attempt_id and i.position = a.position
      join public.question_items q on q.id = i.question_id
      join public.nursing_domains d on d.id = q.domain_id
      where a.user_id = u and a.revealed_at is not null and private.question_is_visible(i.question_id)
      order by a.revealed_at desc limit greatest(1, least(coalesce(p_limit, 30), 100))
    ) r), '[]'::jsonb);
end $$;

revoke all on public.learner_review_schedule from public, anon, authenticated;
grant select on public.learner_review_schedule to authenticated;
create policy review_schedule_own_read on public.learner_review_schedule for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.st_start_revision(text, integer, text[]), public.st_overview(), public.st_history(integer) to authenticated;
