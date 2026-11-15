-- 0012_skills.sql
-- Phase 7: Practical Nursing Skills Library and self-study competency checklists.
-- Security model (same as the question bank and cases):
--   * learners cannot read or write any skills table directly; they use SECURITY DEFINER functions that check auth.uid() and the content gate;
--   * content gate private.skill_is_visible(): a skill is shown only when published, not retired and
--       - demo_synthetic: labelled SYNTHETIC FIXTURE, fixtures switched on, development database; or
--       - clinical: named approver + independent clinical reviewer + evidence_status = 'supported' + licence cleared/original.
--     No function in this phase can set those fields, and a guard trigger rejects any publication (by any writer) that lacks them.
--     Every clinical skill therefore stays invisible: draft, unreviewed, partially supported or permission-pending content never reaches a learner;
--   * competency model: sessions are SELF-STUDY records only. The observed-assessment columns (assessor, credential, verified_at) exist so a
--     future clinical-review phase can add staff verification, but a named CHECK (skill_sessions_self_study_only) forbids anything else now.
--     Nothing here issues a certificate, an approval or a qualification, and no function writes a "passed" or "competent" state.

create table public.skill_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$'),
  kind public.content_kind not null,
  status public.content_status not null default 'draft',
  origin public.content_origin not null default 'human',
  category text not null check (category in ('vascular-access', 'airway-ventilation', 'transfusion-nutrition', 'elimination-drains', 'skin-mobility-transport',
                                             'renal-support', 'cardiac-resuscitation', 'safety-infection-devices', 'assessment')),
  topic_id uuid references public.topics (id) on delete set null,
  title jsonb not null check (jsonb_typeof(title) = 'object' and title ? 'en' and char_length(title ->> 'en') between 3 and 200),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and summary ? 'en' and char_length(summary ->> 'en') between 10 and 1500),
  -- localized lists: { "en": ["..."], "ar": ["..."] }
  objectives jsonb not null check (jsonb_typeof(objectives) = 'object' and objectives ? 'en' and jsonb_typeof(objectives -> 'en') = 'array' and jsonb_array_length(objectives -> 'en') between 1 and 12),
  prerequisites jsonb not null default '{"en": []}'::jsonb check (jsonb_typeof(prerequisites) = 'object' and jsonb_typeof(prerequisites -> 'en') = 'array'),
  -- sections: { "<key>": { "en": ["..."], "ar": [...] } } with keys restricted by private.skill_sections_ok
  sections jsonb not null default '{}'::jsonb check (jsonb_typeof(sections) = 'object'),
  evidence_status text not null default 'unassessed' check (evidence_status in ('unassessed', 'supported', 'partial', 'unsupported')),
  -- per-section support: { "<key>": "full" | "partial" | "local_protocol" | "permission_required" }
  section_support jsonb not null default '{}'::jsonb check (jsonb_typeof(section_support) = 'object'),
  license_status text not null default 'unassessed' check (license_status in ('unassessed', 'original', 'cleared', 'permission_required', 'restricted')),
  evidence_date date,
  "references" jsonb not null default '[]'::jsonb check (jsonb_typeof("references") = 'array' and jsonb_array_length("references") <= 40),
  source_note text check (char_length(source_note) <= 1000),
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index skill_items_category_idx on public.skill_items (category);
create index skill_items_topic_idx on public.skill_items (topic_id);
create index skill_items_created_by_idx on public.skill_items (created_by);
create index skill_items_reviewed_by_idx on public.skill_items (reviewed_by);
create index skill_items_approved_by_idx on public.skill_items (approved_by);
alter table public.skill_items enable row level security;

