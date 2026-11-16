-- Phase 15: AI-assisted evidence verification workflow for UNPUBLISHED clinical drafts.
--
-- What this is: a place for staff to record that an AI tool (for example ChatGPT, used by a person, with web browsing) was asked to check a draft's
-- claims against current guidelines, systematic reviews, trials or regulatory sources, and what it found. It is a structured log, append-only.
-- What this is NOT, by construction:
--   * it cannot mark anything "clinically reviewed" or "approved" - there is no such column on this table, and no function here writes to
--     content_reviews, draft status, clinically_reviewed or pharmacist_reviewed anywhere. The only function that can record clinical review is
--     public.record_review() (migration 0003), which this feature never calls and has no access to call;
--   * it holds no clinical content itself, only a short summary of what was checked and found (same dose/unit guard as draft_notes, so it can never
--     become a back door for dosing instructions);
--   * every read is paired, in the application, with a banner saying AI verification is not a substitute for professional clinical review;
--   * it never runs automatically and never calls a live AI service from this database: a staff member who did the check (outside the database,
--     typically with ChatGPT) records the result here by hand. No AI assistant is embedded in the website by this migration.
-- Safeguards, same shape as the existing draft workspace (migration 0016):
--   * no table access for anyone; the only access path is three SECURITY DEFINER functions;
--   * reads need a staff role (with MFA when required); writes need author, publisher or admin - a clinical_reviewer can read (useful input to their
--     own review) but cannot write an AI check, and cannot use this table to approve anything, because nothing here approves anything;
--   * draft keys must match a fixed pattern; sources list and summary are length-capped; up to 20 sources per entry;
--   * entries are append-only (an immutable trigger, like draft_note_revisions) so the history of checks can never be edited after the fact;
--   * 20 entries per user per hour; every entry writes private.write_audit (lengths and outcome only, not the text).
begin;

create table public.ai_evidence_reviews (
  id bigint generated always as identity primary key,
  draft_key text not null check (draft_key ~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2}|PX-[0-9]{2})$'),
  tool text not null check (char_length(tool) between 1 and 200),
  sources_checked text[] not null check (array_length(sources_checked, 1) between 1 and 20 and array_length(sources_checked, 1) is not null),
  guideline_currency text not null check (guideline_currency in ('current', 'superseded', 'unclear')),
  discrepancies_found boolean not null,
  summary text not null check (char_length(summary) between 1 and 2000),
  recommendation text not null check (recommendation in ('no_action', 'minor_update_suggested', 'major_gap_flagged')),
  reviewed_by uuid references auth.users (id) on delete set null, -- a deleted account never blocks account deletion
  reviewed_at timestamptz not null default now()
  -- Per-source length (<=300 chars) is checked in adm_ai_evidence_set(): a table CHECK cannot contain a subquery/unnest.
);
create index ai_evidence_reviews_draft_idx on public.ai_evidence_reviews (draft_key, reviewed_at desc);
alter table public.ai_evidence_reviews enable row level security;

create or replace function private.ai_evidence_reviews_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  -- The only permitted change is the foreign key detaching a deleted account (reviewed_by -> null); content never changes.
  if tg_op = 'UPDATE' and new.reviewed_by is null and new.id = old.id and new.draft_key = old.draft_key and new.tool = old.tool
     and new.sources_checked = old.sources_checked and new.guideline_currency = old.guideline_currency and new.discrepancies_found = old.discrepancies_found
     and new.summary = old.summary and new.recommendation = old.recommendation and new.reviewed_at = old.reviewed_at then
    return new;
  end if;
  raise exception 'AI evidence review entries are append-only' using errcode = '42501';
end $$;
create trigger ai_evidence_reviews_no_update before update or delete on public.ai_evidence_reviews for each row execute function private.ai_evidence_reviews_immutable();
create trigger ai_evidence_reviews_no_truncate before truncate on public.ai_evidence_reviews for each statement execute function private.ai_evidence_reviews_immutable();

-- Which drafts have an AI evidence check, how many, the most recent outcome, and whether any check ever flagged a gap - for the list view.
create or replace function public.adm_ai_evidence_summary() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not private.is_staff() then raise exception 'staff access with MFA required' using errcode = '42501'; end if;
  return coalesce((select jsonb_object_agg(draft_key, jsonb_build_object(
      'count', n, 'last_at', last_at, 'last_recommendation', last_recommendation, 'ever_flagged', ever_flagged)) from (
    select draft_key, count(*) as n, max(reviewed_at) as last_at,
      (array_agg(recommendation order by reviewed_at desc))[1] as last_recommendation,
      bool_or(recommendation = 'major_gap_flagged') as ever_flagged
    from public.ai_evidence_reviews group by draft_key) x), '{}'::jsonb);
