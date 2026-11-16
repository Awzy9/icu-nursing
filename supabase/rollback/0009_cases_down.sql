-- MANUAL ROLLBACK for 0009_cases.sql. Not a migration; loses only case data.
begin;
drop function if exists public.cs_list(), public.cs_progress(), public.cs_start(uuid), public.cs_get(uuid), public.cs_choose(uuid, integer, uuid), public.cs_discard(uuid);
drop table if exists public.case_attempt_steps, public.case_attempts, public.case_option_keys, public.case_step_options, public.case_steps, public.case_items cascade;
drop function if exists private.own_case_attempt(uuid, boolean), private.case_is_visible(uuid), private.case_structure_errors(uuid), private.case_publish_guard(),
  private.case_content_frozen(), private.case_item_frozen();
delete from supabase_migrations.schema_migrations where version = '0009';
commit;