create or replace function private.skill_sections_ok(p jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select not exists (
    select 1 from jsonb_each(p) e
    where e.key not in ('indications', 'safety', 'responsibilities', 'scope', 'equipment', 'preparation', 'assessment', 'procedure',
                        'monitoring', 'escalation', 'complications', 'errors', 'documentation', 'communication')
       or jsonb_typeof(e.value) <> 'object' or not (e.value ? 'en') or jsonb_typeof(e.value -> 'en') <> 'array'
  )
$$;
alter table public.skill_items add constraint skill_items_sections_ok check (private.skill_sections_ok(sections));
create or replace function private.skill_support_ok(p jsonb) returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select not exists (select 1 from jsonb_each(p) e where jsonb_typeof(e.value) <> 'string' or (e.value #>> '{}') not in ('full', 'partial', 'local_protocol', 'permission_required'))
$$;
alter table public.skill_items add constraint skill_items_support_ok check (private.skill_support_ok(section_support));

create table public.skill_checklist_items (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skill_items (id) on delete cascade,
  position smallint not null check (position between 1 and 60),
  phase text not null check (phase in ('preparation', 'assessment', 'procedure', 'monitoring', 'escalation', 'documentation')),
  text jsonb not null check (jsonb_typeof(text) = 'object' and text ? 'en' and char_length(text ->> 'en') between 3 and 400),
  critical boolean not null default false,
  support text not null default 'local_protocol' check (support in ('sourced', 'partial', 'local_protocol')),
  unique (skill_id, position),
  unique (skill_id, id)
);
alter table public.skill_checklist_items enable row level security;

-- Change history shown to learners for visible skills.
create table public.skill_revisions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skill_items (id) on delete cascade,
  version integer not null check (version >= 1),
  changed_at timestamptz not null default now(),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and summary ? 'en' and char_length(summary ->> 'en') between 3 and 500),
  unique (skill_id, version)
);
alter table public.skill_revisions enable row level security;

create table public.skill_bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skill_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index skill_bookmarks_skill_idx on public.skill_bookmarks (skill_id);
alter table public.skill_bookmarks enable row level security;

create table public.skill_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id uuid not null references public.skill_items (id),
  skill_version integer not null,
  mode text not null default 'self_study' check (mode in ('self_study', 'observed_assessment')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  items_total integer, items_done integer, items_unsure integer, critical_total integer, critical_done integer,
  -- reserved for a future clinical-review phase (staff verification); unused and forbidden now
  assessor_id uuid references auth.users (id) on delete set null,
  assessor_name text, assessor_credential text, verified_at timestamptz,
  check ((status = 'completed') = (completed_at is not null)),
  check (mode = 'observed_assessment' or (assessor_id is null and assessor_name is null and assessor_credential is null and verified_at is null)),
  constraint skill_sessions_self_study_only check (mode = 'self_study')
);
create index skill_sessions_user_idx on public.skill_sessions (user_id, started_at desc);
create index skill_sessions_skill_idx on public.skill_sessions (skill_id);
create index skill_sessions_assessor_idx on public.skill_sessions (assessor_id);
alter table public.skill_sessions enable row level security;

create table public.skill_session_items (
  session_id uuid not null references public.skill_sessions (id) on delete cascade,
  item_id uuid not null references public.skill_checklist_items (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  result text not null check (result in ('done', 'unsure', 'not_done')),
  marked_at timestamptz not null default now(),
  primary key (session_id, item_id)
);
create index skill_session_items_user_idx on public.skill_session_items (user_id);
create index skill_session_items_item_idx on public.skill_session_items (item_id);
alter table public.skill_session_items enable row level security;

create trigger skill_items_updated before update on public.skill_items for each row execute function private.set_updated_at();
create trigger skill_items_audit after insert or update or delete on public.skill_items for each row execute function private.audit_row();

-- ---------------------------------------------------------------------------------------------
-- Content gate
-- ---------------------------------------------------------------------------------------------
create or replace function private.skill_is_visible(p_skill uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.skill_items s
    where s.id = p_skill
      and s.status = 'published' and s.retired_at is null
      and s.approved_at is not null and s.published_at is not null
      and (
        (s.kind = 'demo_synthetic' and s.source_note like 'SYNTHETIC FIXTURE%'
           and (select question_fixtures_visible and environment = 'development' from public.app_settings))
        or (s.kind = 'clinical'
            and s.approved_by is not null
            and s.reviewed_by is not null and s.reviewed_at is not null
            and s.evidence_status = 'supported'
            and s.license_status in ('original', 'cleared'))
      )
  )
$$;

create or replace function private.skill_structure_errors(p_skill uuid) returns text[]
language plpgsql stable set search_path = public, pg_temp as $$
declare errs text[] := '{}'; n integer; s public.skill_items;
begin
  select * into s from public.skill_items where id = p_skill;
  select count(*) into n from public.skill_checklist_items where skill_id = p_skill;
  if n < 3 then errs := array_append(errs, 'a skill needs at least three checklist items'::text); end if;
  if exists (select 1 from public.skill_checklist_items c where c.skill_id = p_skill and c.position > n) then errs := array_append(errs, 'checklist positions must be 1..n without gaps'::text); end if;
  if not (s.sections ? 'indications' and s.sections ? 'safety' and s.sections ? 'escalation' and s.sections ? 'documentation') then
    errs := array_append(errs, 'sections indications, safety, escalation and documentation are required'::text);
  end if;
  if not exists (select 1 from public.skill_revisions r where r.skill_id = p_skill and r.version = s.version) then errs := array_append(errs, 'the current version needs a revision note'::text); end if;
  return errs;
end $$;

create or replace function private.skill_publish_guard() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare errs text[];
begin
  if new.status = 'published' then
    if new.approved_at is null or new.published_at is null then
      raise exception 'a published skill needs approval metadata (approved_at, published_at)' using errcode = '55000';
    end if;
    if new.kind = 'demo_synthetic' and coalesce(new.source_note, '') not like 'SYNTHETIC FIXTURE%' then
      raise exception 'a demo_synthetic skill must be labelled SYNTHETIC FIXTURE in source_note' using errcode = '55000';
    end if;
    if new.kind = 'clinical' then
      if new.approved_by is null then raise exception 'a clinical skill needs a named approver (approved_by)' using errcode = '55000'; end if;
      if new.reviewed_by is null or new.reviewed_at is null then raise exception 'a clinical skill cannot be published without an independent clinical review' using errcode = '55000'; end if;
      if new.created_by is not null and new.reviewed_by = new.created_by then raise exception 'the clinical reviewer must differ from the author' using errcode = '55000'; end if;
      if not private.user_has_role(new.reviewed_by, 'clinical_reviewer') then raise exception 'reviewed_by must hold the clinical_reviewer role' using errcode = '55000'; end if;
      if new.evidence_status <> 'supported' then raise exception 'a clinical skill needs fully supported evidence before publication' using errcode = '55000'; end if;
      if new.license_status not in ('original', 'cleared') then raise exception 'a clinical skill needs cleared or original licensing before publication' using errcode = '55000'; end if;
      if jsonb_array_length(new."references") < 1 or new.evidence_date is null then raise exception 'a clinical skill needs references and an evidence date' using errcode = '55000'; end if;
    end if;
    errs := private.skill_structure_errors(new.id);
    if cardinality(errs) > 0 then raise exception 'invalid skill structure: %', array_to_string(errs, '; ') using errcode = '55000'; end if;
  end if;
  return new;
end $$;
create trigger skill_items_publish_guard before insert or update on public.skill_items for each row execute function private.skill_publish_guard();

create or replace function private.skill_content_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
declare s uuid := coalesce(new.skill_id, old.skill_id);
begin
  if exists (select 1 from public.skill_items where id = s and status = 'published') then
    raise exception 'a published skill is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return coalesce(new, old);
end $$;
create trigger skill_checklist_frozen before insert or update or delete on public.skill_checklist_items for each row execute function private.skill_content_frozen();

create or replace function private.skill_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.title is distinct from old.title or new.summary is distinct from old.summary or new.objectives is distinct from old.objectives
       or new.sections is distinct from old.sections or new.kind is distinct from old.kind or new.category is distinct from old.category
       or new.version is distinct from old.version or new.code is distinct from old.code or new."references" is distinct from old."references"
       or new.evidence_status is distinct from old.evidence_status or new.license_status is distinct from old.license_status) then
    raise exception 'a published skill is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;
create trigger skill_items_frozen before update on public.skill_items for each row execute function private.skill_item_frozen();

-- ---------------------------------------------------------------------------------------------
-- Learner functions (all gated; all identify the learner with auth.uid())
-- ---------------------------------------------------------------------------------------------
create or replace function private.skill_card(p_skill uuid, p_user uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', s.id, 'code', s.code, 'title', s.title, 'summary', s.summary, 'category', s.category, 'synthetic', (s.kind = 'demo_synthetic'),
    'steps', (select count(*) from public.skill_checklist_items c where c.skill_id = s.id),
    'bookmarked', exists (select 1 from public.skill_bookmarks b where b.user_id = p_user and b.skill_id = s.id),
    'in_progress_session', (select x.id from public.skill_sessions x where x.user_id = p_user and x.skill_id = s.id and x.status = 'in_progress' order by x.started_at desc limit 1),
    'sessions_completed', (select count(*) from public.skill_sessions x where x.user_id = p_user and x.skill_id = s.id and x.status = 'completed'),
    'last_completed_at', (select max(x.completed_at) from public.skill_sessions x where x.user_id = p_user and x.skill_id = s.id and x.status = 'completed'),
    'last_items_done', (select x.items_done from public.skill_sessions x where x.user_id = p_user and x.skill_id = s.id and x.status = 'completed' order by x.completed_at desc limit 1),
    'last_items_total', (select x.items_total from public.skill_sessions x where x.user_id = p_user and x.skill_id = s.id and x.status = 'completed' order by x.completed_at desc limit 1))
  from public.skill_items s where s.id = p_skill
$$;

create or replace function public.sk_list(p_query text default null, p_category text default null, p_bookmarked boolean default false) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); q text := nullif(btrim(coalesce(p_query, '')), '');
begin
  if q is not null and char_length(q) > 80 then raise exception 'search text too long' using errcode = '22023'; end if;
  if p_category is not null and p_category not in ('vascular-access', 'airway-ventilation', 'transfusion-nutrition', 'elimination-drains', 'skin-mobility-transport',
                                                    'renal-support', 'cardiac-resuscitation', 'safety-infection-devices', 'assessment') then
    raise exception 'unknown category' using errcode = '22023';
  end if;
  if q is not null then q := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%'; end if;
  return coalesce((
    select jsonb_agg(private.skill_card(s.id, u) order by s.category, s.code)
    from public.skill_items s
    where private.skill_is_visible(s.id)
      and (p_category is null or s.category = p_category)
      and (q is null or (s.title::text ilike q or s.summary::text ilike q or s.code ilike q))
      and (not coalesce(p_bookmarked, false) or exists (select 1 from public.skill_bookmarks b where b.user_id = u and b.skill_id = s.id))
  ), '[]'::jsonb);
