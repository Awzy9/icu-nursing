-- Deterministic per-question spaced revision for the working edition.
-- Reuses the existing Leitner schedule (private.leitner_next_box / private.leitner_days, added in
-- 0008_study_modes.sql for the question-bank edition) instead of inventing a second algorithm.
-- Existing rows get box=1 (the schedule restarts from "just reviewed once"): this table never
-- tracked a box before this migration, so 1 is the honest starting point, not a fabricated streak.
begin;
alter table public.working_attempts add column box smallint not null default 1 check (box between 1 and 5);

-- These two are pure, side-effect-free arithmetic (no table access): safe to let an invoker-security
-- function call them as the signed-in user, unlike the data-reading functions in this schema.
grant execute on function private.leitner_next_box(integer,boolean) to authenticated;
grant execute on function private.leitner_days(integer) to authenticated;

create or replace function public.working_record_attempt(p_question_id text,p_module_key text,p_choice smallint,p_correct boolean,p_answered_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare cur_box smallint; nb smallint;
begin
  select box into cur_box from public.working_attempts where user_id = auth.uid() and question_id = p_question_id;
  nb := private.leitner_next_box(coalesce(cur_box, 1), p_correct);
  insert into public.working_attempts(user_id,question_id,module_key,choice,correct,answered_at,box)
  values(auth.uid(),p_question_id,p_module_key,p_choice,p_correct,least(p_answered_at,now()),nb)
  on conflict(user_id,question_id) do update
    set module_key = excluded.module_key, choice = excluded.choice, correct = excluded.correct, answered_at = excluded.answered_at, box = nb
    where public.working_attempts.answered_at <= excluded.answered_at;
end $$;
revoke all on function public.working_record_attempt(text,text,smallint,boolean,timestamptz) from public,anon;
grant execute on function public.working_record_attempt(text,text,smallint,boolean,timestamptz) to authenticated;
commit;
