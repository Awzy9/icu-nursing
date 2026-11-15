-- MANUAL ROLLBACK for 0015 (never applied automatically). Removes every learner's equipment bookmarks and viewed-part progress.
begin;
drop function if exists public.eq_reset_progress(text), public.eq_mark_viewed(text, text), public.eq_set_bookmark(text, boolean), public.eq_state();
drop table if exists public.equipment_progress, public.equipment_bookmarks;
drop function if exists private.equipment_fixtures_visible();
commit;
