-- Phase 5: usage log and server-enforced caps for the mock-mode learner AI tutor.
--
-- What this is: an append-only record of each tutor query a signed-in learner made (the sanitised query text, the
-- locale, whether it was refused and why, and how many citations the retrieval step found), plus two DB-enforced
-- caps (a burst cap per hour, a daily cap) so quota limits hold for every client, not just the UI.
-- What this is NOT, by construction:
--   * it never stores the tutor's answer text or the citation targets, only the learner's own query and a count -
--     the answer itself is already just a template over already-published titles/summaries (see src/lib/tutor),
--     so there is nothing clinical to leak by logging it, but this keeps the table itself privacy-minimal;
--   * no table access for anyone - the only access path is two SECURITY DEFINER functions, same shape as the
--     draft workspace (migration 0016) and the AI evidence review log (migration 0019);
--   * a learner can read and insert only their own rows (enforced inside the functions via auth.uid(), not RLS
--     policies, because there is no direct table grant at all);
--   * entries are append-only (an immutable trigger) so a learner's own usage history cannot be edited after the
--     fact to dodge the cap;
--   * this migration embeds no AI call of any kind - tutor_record_query only logs a call the application already
--     decided to make (or refuse) in mock mode; activating a real, paid AI service is a separate, explicitly
--     authorized decision and is not implemented here.
begin;

create table public.tutor_queries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  locale text not null check (locale in ('en', 'ar')),
  query text not null check (char_length(query) between 0 and 500),
  refused boolean not null,
  refusal_reason text check (refusal_reason is null or char_length(refusal_reason) <= 200),
  hit_count integer not null check (hit_count between 0 and 50),
  created_at timestamptz not null default now()
);
create index tutor_queries_user_idx on public.tutor_queries (user_id, created_at desc);
alter table public.tutor_queries enable row level security;

create or replace function private.tutor_queries_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'tutor usage entries are append-only' using errcode = '42501';
end $$;
create trigger tutor_queries_no_update before update on public.tutor_queries for each row execute function private.tutor_queries_immutable();
create trigger tutor_queries_no_delete before delete on public.tutor_queries for each row execute function private.tutor_queries_immutable();
create trigger tutor_queries_no_truncate before truncate on public.tutor_queries for each statement execute function private.tutor_queries_immutable();

-- Burst cap: 20 per rolling hour. Usage cap: 60 per rolling 24 hours. Both are small multiples of what a learner
-- reading one topic at a time would plausibly need, and far below anything a scripted loop should be allowed.
create or replace function public.tutor_record_query(p_query text, p_locale text, p_refused boolean, p_refusal_reason text, p_hit_count integer)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); new_id bigint; hour_count integer; day_count integer;
begin
  if u is null then raise exception 'sign in to use the tutor' using errcode = '42501'; end if;
  if p_locale is null or p_locale not in ('en', 'ar') then raise exception 'invalid locale' using errcode = '22023'; end if;
  if p_query is null or char_length(p_query) > 500 then raise exception 'query too long' using errcode = '22023'; end if;
  if p_refused is null then raise exception 'refused must be stated' using errcode = '22023'; end if;
  if p_hit_count is null or p_hit_count not between 0 and 50 then raise exception 'invalid hit count' using errcode = '22023'; end if;

  select count(*) into hour_count from public.tutor_queries where user_id = u and created_at > now() - interval '1 hour';
  if hour_count >= 20 then raise exception 'too many tutor questions in the last hour; please wait before asking more' using errcode = '54000'; end if;
  select count(*) into day_count from public.tutor_queries where user_id = u and created_at > now() - interval '24 hours';
  if day_count >= 60 then raise exception 'daily tutor question limit reached; please try again tomorrow' using errcode = '54000'; end if;

  insert into public.tutor_queries (user_id, locale, query, refused, refusal_reason, hit_count)
  values (u, p_locale, left(coalesce(p_query, ''), 500), p_refused, p_refusal_reason, p_hit_count)
  returning id into new_id;
  return jsonb_build_object('id', new_id, 'remaining_this_hour', greatest(0, 19 - hour_count), 'remaining_today', greatest(0, 59 - day_count));
end $$;

-- A learner's own remaining quota, for display before they even ask (no row is created by calling this).
create or replace function public.tutor_usage_remaining() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); hour_count integer; day_count integer;
begin
  if u is null then raise exception 'sign in to use the tutor' using errcode = '42501'; end if;
  select count(*) into hour_count from public.tutor_queries where user_id = u and created_at > now() - interval '1 hour';
  select count(*) into day_count from public.tutor_queries where user_id = u and created_at > now() - interval '24 hours';
  return jsonb_build_object('remaining_this_hour', greatest(0, 20 - hour_count), 'remaining_today', greatest(0, 60 - day_count));
end $$;

revoke all on public.tutor_queries from public, anon, authenticated;
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.tutor_record_query(text, text, boolean, text, integer), public.tutor_usage_remaining() to authenticated;

commit;
