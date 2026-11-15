-- 0013_medications.sql
-- Phase 8: ICU medication reference library (nursing reference, NO dosing).
-- Same security model as skills (0012) and the question bank:
--   * learners read nothing directly; they use SECURITY DEFINER functions behind a content gate;
--   * content gate private.medication_is_visible(): published, not retired, and either demo_synthetic (labelled, fixtures on, development database)
--     or clinical (named approver + independent clinical reviewer + evidence_status 'supported' + licence original/cleared + a label date);
--   * NO dose, concentration, infusion-rate, titration or compatibility content can be stored: a guard trigger rejects numeric quantities with
--     units and those instruction words in every text column, for every writer. Institution-specific preparation and dosing are always
--     referrals to the pharmacy/protocol, never values;
--   * a future pharmacist-approval workflow is DESIGNED (reserved columns, docs/MEDICATION_ARCHITECTURE.md) but neither active nor required.

create table public.medication_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$'),
  kind public.content_kind not null,
  status public.content_status not null default 'draft',
  origin public.content_origin not null default 'human',
  category text not null check (category in ('vasoactives-inotropes', 'sedatives-analgesics', 'neuromuscular-blockers', 'anticoagulants-hemostasis', 'antiarrhythmics-cardiac',
                                             'insulin-electrolytes-fluids', 'anti-infectives', 'neuro-seizure-icp', 'respiratory-gi-support', 'reversal-emergency')),
  high_alert boolean not null default false,
  name jsonb not null check (jsonb_typeof(name) = 'object' and name ? 'en' and char_length(name ->> 'en') between 3 and 120),
  drug_class jsonb not null check (jsonb_typeof(drug_class) = 'object' and drug_class ? 'en' and char_length(drug_class ->> 'en') between 3 and 200),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and summary ? 'en' and char_length(summary ->> 'en') between 10 and 1500),
  -- sections: { "<key>": { "en": ["..."], "ar": [...] } }; the two institution_* sections are mandatory and are referrals only
  sections jsonb not null default '{}'::jsonb check (jsonb_typeof(sections) = 'object'),
  section_support jsonb not null default '{}'::jsonb check (jsonb_typeof(section_support) = 'object'),
  evidence_status text not null default 'unassessed' check (evidence_status in ('unassessed', 'supported', 'partial', 'unsupported')),
  license_status text not null default 'unassessed' check (license_status in ('unassessed', 'original', 'cleared', 'permission_required', 'restricted')),
  evidence_date date,
  "references" jsonb not null default '[]'::jsonb check (jsonb_typeof("references") = 'array' and jsonb_array_length("references") <= 40),
  -- regulator label provenance and jurisdiction limits (never "universal")
  label_source text check (label_source in ('FDA', 'EMA', 'MHRA', 'SFDA', 'other')),
  label_version text check (char_length(label_version) <= 120),
  label_date date,
  jurisdiction_note jsonb check (jurisdiction_note is null or (jsonb_typeof(jurisdiction_note) = 'object' and jurisdiction_note ? 'en')),
  source_note text check (char_length(source_note) <= 1000),
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  -- RESERVED for the future pharmacist workflow. Not required, not read by the gate, not settable by any function in this phase.
  pharmacist_reviewed_by uuid references auth.users (id) on delete set null,
  pharmacist_reviewed_at timestamptz,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medication_items_category_idx on public.medication_items (category);
create index medication_items_created_by_idx on public.medication_items (created_by);
create index medication_items_reviewed_by_idx on public.medication_items (reviewed_by);
create index medication_items_approved_by_idx on public.medication_items (approved_by);
create index medication_items_pharm_idx on public.medication_items (pharmacist_reviewed_by);
alter table public.medication_items enable row level security;

