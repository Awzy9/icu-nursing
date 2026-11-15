-- MANUAL ROLLBACK for 0006_question_bank.sql and 0007_fixture_environment_guard.sql. NOT a migration; never applied automatically.
-- Both migrations are additive (new tables, functions, two app_settings columns), so rollback loses only question-bank data.
begin;
drop function if exists public.qb_progress(), public.qb_start_attempt(text, integer, text[], integer, boolean), public.qb_get_attempt(uuid),
  public.qb_submit_answer(uuid, integer, uuid), public.qb_set_flag(uuid, integer, boolean), public.qb_set_position(uuid, integer),
  public.qb_submit_attempt(uuid), public.qb_discard_attempt(uuid), public.qb_list_attempts(integer), public.qb_set_bookmark(uuid, boolean);
drop table if exists public.question_bookmarks, public.question_stats, public.learner_question_stats, public.quiz_answers,
  public.quiz_attempt_items, public.quiz_attempts, public.question_explanations, public.question_answer_keys,
  public.question_options, public.question_items cascade;
drop function if exists private.qb_candidates(uuid, text[], boolean), private.finalize_attempt(uuid, boolean), private.reveal_answer(uuid, uuid, boolean),
  private.expire_if_due(uuid), private.own_attempt(uuid, boolean), private.require_user(), private.score_tenths(integer, integer),
  private.question_is_visible(uuid), private.question_publish_guard(), private.question_content_frozen(), private.question_item_frozen();
alter table public.app_settings drop constraint if exists app_settings_fixtures_dev_only;
alter table public.app_settings drop column if exists environment, drop column if exists question_fixtures_visible;
delete from supabase_migrations.schema_migrations where version in ('0006', '0007');
commit;