end $$;

create or replace function public.sk_get(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); s public.skill_items;
begin
  select * into s from public.skill_items where code = p_code;
  if not found or not private.skill_is_visible(s.id) then raise exception 'skill not found' using errcode = 'P0002'; end if;
  return private.skill_card(s.id, u) || jsonb_build_object(
    'objectives', s.objectives, 'prerequisites', s.prerequisites, 'sections', s.sections, 'section_support', s.section_support,
    'evidence_status', s.evidence_status, 'license_status', s.license_status, 'evidence_date', s.evidence_date, 'references', s."references",
    'version', s.version, 'published_at', s.published_at,
    'checklist', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'position', c.position, 'phase', c.phase, 'text', c.text, 'critical', c.critical, 'support', c.support) order by c.position), '[]'::jsonb)
                  from public.skill_checklist_items c where c.skill_id = s.id),
    'revisions', (select coalesce(jsonb_agg(jsonb_build_object('version', r.version, 'changed_at', r.changed_at, 'summary', r.summary) order by r.version desc), '[]'::jsonb)
                  from public.skill_revisions r where r.skill_id = s.id),
    'my_sessions', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'status', x.status, 'started_at', x.started_at, 'completed_at', x.completed_at,
                       'items_done', x.items_done, 'items_total', x.items_total, 'critical_done', x.critical_done, 'critical_total', x.critical_total) order by x.started_at desc), '[]'::jsonb)
                    from (select * from public.skill_sessions y where y.user_id = u and y.skill_id = s.id and y.status <> 'abandoned' order by y.started_at desc limit 10) x));
