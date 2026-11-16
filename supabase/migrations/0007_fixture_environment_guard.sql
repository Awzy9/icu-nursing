-- 0007_fixture_environment_guard.sql
-- Synthetic question fixtures must be impossible to expose in production, even by a mistaken owner-level UPDATE.
--   * app_settings.environment declares what this database is. It defaults to 'production' (safe by default); only a
--     deliberate owner statement on a development database sets it to 'development'.
--   * question_fixtures_visible can be true only while environment = 'development' (CHECK constraint).
--   * private.question_is_visible() additionally requires environment = 'development' before a demo_synthetic question is served.
alter table public.app_settings add column environment text not null default 'production' check (environment in ('production', 'staging', 'development'));
alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development');

create or replace function private.question_is_visible(p_question uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.question_items q
    where q.id = p_question
      and q.status = 'published' and q.retired_at is null
      and q.approved_at is not null and q.published_at is not null
      and (
        (q.kind = 'demo_synthetic' and q.source_note like 'SYNTHETIC FIXTURE%'
           and (select question_fixtures_visible and environment = 'development' from public.app_settings))
        or (q.kind = 'clinical'
            and q.approved_by is not null
            and q.reviewed_by is not null and q.reviewed_at is not null
            and q.topic_id is not null and private.is_published_topic(q.topic_id))
      )
  )
$$;
