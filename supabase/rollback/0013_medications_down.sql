-- MANUAL ROLLBACK for 0013 (never applied automatically). Removes the medication reference library and every learner's medication bookmarks.
begin;
drop function if exists public.md_set_bookmark(uuid, boolean), public.md_progress(), public.md_get(text), public.md_list(text, text, boolean, boolean);
drop function if exists private.medication_card(uuid, uuid);
drop table if exists public.medication_bookmarks, public.medication_revisions, public.medication_monitoring_items, public.medication_items;
drop function if exists private.medication_content_frozen(), private.medication_item_frozen(), private.medication_publish_guard(), private.medication_structure_errors(uuid),
  private.medication_is_visible(uuid), private.medication_no_dosing(), private.medication_text_violation(text), private.medication_sections_ok(jsonb);
commit;