end $$;

create or replace function public.sk_progress() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  return jsonb_build_object(
    'available', (select count(*) from public.skill_items s where private.skill_is_visible(s.id)),
    'practised', (select count(distinct x.skill_id) from public.skill_sessions x where x.user_id = u and x.status = 'completed' and private.skill_is_visible(x.skill_id)),
    'in_progress', (select count(*) from public.skill_sessions x where x.user_id = u and x.status = 'in_progress'),
    'bookmarked', (select count(*) from public.skill_bookmarks b where b.user_id = u and private.skill_is_visible(b.skill_id)),
    'synthetic_fixtures', exists (select 1 from public.skill_items s where s.kind = 'demo_synthetic' and private.skill_is_visible(s.id)));
end $$;

create or replace function public.sk_set_bookmark(p_skill uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if not private.skill_is_visible(p_skill) then raise exception 'skill not found' using errcode = 'P0002'; end if;
  if coalesce(p_on, false) then
    if (select count(*) from public.skill_bookmarks where user_id = u) >= 200 then raise exception 'bookmark limit reached' using errcode = '54000'; end if;
    insert into public.skill_bookmarks (user_id, skill_id) values (u, p_skill) on conflict do nothing;
  else
    delete from public.skill_bookmarks where user_id = u and skill_id = p_skill;
  end if;
end $$;

-- Starts a self-study session, or resumes the learner's unfinished session for the same skill.
create or replace function public.sk_start_session(p_skill uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user(); sid uuid; s public.skill_items;
begin
  if not private.skill_is_visible(p_skill) then raise exception 'skill not found' using errcode = 'P0002'; end if;
  select x.id into sid from public.skill_sessions x where x.user_id = u and x.skill_id = p_skill and x.status = 'in_progress' order by x.started_at desc limit 1;
  if sid is not null then return sid; end if;
  if (select count(*) from public.skill_sessions where user_id = u and status = 'in_progress') >= 10 then
    raise exception 'finish or discard an unfinished practice session before starting another (limit 10)' using errcode = '54000';
  end if;
  if (select count(*) from public.skill_sessions where user_id = u and started_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many practice sessions started in the last hour; please wait before starting more' using errcode = '54000';
  end if;
  select * into s from public.skill_items where id = p_skill;
  sid := gen_random_uuid();
  insert into public.skill_sessions (id, user_id, skill_id, skill_version, mode) values (sid, u, p_skill, s.version, 'self_study');
  return sid;
end $$;

create or replace function private.own_skill_session(p_session uuid, p_lock boolean default false) returns public.skill_sessions
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.skill_sessions; u uuid := private.require_user();
begin
  if p_lock then select * into a from public.skill_sessions where id = p_session and user_id = u for update;
  else select * into a from public.skill_sessions where id = p_session and user_id = u; end if;
  if not found then raise exception 'session not found' using errcode = 'P0002'; end if;
  return a;
end $$;

create or replace function public.sk_get_session(p_session uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.skill_sessions; s public.skill_items;
begin
  perform private.require_user();
  a := private.own_skill_session(p_session);
  if a.status = 'in_progress' and not private.skill_is_visible(a.skill_id) then raise exception 'skill no longer available' using errcode = 'P0002'; end if;
  select * into s from public.skill_items where id = a.skill_id;
  return jsonb_build_object(
    'id', a.id, 'status', a.status, 'mode', a.mode, 'started_at', a.started_at, 'completed_at', a.completed_at,
    'skill', jsonb_build_object('id', s.id, 'code', s.code, 'title', s.title, 'category', s.category, 'synthetic', (s.kind = 'demo_synthetic'), 'version', a.skill_version),
    'items', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'position', c.position, 'phase', c.phase, 'text', c.text, 'critical', c.critical, 'support', c.support,
                       'result', m.result) order by c.position), '[]'::jsonb)
              from public.skill_checklist_items c left join public.skill_session_items m on m.session_id = a.id and m.item_id = c.id where c.skill_id = a.skill_id),
    'summary', case when a.status = 'completed' then jsonb_build_object('items_total', a.items_total, 'items_done', a.items_done, 'items_unsure', a.items_unsure,
                      'critical_total', a.critical_total, 'critical_done', a.critical_done) end);
