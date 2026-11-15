-- MANUAL ROLLBACK for 0008_study_modes.sql. Not a migration. Restores the 0006 versions of reveal_answer and qb_start_attempt.
begin;
drop function if exists public.st_start_revision(text, integer, text[]), public.st_overview(), public.st_history(integer);
drop function if exists private.st_revision_ids(uuid, text), private.leitner_next_box(integer, boolean), private.leitner_days(integer);
drop table if exists public.learner_review_schedule;
drop index if exists public.question_answer_keys_option_idx, public.question_explanations_question_option_idx;
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
-- qb_start_attempt keeps working through private.qb_create_attempt, which is left in place (harmless).
delete from supabase_migrations.schema_migrations where version = '0008';
commit;
