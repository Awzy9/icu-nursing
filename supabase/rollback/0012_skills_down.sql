-- MANUAL ROLLBACK for 0012 (never applied automatically). Removes the skills library and every learner's self-study sessions and bookmarks.
begin;
drop function if exists public.sk_discard_session(uuid), public.sk_complete_session(uuid), public.sk_mark(uuid, uuid, text), public.sk_get_session(uuid),
  public.sk_start_session(uuid), public.sk_set_bookmark(uuid, boolean), public.sk_progress(), public.sk_get(text), public.sk_list(text, text, boolean);
drop function if exists private.own_skill_session(uuid, boolean), private.skill_card(uuid, uuid);
drop table if exists public.skill_session_items, public.skill_sessions, public.skill_bookmarks, public.skill_revisions, public.skill_checklist_items, public.skill_items;
drop function if exists private.skill_content_frozen(), private.skill_item_frozen(), private.skill_publish_guard(), private.skill_structure_errors(uuid), private.skill_is_visible(uuid),
  private.skill_sections_ok(jsonb), private.skill_support_ok(jsonb);
commit;