end $$;

-- Records the learner's own tick for one checklist item (self-report; nothing is verified).
create or replace function public.sk_mark(p_session uuid, p_item uuid, p_result text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.skill_sessions;
begin
  perform private.require_user();
  a := private.own_skill_session(p_session, true);
  if a.status <> 'in_progress' then raise exception 'this session is no longer in progress' using errcode = '55000'; end if;
  if not private.skill_is_visible(a.skill_id) then raise exception 'skill no longer available' using errcode = '55000'; end if;
  if p_result is null or p_result not in ('done', 'unsure', 'not_done') then raise exception 'invalid result' using errcode = '22023'; end if;
  if not exists (select 1 from public.skill_checklist_items c where c.id = p_item and c.skill_id = a.skill_id) then raise exception 'item does not belong to this skill' using errcode = '22023'; end if;
  insert into public.skill_session_items (session_id, item_id, user_id, result) values (a.id, p_item, a.user_id, p_result)
  on conflict (session_id, item_id) do update set result = excluded.result, marked_at = now();
  update public.skill_sessions set last_activity_at = now() where id = a.id;
end $$;

create or replace function public.sk_complete_session(p_session uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.skill_sessions; tot integer; done integer; uns integer; ctot integer; cdone integer;
begin
  perform private.require_user();
  a := private.own_skill_session(p_session, true);
  if a.status <> 'in_progress' then raise exception 'this session is no longer in progress' using errcode = '55000'; end if;
  select count(*), count(*) filter (where c.critical) into tot, ctot from public.skill_checklist_items c where c.skill_id = a.skill_id;
  select count(*) filter (where m.result = 'done'), count(*) filter (where m.result = 'unsure'),
         count(*) filter (where m.result = 'done' and c.critical)
    into done, uns, cdone
    from public.skill_session_items m join public.skill_checklist_items c on c.id = m.item_id where m.session_id = a.id;
  update public.skill_sessions set status = 'completed', completed_at = now(), last_activity_at = now(),
         items_total = tot, items_done = coalesce(done, 0), items_unsure = coalesce(uns, 0), critical_total = ctot, critical_done = coalesce(cdone, 0)
   where id = a.id;
  return public.sk_get_session(a.id);
end $$;

create or replace function public.sk_discard_session(p_session uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare a public.skill_sessions;
begin
  a := private.own_skill_session(p_session, true);
  if a.status = 'in_progress' then update public.skill_sessions set status = 'abandoned' where id = a.id; end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Privileges: learners read nothing directly; staff may read content (never learner sessions of others); no client writes.
-- ---------------------------------------------------------------------------------------------
revoke all on public.skill_items, public.skill_checklist_items, public.skill_revisions, public.skill_bookmarks, public.skill_sessions, public.skill_session_items from public, anon, authenticated;
grant select on public.skill_items, public.skill_checklist_items, public.skill_revisions to authenticated;
create policy skill_items_staff_read on public.skill_items for select to authenticated using (private.is_staff());
create policy skill_checklist_staff_read on public.skill_checklist_items for select to authenticated using (private.is_staff());
create policy skill_revisions_staff_read on public.skill_revisions for select to authenticated using (private.is_staff());
grant select on public.skill_bookmarks, public.skill_sessions, public.skill_session_items to authenticated;
create policy skill_bookmarks_own_read on public.skill_bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy skill_sessions_own_read on public.skill_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy skill_session_items_own_read on public.skill_session_items for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.sk_list(text, text, boolean), public.sk_get(text), public.sk_progress(), public.sk_set_bookmark(uuid, boolean),
  public.sk_start_session(uuid), public.sk_get_session(uuid), public.sk_mark(uuid, uuid, text), public.sk_complete_session(uuid), public.sk_discard_session(uuid) to authenticated;