end $$;

-- The full history of AI evidence checks for one draft, newest first.
create or replace function public.adm_ai_evidence_list(p_draft text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not private.is_staff() then raise exception 'staff access with MFA required' using errcode = '42501'; end if;
  if p_draft is null or p_draft !~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2}|PX-[0-9]{2})$' then raise exception 'invalid draft key' using errcode = '22023'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'tool', r.tool, 'sources_checked', to_jsonb(r.sources_checked), 'guideline_currency', r.guideline_currency,
      'discrepancies_found', r.discrepancies_found, 'summary', r.summary, 'recommendation', r.recommendation,
      'reviewed_at', r.reviewed_at, 'reviewed_by', coalesce(p.display_name, 'former staff member')) order by r.reviewed_at desc, r.id desc)
    from public.ai_evidence_reviews r left join public.profiles p on p.id = r.reviewed_by where r.draft_key = p_draft), '[]'::jsonb);
end $$;

-- Records one AI-assisted evidence check. Writers: author, publisher, admin (same as draft notes). This NEVER marks anything clinically reviewed:
-- no column here does that, and this function has no path to public.record_review() or to content_reviews.
create or replace function public.adm_ai_evidence_set(
  p_draft text, p_tool text, p_sources text[], p_currency text, p_discrepancies boolean, p_summary text, p_recommendation text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); new_id bigint;
begin
  if u is null or not (private.has_staff_role('author') or private.has_staff_role('publisher') or private.has_staff_role('admin')) then
    raise exception 'author, publisher or administrator access with MFA required' using errcode = '42501';
  end if;
  if p_draft is null or p_draft !~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2}|PX-[0-9]{2})$' then raise exception 'invalid draft key' using errcode = '22023'; end if;
  if p_tool is null or char_length(btrim(p_tool)) = 0 or char_length(p_tool) > 200 then raise exception 'name the tool used (1-200 characters)' using errcode = '22023'; end if;
  if p_sources is null or array_length(p_sources, 1) is null or array_length(p_sources, 1) < 1 or array_length(p_sources, 1) > 20 then raise exception 'list 1 to 20 sources checked' using errcode = '22023'; end if;
  if exists (select 1 from unnest(p_sources) s where char_length(s) > 300) then raise exception 'a source description is too long (300 characters max)' using errcode = '22023'; end if;
  if p_currency is null or p_currency not in ('current', 'superseded', 'unclear') then raise exception 'invalid guideline currency' using errcode = '22023'; end if;
  if p_discrepancies is null then raise exception 'say whether discrepancies were found' using errcode = '22023'; end if;
  if p_summary is null or char_length(btrim(p_summary)) = 0 or char_length(p_summary) > 2000 or not private.draft_note_text_ok(p_summary) then
    raise exception 'summary refused: empty, too long, or it contains a dose or rate' using errcode = '22023';
  end if;
  if p_recommendation is null or p_recommendation not in ('no_action', 'minor_update_suggested', 'major_gap_flagged') then raise exception 'invalid recommendation' using errcode = '22023'; end if;
  if (select count(*) from public.ai_evidence_reviews where reviewed_by = u and reviewed_at > now() - interval '1 hour') >= 20 then raise exception 'too many entries in the last hour' using errcode = '54000'; end if;
  insert into public.ai_evidence_reviews (draft_key, tool, sources_checked, guideline_currency, discrepancies_found, summary, recommendation, reviewed_by)
  values (p_draft, btrim(p_tool), p_sources, p_currency, p_discrepancies, btrim(p_summary), p_recommendation, u)
  returning id into new_id;
  perform private.write_audit('ai_evidence_review_set', 'ai_evidence_review', p_draft, jsonb_build_object('id', new_id, 'recommendation', p_recommendation, 'discrepancies_found', p_discrepancies));
  return jsonb_build_object('id', new_id);
end $$;

revoke all on public.ai_evidence_reviews from public, anon, authenticated;
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.adm_ai_evidence_summary(), public.adm_ai_evidence_list(text), public.adm_ai_evidence_set(text, text, text[], text, boolean, text, text) to authenticated;

commit;
