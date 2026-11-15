-- 0010_attempt_rate_limits.sql
-- Security review finding (Phase 6): a signed-in learner could start and finish attempts in a loop and grow quiz_attempts /
-- quiz_attempt_items / case_attempts without bound (the existing cap limits only UNFINISHED attempts). Add per-user hourly ceilings
-- enforced in the database, so they hold for every client (UI, scripts, raw PostgREST).
--   question-bank attempts (practice, exam and revision sets): 100 per rolling hour
--   cases: 60 per rolling hour
-- Legitimate use is far below these numbers. The functions are replaced with identical logic plus one check each.

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
  if (select count(*) from public.quiz_attempts where user_id = p_user and started_at > now() - interval '1 hour') >= 100 then
    raise exception 'too many attempts started in the last hour; please wait before starting more' using errcode = '54000';
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
  if (select count(*) from public.case_attempts where user_id = u and started_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many cases started in the last hour; please wait before starting more' using errcode = '54000';
  end if;
  select * into c from public.case_items where id = p_case;
  aid := gen_random_uuid();
  insert into public.case_attempts (id, user_id, case_id, case_version, seed)
  values (aid, u, p_case, c.version, substr(md5(random()::text || clock_timestamp()::text || u::text || aid::text), 1, 16));
  return aid;
end $$;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.cs_start(uuid) to authenticated;