create or replace function private.medication_sections_ok(p jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select not exists (
    select 1 from jsonb_each(p) e
    where e.key not in ('general_pharmacology', 'administration_considerations', 'institution_preparation', 'institution_dosing', 'nursing_responsibilities',
                        'monitoring', 'safety_alerts', 'adverse_effects', 'escalation', 'documentation', 'communication', 'special_populations')
       or jsonb_typeof(e.value) <> 'object' or not (e.value ? 'en') or jsonb_typeof(e.value -> 'en') <> 'array'
  )
$$;
alter table public.medication_items add constraint medication_items_sections_ok check (private.medication_sections_ok(sections));
alter table public.medication_items add constraint medication_items_support_ok check (private.skill_support_ok(section_support));

create table public.medication_monitoring_items (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medication_items (id) on delete cascade,
  position smallint not null check (position between 1 and 40),
  kind text not null check (kind in ('observe', 'assess', 'laboratory', 'escalate', 'document')),
  text jsonb not null check (jsonb_typeof(text) = 'object' and text ? 'en' and char_length(text ->> 'en') between 3 and 400),
  critical boolean not null default false,
  support text not null default 'local_protocol' check (support in ('sourced', 'partial', 'local_protocol')),
  unique (medication_id, position),
  unique (medication_id, id)
);
alter table public.medication_monitoring_items enable row level security;

create table public.medication_revisions (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medication_items (id) on delete cascade,
  version integer not null check (version >= 1),
  changed_at timestamptz not null default now(),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and summary ? 'en' and char_length(summary ->> 'en') between 3 and 500),
  unique (medication_id, version)
);
alter table public.medication_revisions enable row level security;

create table public.medication_bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medication_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, medication_id)
);
create index medication_bookmarks_med_idx on public.medication_bookmarks (medication_id);
alter table public.medication_bookmarks enable row level security;

create trigger medication_items_updated before update on public.medication_items for each row execute function private.set_updated_at();
create trigger medication_items_audit after insert or update or delete on public.medication_items for each row execute function private.audit_row();

-- ---------------------------------------------------------------------------------------------
-- No-dosing guard (defence in depth; the draft validator applies the same rules to files)
-- ---------------------------------------------------------------------------------------------
create or replace function private.medication_text_violation(p text) returns text
language sql immutable set search_path = public, pg_temp as $$
  select case
    when p ~* '\m\d+([.,]\d+)?\s*(mcg|µg|ug|mg|g|kg|units?|iu|meq|mmol|mol|ml|dl)\M' or p ~ '\d\s*%' then 'a numeric quantity with a unit (dose, concentration or rate)'
    when p ~* '(mcg|mg|g|units?|meq|mmol|ml)\s*(/|per)\s*(kg|ml|l|min|h|hr|hour|minute|day|dl)' then 'a dose or rate expression'
    when p ~* '(y-site|compatib|incompatib|diluent|dilute|dilution|reconstitut|loading dose|maintenance dose|infusion rate|titrat|bolus dose|mix with|syringe driver setting)' then 'dosing, titration, preparation or compatibility wording'
  end
$$;

create or replace function private.medication_no_dosing() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare v text;
begin
  if tg_table_name = 'medication_items' then
    v := private.medication_text_violation(coalesce(new.name::text, '') || ' ' || coalesce(new.drug_class::text, '') || ' ' || coalesce(new.summary::text, '') || ' ' || coalesce(new.sections::text, '') || ' ' || coalesce(new.jurisdiction_note::text, ''));
  else
    v := private.medication_text_violation(coalesce(new.text::text, ''));
  end if;
  if v is not null then
    raise exception 'medication content must not contain %; dosing, concentration, infusion-rate, titration and compatibility instructions are not stored in this library', v using errcode = '55000';
  end if;
  return new;
end $$;
create trigger medication_items_no_dosing before insert or update on public.medication_items for each row execute function private.medication_no_dosing();
create trigger medication_monitoring_no_dosing before insert or update on public.medication_monitoring_items for each row execute function private.medication_no_dosing();

-- ---------------------------------------------------------------------------------------------
-- Content gate
-- ---------------------------------------------------------------------------------------------
create or replace function private.medication_is_visible(p_med uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.medication_items m
    where m.id = p_med
      and m.status = 'published' and m.retired_at is null
      and m.approved_at is not null and m.published_at is not null
      and (
        (m.kind = 'demo_synthetic' and m.source_note like 'SYNTHETIC FIXTURE%'
           and (select question_fixtures_visible and environment = 'development' from public.app_settings))
        or (m.kind = 'clinical'
            and m.approved_by is not null
            and m.reviewed_by is not null and m.reviewed_at is not null
            and m.evidence_status = 'supported'
            and m.license_status in ('original', 'cleared')
            and m.label_date is not null)
      )
  )
$$;

