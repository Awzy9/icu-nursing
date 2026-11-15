-- MANUAL ROLLBACK for 0016 (never applied automatically). Removes all staff workflow notes about drafts and their revision history.
begin;
drop function if exists public.adm_set_draft_note(text, text, text), public.adm_draft_notes(text), public.adm_draft_notes_summary();
drop table if exists public.draft_note_revisions, public.draft_notes;
drop function if exists private.draft_note_text_ok(text), private.draft_notes_immutable();
commit;
