-- Phase 11: staff-only draft workspace (workflow notes about UNPUBLISHED drafts).
--
-- What this is: a place for staff to record owner, evidence, licensing and status notes against a draft key (for example SK-01 or D03-T05),
-- with an append-only revision history and an audit-log entry for every change.
-- What this is NOT: it holds no clinical content, links to no learner-facing table, and grants no approval, review or publication capability.
-- Safeguards:
--   * no table access for anyone (RLS on, all privileges revoked); the only access path is four SECURITY DEFINER functions;
--   * reads need a staff role (with MFA when required); writes need author, publisher or admin (clinical_reviewer cannot write: nothing here assigns or records reviews);
--   * draft keys must match a fixed pattern, fields are a closed list, text is capped at 1000 characters;
--   * the text is checked with the same dose/unit guard used for medications, so notes cannot become a back door for dosing instructions;
--   * 40 changes per user per hour; every change writes private.write_audit (lengths only, not the text).
begin;

create table public.draft_notes (
  draft_key text not null check (draft_key ~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2})$'),
  field text not null check (field in ('owner_note', 'evidence_note', 'licensing_note', 'status_note')),
  value text not null check (char_length(value) between 1 and 1000),
  updated_by uuid references auth.users (id) on delete set null, -- a deleted account never blocks account deletion
  updated_at timestamptz not null default now(),
  primary key (draft_key, field)
);
alter table public.draft_notes enable row level security;

create table public.draft_note_revisions (
  id bigint generated always as identity primary key,
  draft_key text not null,
  field text not null,
  old_value text,
  new_value text,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index draft_note_revisions_idx on public.draft_note_revisions (draft_key, changed_at desc);
alter table public.draft_note_revisions enable row level security;

create or replace function private.draft_notes_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  -- The only permitted change is the foreign key detaching a deleted account (changed_by -> null); content never changes.
  if tg_op = 'UPDATE' and new.changed_by is null and new.id = old.id and new.draft_key = old.draft_key and new.field = old.field
     and new.old_value is not distinct from old.old_value and new.new_value is not distinct from old.new_value and new.changed_at = old.changed_at then
    return new;
  end if;
  raise exception 'draft note revisions are append-only' using errcode = '42501';
end $$;
create trigger draft_note_revisions_no_update before update or delete on public.draft_note_revisions for each row execute function private.draft_notes_immutable();
create trigger draft_note_revisions_no_truncate before truncate on public.draft_note_revisions for each statement execute function private.draft_notes_immutable();

-- Same guard as medication text (note: PostgreSQL regular expressions use \y for a word boundary; \b means backspace): doses, rates and instruction words are refused. Returns true when the text is safe.
create or replace function private.draft_note_text_ok(p_text text) returns boolean
language sql immutable set search_path = '' as $$
  select p_text !~* '(\d+(\.\d+)?\s?(mcg|µg|ug|mg|g|kg|ml|units?|iu|meq|mmol)\y\s?(/|per)?\s?(kg|min|h|hr|hour|minute|day)?)'
$$;

-- Summary for the list view: which drafts have notes, and when they last changed.
create or replace function public.adm_draft_notes_summary() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not private.is_staff() then raise exception 'staff access with MFA required' using errcode = '42501'; end if;
  return coalesce((select jsonb_object_agg(draft_key, jsonb_build_object('fields', fields, 'updated_at', last)) from (
    select draft_key, count(*) as fields, max(updated_at) as last from public.draft_notes group by draft_key) x), '{}'::jsonb);
end $$;

-- Notes and recent revisions for one draft.
create or replace function public.adm_draft_notes(p_draft text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not private.is_staff() then raise exception 'staff access with MFA required' using errcode = '42501'; end if;
  if p_draft is null or p_draft !~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2})$' then raise exception 'invalid draft key' using errcode = '22023'; end if;
  return jsonb_build_object(
    'notes', coalesce((select jsonb_object_agg(n.field, jsonb_build_object('value', n.value, 'updated_at', n.updated_at, 'updated_by', coalesce(p.display_name, 'former staff member')))
        from public.draft_notes n left join public.profiles p on p.id = n.updated_by where n.draft_key = p_draft), '{}'::jsonb),
    'revisions', coalesce((select jsonb_agg(jsonb_build_object('field', r.field, 'old', r.old_value, 'new', r.new_value, 'at', r.changed_at, 'by', coalesce(p.display_name, 'former staff member')) order by r.changed_at desc, r.id desc)
        from (select * from public.draft_note_revisions where draft_key = p_draft order by changed_at desc, id desc limit 50) r left join public.profiles p on p.id = r.changed_by), '[]'::jsonb));
end $$;

-- Sets (or clears, with an empty string) one note. Writers: author, publisher, admin.
create or replace function public.adm_set_draft_note(p_draft text, p_field text, p_value text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); v text := nullif(btrim(coalesce(p_value, '')), ''); old text;
begin
  if u is null or not (private.has_staff_role('author') or private.has_staff_role('publisher') or private.has_staff_role('admin')) then
    raise exception 'author, publisher or administrator access with MFA required' using errcode = '42501';
  end if;
  if p_draft is null or p_draft !~ '^(D[0-9]{2}-T[0-9]{2}|SK-[0-9]{2}|MD-[0-9]{2}|SC-[0-9]{2}|EQ-[0-9]{2}|XQ-[0-9]{2})$' then raise exception 'invalid draft key' using errcode = '22023'; end if;
  if p_field is null or p_field not in ('owner_note', 'evidence_note', 'licensing_note', 'status_note') then raise exception 'invalid field' using errcode = '22023'; end if;
  if v is not null and (char_length(v) > 1000 or not private.draft_note_text_ok(v)) then raise exception 'note refused: too long, or it contains a dose or rate' using errcode = '22023'; end if;
  if (select count(*) from public.draft_note_revisions where changed_by = u and changed_at > now() - interval '1 hour') >= 40 then raise exception 'too many changes in the last hour' using errcode = '54000'; end if;
  select value into old from public.draft_notes where draft_key = p_draft and field = p_field;
  if old is not distinct from v then return; end if;
  if v is null then delete from public.draft_notes where draft_key = p_draft and field = p_field;
  else insert into public.draft_notes (draft_key, field, value, updated_by) values (p_draft, p_field, v, u)
       on conflict (draft_key, field) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
  end if;
  insert into public.draft_note_revisions (draft_key, field, old_value, new_value, changed_by) values (p_draft, p_field, old, v, u);
  perform private.write_audit('draft_note_set', 'draft_note', p_draft || ':' || p_field, jsonb_build_object('old_length', coalesce(char_length(old), 0), 'new_length', coalesce(char_length(v), 0)));
end $$;

revoke all on public.draft_notes, public.draft_note_revisions from public, anon, authenticated;
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.adm_draft_notes_summary(), public.adm_draft_notes(text), public.adm_set_draft_note(text, text, text) to authenticated;

commit;