create or replace function private.medication_structure_errors(p_med uuid) returns text[]
language plpgsql stable set search_path = public, pg_temp as $$
declare errs text[] := '{}'; n integer; m public.medication_items;
begin
  select * into m from public.medication_items where id = p_med;
  select count(*) into n from public.medication_monitoring_items where medication_id = p_med;
  if n < 3 then errs := array_append(errs, 'a medication needs at least three monitoring/safety items'::text); end if;
  if exists (select 1 from public.medication_monitoring_items c where c.medication_id = p_med and c.position > n) then errs := array_append(errs, 'monitoring positions must be 1..n without gaps'::text); end if;
  if not (m.sections ? 'institution_preparation' and m.sections ? 'institution_dosing' and m.sections ? 'nursing_responsibilities' and m.sections ? 'safety_alerts' and m.sections ? 'escalation') then
    errs := array_append(errs, 'sections nursing_responsibilities, safety_alerts, escalation, institution_preparation and institution_dosing are required'::text);
  end if;
  if not exists (select 1 from public.medication_revisions r where r.medication_id = p_med and r.version = m.version) then errs := array_append(errs, 'the current version needs a revision note'::text); end if;
  return errs;
end $$;

create or replace function private.medication_publish_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare errs text[];
begin
  if new.status = 'published' then
    if new.approved_at is null or new.published_at is null then
      raise exception 'a published medication needs approval metadata (approved_at, published_at)' using errcode = '55000';
    end if;
    if new.kind = 'demo_synthetic' and coalesce(new.source_note, '') not like 'SYNTHETIC FIXTURE%' then
      raise exception 'a demo_synthetic medication must be labelled SYNTHETIC FIXTURE in source_note' using errcode = '55000';
    end if;
    if new.kind = 'clinical' then
      if new.approved_by is null then raise exception 'a clinical medication needs a named approver (approved_by)' using errcode = '55000'; end if;
      if new.reviewed_by is null or new.reviewed_at is null then raise exception 'a clinical medication cannot be published without an independent clinical review' using errcode = '55000'; end if;
      if new.created_by is not null and new.reviewed_by = new.created_by then raise exception 'the clinical reviewer must differ from the author' using errcode = '55000'; end if;
      if not private.user_has_role(new.reviewed_by, 'clinical_reviewer') then raise exception 'reviewed_by must hold the clinical_reviewer role' using errcode = '55000'; end if;
      if new.evidence_status <> 'supported' then raise exception 'a clinical medication needs fully supported evidence before publication' using errcode = '55000'; end if;
      if new.license_status not in ('original', 'cleared') then raise exception 'a clinical medication needs cleared or original licensing before publication' using errcode = '55000'; end if;
      if jsonb_array_length(new."references") < 1 or new.evidence_date is null then raise exception 'a clinical medication needs references and an evidence date' using errcode = '55000'; end if;
      if new.label_source is null or new.label_version is null or new.label_date is null or new.jurisdiction_note is null then
        raise exception 'a clinical medication needs its regulator label source, version, date and a jurisdiction note' using errcode = '55000';
      end if;
    end if;
    errs := private.medication_structure_errors(new.id);
    if cardinality(errs) > 0 then raise exception 'invalid medication structure: %', array_to_string(errs, '; ') using errcode = '55000'; end if;
  end if;
  return new;
end $$;
create trigger medication_items_publish_guard before insert or update on public.medication_items for each row execute function private.medication_publish_guard();

create or replace function private.medication_content_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare m uuid := coalesce(new.medication_id, old.medication_id);
begin
  if exists (select 1 from public.medication_items where id = m and status = 'published') then
    raise exception 'a published medication is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return coalesce(new, old);
end $$;
create trigger medication_monitoring_frozen before insert or update or delete on public.medication_monitoring_items for each row execute function private.medication_content_frozen();

create or replace function private.medication_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.name is distinct from old.name or new.summary is distinct from old.summary or new.sections is distinct from old.sections
       or new.kind is distinct from old.kind or new.category is distinct from old.category or new.high_alert is distinct from old.high_alert
       or new.version is distinct from old.version or new.code is distinct from old.code or new."references" is distinct from old."references"
       or new.evidence_status is distinct from old.evidence_status or new.license_status is distinct from old.license_status
       or new.label_date is distinct from old.label_date or new.label_version is distinct from old.label_version) then
    raise exception 'a published medication is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;
create trigger medication_items_frozen before update on public.medication_items for each row execute function private.medication_item_frozen();

-- ---------------------------------------------------------------------------------------------
-- Learner functions
-- ---------------------------------------------------------------------------------------------
create or replace function private.medication_card(p_med uuid, p_user uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', m.id, 'code', m.code, 'name', m.name, 'drug_class', m.drug_class, 'summary', m.summary, 'category', m.category, 'high_alert', m.high_alert,
    'synthetic', (m.kind = 'demo_synthetic'),
    'bookmarked', exists (select 1 from public.medication_bookmarks b where b.user_id = p_user and b.medication_id = m.id))
  from public.medication_items m where m.id = p_med
$$;

create or replace function public.md_list(p_query text default null, p_category text default null, p_bookmarked boolean default false, p_high_alert boolean default false) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); q text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if q is not null and char_length(q) > 80 then raise exception 'search text too long' using errcode = '22023'; end if;
  if p_category is not null and p_category not in ('vasoactives-inotropes', 'sedatives-analgesics', 'neuromuscular-blockers', 'anticoagulants-hemostasis', 'antiarrhythmics-cardiac',
                                                    'insulin-electrolytes-fluids', 'anti-infectives', 'neuro-seizure-icp', 'respiratory-gi-support', 'reversal-emergency') then
    raise exception 'unknown category' using errcode = '22023';
  end if;
  if q is not null then q := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%'; end if;
  return coalesce((
    select jsonb_agg(private.medication_card(m.id, u) order by m.category, m.code)
    from public.medication_items m
    where private.medication_is_visible(m.id)
      and (p_category is null or m.category = p_category)
      and (not coalesce(p_high_alert, false) or m.high_alert)
      and (q is null or (m.name::text ilike q or m.drug_class::text ilike q or m.summary::text ilike q or m.code ilike q))
      and (not coalesce(p_bookmarked, false) or exists (select 1 from public.medication_bookmarks b where b.user_id = u and b.medication_id = m.id))
  ), '[]'::jsonb);
end $$;

create or replace function public.md_get(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); m public.medication_items;
begin
  select * into m from public.medication_items where code = p_code;
  if not found or not private.medication_is_visible(m.id) then raise exception 'medication not found' using errcode = 'P0002'; end if;
  return private.medication_card(m.id, u) || jsonb_build_object(
    'sections', m.sections, 'section_support', m.section_support, 'evidence_status', m.evidence_status, 'license_status', m.license_status,
    'evidence_date', m.evidence_date, 'references', m."references", 'version', m.version, 'published_at', m.published_at,
    'label_source', m.label_source, 'label_version', m.label_version, 'label_date', m.label_date, 'jurisdiction_note', m.jurisdiction_note,
    'monitoring', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'position', c.position, 'kind', c.kind, 'text', c.text, 'critical', c.critical, 'support', c.support) order by c.position), '[]'::jsonb)
                   from public.medication_monitoring_items c where c.medication_id = m.id),
    'revisions', (select coalesce(jsonb_agg(jsonb_build_object('version', r.version, 'changed_at', r.changed_at, 'summary', r.summary) order by r.version desc), '[]'::jsonb)
                  from public.medication_revisions r where r.medication_id = m.id));
end $$;

create or replace function public.md_progress() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return jsonb_build_object(
    'available', (select count(*) from public.medication_items m where private.medication_is_visible(m.id)),
    'high_alert', (select count(*) from public.medication_items m where m.high_alert and private.medication_is_visible(m.id)),
    'bookmarked', (select count(*) from public.medication_bookmarks b where b.user_id = u and private.medication_is_visible(b.medication_id)),
    'synthetic_fixtures', exists (select 1 from public.medication_items m where m.kind = 'demo_synthetic' and private.medication_is_visible(m.id)));
end $$;

create or replace function public.md_set_bookmark(p_med uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if not private.medication_is_visible(p_med) then raise exception 'medication not found' using errcode = 'P0002'; end if;
  if coalesce(p_on, false) then
    if (select count(*) from public.medication_bookmarks where user_id = u) >= 200 then raise exception 'bookmark limit reached' using errcode = '54000'; end if;
    insert into public.medication_bookmarks (user_id, medication_id) values (u, p_med) on conflict do nothing;
  else
    delete from public.medication_bookmarks where user_id = u and medication_id = p_med;
  end if;
end $$;

revoke all on public.medication_items, public.medication_monitoring_items, public.medication_revisions, public.medication_bookmarks from public, anon, authenticated;
grant select on public.medication_items, public.medication_monitoring_items, public.medication_revisions to authenticated;
create policy medication_items_staff_read on public.medication_items for select to authenticated using (private.is_staff());
create policy medication_monitoring_staff_read on public.medication_monitoring_items for select to authenticated using (private.is_staff());
create policy medication_revisions_staff_read on public.medication_revisions for select to authenticated using (private.is_staff());
grant select on public.medication_bookmarks to authenticated;
create policy medication_bookmarks_own_read on public.medication_bookmarks for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.md_list(text, text, boolean, boolean), public.md_get(text), public.md_progress(), public.md_set_bookmark(uuid, boolean) to authenticated;
