-- 0002_content_schema.sql
-- Educational content model, learner state, public read views, RLS and reference data.
-- Publication is controlled by 0003_workflow.sql; API roles cannot write workflow columns at all.

create type public.content_status as enum ('draft', 'in_review', 'changes_requested', 'approved', 'published', 'archived');
create type public.version_status as enum ('in_review', 'approved', 'changes_requested', 'rejected', 'withdrawn', 'published', 'superseded');
create type public.content_kind as enum ('demo_synthetic', 'clinical');
create type public.content_origin as enum ('human', 'ai_assisted', 'ai_generated');
create type public.learner_level as enum ('beginner', 'intermediate', 'advanced');
create type public.action_scope as enum (
  'assessment', 'monitoring', 'escalation', 'independent_nursing', 'order_or_protocol_required', 'prescriber_or_other_discipline'
);
create type public.review_decision as enum ('approve', 'request_changes', 'reject');

-- ---------------------------------------------------------------------------------------------
-- Curriculum structure
-- ---------------------------------------------------------------------------------------------
create table public.nursing_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort smallint not null,
  title jsonb not null check (title ? 'en'),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nursing_domains enable row level security;

-- Working copy of a topic. What learners see is ONLY the approved, published snapshot (public_topics).
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.nursing_domains (id),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 80),
  kind public.content_kind not null default 'clinical',
  origin public.content_origin not null default 'human',
  status public.content_status not null default 'draft',
  title jsonb not null check (title ? 'en'),
  summary jsonb not null default '{}'::jsonb,
  level public.learner_level not null default 'beginner',
  est_minutes smallint not null default 15 check (est_minutes between 1 and 240),
  curriculum_id text,
  required_review_roles text[] not null default '{NE}'
    check (cardinality(required_review_roles) >= 1 and required_review_roles <@ array['NE','BN','PH','RT','CCP','NEPH','NEURO','IPC','OTHER']),
  jurisdiction_scope text not null default 'international' check (char_length(jurisdiction_scope) <= 80),
  guideline_note text check (char_length(guideline_note) <= 500),
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  published_version_id uuid,
  first_published_at timestamptz,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topics_domain_idx on public.topics (domain_id);
create index topics_status_idx on public.topics (status);
create index topics_published_idx on public.topics (published_version_id) where published_version_id is not null;
alter table public.topics enable row level security;

create table public.topic_sections (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  kind text not null check (kind in ('overview','objectives','why_it_matters','physiology','pathophysiology','assessment',
    'nursing_responsibilities','monitoring','findings','red_flags','interventions','escalation','complications',
    'documentation','bedside_example','case','local_protocol','other')),
  sort integer not null default 0,
  title jsonb not null check (title ? 'en'),
  body jsonb not null check (body ? 'en'),
  updated_at timestamptz not null default now()
);
create index topic_sections_topic_idx on public.topic_sections (topic_id, sort);
alter table public.topic_sections enable row level security;

-- Scope-of-practice labelling: what a nurse may do independently vs. needs an order/protocol.
create table public.topic_actions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  scope public.action_scope not null,
  text jsonb not null check (text ? 'en'),
  institutional_protocol_required boolean not null default false,
  jurisdiction_note jsonb,
  sort integer not null default 0
);
create index topic_actions_topic_idx on public.topic_actions (topic_id, sort);
alter table public.topic_actions enable row level security;

-- Source register (mirrors sources/source_register.csv).
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_code text unique,
  organization text not null,
  title text not null,
  url text check (url is null or url ~ '^https://'),
  version_label text,
  licence_class text not null default 'UNVERIFIED' check (licence_class in ('GREEN', 'YELLOW', 'RED', 'UNVERIFIED')),
  commercial_reuse_note text,
  jurisdiction text not null default 'international',
  is_draft_guideline boolean not null default false,
  last_checked date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sources enable row level security;

create table public.topic_references (
  topic_id uuid not null references public.topics (id) on delete cascade,
  source_id uuid not null references public.sources (id),
  citation text,
  pinpoint text,
  independently_written_note text,
  draft_acknowledged boolean not null default false,
  sort integer not null default 0,
  primary key (topic_id, source_id)
);
alter table public.topic_references enable row level security;

create table public.topic_images (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  storage_path text not null check (storage_path !~ '\.\.'),
  alt_text jsonb not null default '{}'::jsonb,
  caption jsonb,
  licence text not null default 'unknown',
  licence_class text not null default 'UNVERIFIED' check (licence_class in ('GREEN', 'YELLOW', 'RED', 'UNVERIFIED')),
  attribution text,
  source_url text,
  is_original boolean not null default false,
  sort integer not null default 0
);
alter table public.topic_images enable row level security;

-- Immutable snapshots. Reviews attach to a specific version, never to the moving working copy.
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  version_no integer not null,
  status public.version_status not null default 'in_review',
  snapshot jsonb not null,
  required_review_roles text[] not null,
  origin public.content_origin not null,
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_at timestamptz not null default now(),
  approved_at timestamptz,
  published_at timestamptz,
  unique (topic_id, version_no)
);
alter table public.content_versions enable row level security;
alter table public.topics add constraint topics_published_version_fk foreign key (published_version_id) references public.content_versions (id);

create table public.review_assignments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.content_versions (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  specialty text not null check (specialty in ('NE','BN','PH','RT','CCP','NEPH','NEURO','IPC','OTHER')),
  assigned_by uuid references auth.users (id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (version_id, reviewer_id, specialty)
);
alter table public.review_assignments enable row level security;

create table public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.content_versions (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id),
  specialty text not null,
  decision public.review_decision not null,
  comments text check (char_length(comments) <= 4000),
  attested_human boolean not null default true check (attested_human),
  reviewed_at timestamptz not null default now(),
  unique (version_id, reviewer_id, specialty)
);
alter table public.content_reviews enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Learner state (private; no cross-user access)
-- ---------------------------------------------------------------------------------------------
create table public.bookmarks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
alter table public.bookmarks enable row level security;

create table public.learning_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  view_count integer not null default 1,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_version_id uuid references public.content_versions (id),
  primary key (user_id, topic_id)
);
create index learning_progress_recent_idx on public.learning_progress (user_id, last_viewed_at desc);
alter table public.learning_progress enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------
create trigger topics_updated before update on public.topics for each row execute function private.set_updated_at();
create trigger topic_sections_updated before update on public.topic_sections for each row execute function private.set_updated_at();
create trigger sources_updated before update on public.sources for each row execute function private.set_updated_at();
create trigger domains_updated before update on public.nursing_domains for each row execute function private.set_updated_at();

create trigger topics_audit after insert or update or delete on public.topics for each row execute function private.audit_row();
create trigger topic_sections_audit after insert or update or delete on public.topic_sections for each row execute function private.audit_row();
create trigger topic_actions_audit after insert or update or delete on public.topic_actions for each row execute function private.audit_row();
create trigger topic_references_audit after insert or update or delete on public.topic_references for each row execute function private.audit_row();
create trigger topic_images_audit after insert or update or delete on public.topic_images for each row execute function private.audit_row();
create trigger sources_audit after insert or update or delete on public.sources for each row execute function private.audit_row();
create trigger content_versions_audit after insert or update or delete on public.content_versions for each row execute function private.audit_row();
create trigger review_assignments_audit after insert or update or delete on public.review_assignments for each row execute function private.audit_row();
create trigger content_reviews_audit after insert or update or delete on public.content_reviews for each row execute function private.audit_row();
create trigger domains_audit after insert or update or delete on public.nursing_domains for each row execute function private.audit_row();

-- Reviews are immutable once recorded.
create or replace function private.reviews_immutable() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'content_reviews are immutable' using errcode = '42501';
end $$;
create trigger content_reviews_no_change before update or delete on public.content_reviews for each row execute function private.reviews_immutable();

-- ---------------------------------------------------------------------------------------------
-- Visibility helpers (SECURITY DEFINER so policies do not recurse)
-- ---------------------------------------------------------------------------------------------
create or replace function private.is_published_topic(p_topic uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.topics where id = p_topic and published_version_id is not null and archived_at is null)
$$;

-- Staff who may read the working copy of a topic.
create or replace function private.can_read_topic(p_topic uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and (
    private.has_staff_role('admin') or private.has_staff_role('publisher')
    or exists (select 1 from public.topics t where t.id = p_topic and t.author_id = auth.uid() and private.has_staff_role('author'))
    or (private.has_staff_role('clinical_reviewer') and exists (
          select 1 from public.review_assignments a join public.content_versions v on v.id = a.version_id
          where v.topic_id = p_topic and a.reviewer_id = auth.uid()))
  )
$$;

-- Working copy may be edited by its author (or an admin) only while in draft / changes requested.
create or replace function private.can_edit_topic(p_topic uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.topics t
    where t.id = p_topic and t.status in ('draft', 'changes_requested') and t.kind = 'clinical'
      and ((t.author_id = auth.uid() and private.has_staff_role('author')) or private.has_staff_role('admin'))
  )
$$;

create or replace function private.can_read_version(p_version uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.content_versions v where v.id = p_version and private.can_read_topic(v.topic_id))
$$;

-- ---------------------------------------------------------------------------------------------
-- Public read surface: ONLY approved, published snapshots (never working copies or drafts).
-- Views are owned by the migration owner (definer semantics) and filter on publication state.
-- ---------------------------------------------------------------------------------------------
create view public.public_topics as
  select t.id, t.slug, d.slug as domain_slug, t.kind, v.version_no, v.published_at,
         t.last_reviewed_at, t.next_review_at, v.snapshot
  from public.topics t
  join public.nursing_domains d on d.id = t.domain_id
  join public.content_versions v on v.id = t.published_version_id
  where t.archived_at is null;

create view public.public_domains as
  select d.id, d.slug, d.sort, d.title, d.summary,
         (select count(*) from public.public_topics p where p.domain_slug = d.slug)::int as topic_count
  from public.nursing_domains d;

-- ---------------------------------------------------------------------------------------------
-- Indexes on foreign keys (join/cascade performance)
-- ---------------------------------------------------------------------------------------------
create index bookmarks_topic_idx on public.bookmarks (topic_id);
create index content_reviews_reviewer_idx on public.content_reviews (reviewer_id);
create index content_versions_submitted_by_idx on public.content_versions (submitted_by);
create index learning_progress_topic_idx on public.learning_progress (topic_id);
create index learning_progress_completed_version_idx on public.learning_progress (completed_version_id);
create index review_assignments_reviewer_idx on public.review_assignments (reviewer_id);
create index review_assignments_assigned_by_idx on public.review_assignments (assigned_by);
create index topic_images_topic_idx on public.topic_images (topic_id);
create index topic_references_source_idx on public.topic_references (source_id);
create index topics_author_idx on public.topics (author_id);

-- ---------------------------------------------------------------------------------------------
-- Learner progress is written only through these functions (server-set timestamps, published topics only).
-- ---------------------------------------------------------------------------------------------
create or replace function public.record_topic_view(p_topic uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'sign in required' using errcode = '42501'; end if;
  if not private.is_published_topic(p_topic) then raise exception 'topic is not published' using errcode = 'P0002'; end if;
  insert into public.learning_progress (user_id, topic_id) values (auth.uid(), p_topic)
  on conflict (user_id, topic_id) do update
    set last_viewed_at = now(), view_count = public.learning_progress.view_count + 1;
end $$;

create or replace function public.set_topic_completion(p_topic uuid, p_completed boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v uuid;
begin
  if auth.uid() is null then raise exception 'sign in required' using errcode = '42501'; end if;
  select published_version_id into v from public.topics where id = p_topic and archived_at is null;
  if v is null then raise exception 'topic is not published' using errcode = 'P0002'; end if;
  insert into public.learning_progress (user_id, topic_id, status, completed_at, completed_version_id)
  values (auth.uid(), p_topic, case when p_completed then 'completed' else 'in_progress' end,
          case when p_completed then now() end, case when p_completed then v end)
  on conflict (user_id, topic_id) do update
    set status = excluded.status, completed_at = excluded.completed_at, completed_version_id = excluded.completed_version_id,
        last_viewed_at = now();
end $$;

-- ---------------------------------------------------------------------------------------------
-- Grants and policies (one policy per role+action, to avoid duplicate permissive evaluation)
-- ---------------------------------------------------------------------------------------------
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function private.is_published_topic(uuid), private.can_read_topic(uuid), private.can_edit_topic(uuid), private.can_read_version(uuid) to authenticated;
grant execute on function public.record_topic_view(uuid), public.set_topic_completion(uuid, boolean) to authenticated;

grant select on public.public_topics, public.public_domains to anon, authenticated;

-- Domains: world-readable; only administrators change them.
grant select on public.nursing_domains to anon, authenticated;
grant insert, update, delete on public.nursing_domains to authenticated;
create policy domains_select_all on public.nursing_domains for select to anon, authenticated using (true);
create policy domains_admin_insert on public.nursing_domains for insert to authenticated with check (private.has_staff_role('admin'));
create policy domains_admin_update on public.nursing_domains for update to authenticated using (private.has_staff_role('admin')) with check (private.has_staff_role('admin'));
create policy domains_admin_delete on public.nursing_domains for delete to authenticated using (private.has_staff_role('admin'));

-- Topics (working copy). Workflow columns (status, published_version_id, kind, ...) are NOT writable via the API.
grant select on public.topics to authenticated;
grant insert (domain_id, slug, title, summary, level, est_minutes, curriculum_id, required_review_roles, jurisdiction_scope, guideline_note, origin)
  on public.topics to authenticated;
grant update (domain_id, slug, title, summary, level, est_minutes, curriculum_id, required_review_roles, jurisdiction_scope, guideline_note, origin)
  on public.topics to authenticated;
grant delete on public.topics to authenticated;
-- The author clause is evaluated on the row itself so INSERT ... RETURNING works (a function that re-queries
-- the table cannot see a row inserted by the same statement).
create policy topics_select on public.topics for select to authenticated
  using ((author_id = (select auth.uid()) and private.has_staff_role('author')) or private.can_read_topic(id));
create policy topics_insert on public.topics for insert to authenticated
  with check (author_id = (select auth.uid()) and (private.has_staff_role('author') or private.has_staff_role('admin')));
create policy topics_update on public.topics for update to authenticated
  using (private.can_edit_topic(id)) with check (private.can_edit_topic(id));
create policy topics_delete on public.topics for delete to authenticated
  using (private.can_edit_topic(id) and published_version_id is null and not exists (select 1 from public.content_versions v where v.topic_id = topics.id));

-- Child tables follow the parent topic's visibility / editability.
grant select, insert, update, delete on public.topic_sections, public.topic_actions, public.topic_references, public.topic_images to authenticated;
create policy sections_select on public.topic_sections for select to authenticated using (private.can_read_topic(topic_id));
create policy sections_insert on public.topic_sections for insert to authenticated with check (private.can_edit_topic(topic_id));
create policy sections_update on public.topic_sections for update to authenticated using (private.can_edit_topic(topic_id)) with check (private.can_edit_topic(topic_id));
create policy sections_delete on public.topic_sections for delete to authenticated using (private.can_edit_topic(topic_id));
create policy actions_select on public.topic_actions for select to authenticated using (private.can_read_topic(topic_id));
create policy actions_insert on public.topic_actions for insert to authenticated with check (private.can_edit_topic(topic_id));
create policy actions_update on public.topic_actions for update to authenticated using (private.can_edit_topic(topic_id)) with check (private.can_edit_topic(topic_id));
create policy actions_delete on public.topic_actions for delete to authenticated using (private.can_edit_topic(topic_id));
create policy refs_select on public.topic_references for select to authenticated using (private.can_read_topic(topic_id));
create policy refs_insert on public.topic_references for insert to authenticated with check (private.can_edit_topic(topic_id));
create policy refs_update on public.topic_references for update to authenticated using (private.can_edit_topic(topic_id)) with check (private.can_edit_topic(topic_id));
create policy refs_delete on public.topic_references for delete to authenticated using (private.can_edit_topic(topic_id));
create policy images_select on public.topic_images for select to authenticated using (private.can_read_topic(topic_id));
create policy images_insert on public.topic_images for insert to authenticated with check (private.can_edit_topic(topic_id));
create policy images_update on public.topic_images for update to authenticated using (private.can_edit_topic(topic_id)) with check (private.can_edit_topic(topic_id));
create policy images_delete on public.topic_images for delete to authenticated using (private.can_edit_topic(topic_id));

-- Sources: staff read; authors/publishers/admins manage.
grant select, insert, update on public.sources to authenticated;
create policy sources_select on public.sources for select to authenticated using (private.is_staff());
create policy sources_insert on public.sources for insert to authenticated
  with check (private.has_staff_role('author') or private.has_staff_role('publisher') or private.has_staff_role('admin'));
create policy sources_update on public.sources for update to authenticated
  using (private.has_staff_role('publisher') or private.has_staff_role('admin'))
  with check (private.has_staff_role('publisher') or private.has_staff_role('admin'));

-- Versions / assignments / reviews: read-only via API (written only by workflow functions).
grant select on public.content_versions, public.review_assignments, public.content_reviews to authenticated;
create policy versions_select on public.content_versions for select to authenticated using (private.can_read_topic(topic_id));
create policy assignments_select on public.review_assignments for select to authenticated
  using (reviewer_id = (select auth.uid()) or private.can_read_version(version_id));
create policy reviews_select on public.content_reviews for select to authenticated using (private.can_read_version(version_id));

-- Learner state: strictly own rows.
grant select, insert, delete on public.bookmarks to authenticated;
create policy bookmarks_select on public.bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy bookmarks_insert on public.bookmarks for insert to authenticated
  with check (user_id = (select auth.uid()) and private.is_published_topic(topic_id));
create policy bookmarks_delete on public.bookmarks for delete to authenticated using (user_id = (select auth.uid()));

grant select on public.learning_progress to authenticated;
create policy progress_select on public.learning_progress for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------------------------
-- Reference data: the ten curriculum domains. Arabic titles are DRAFTS pending terminology review.
-- ---------------------------------------------------------------------------------------------
insert into public.nursing_domains (slug, sort, title, summary) values
 ('respiratory-airway', 1, '{"en":"Respiratory and Airway Management","ar":"التنفس وإدارة الطرق الهوائية"}', '{"en":"Oxygenation, ventilation and airway care."}'),
 ('cardiovascular-hemodynamic', 2, '{"en":"Cardiovascular and Hemodynamic Care","ar":"القلب والأوعية والديناميكا الدموية"}', '{"en":"Rhythm, perfusion, shock and resuscitation."}'),
 ('neurocritical-care', 3, '{"en":"Neurocritical Care","ar":"العناية العصبية الحرجة"}', '{"en":"Neurological assessment, sedation and delirium."}'),
 ('renal-metabolic', 4, '{"en":"Renal and Metabolic Care","ar":"الكلى والاستقلاب"}', '{"en":"Kidney injury, fluids, electrolytes and acid-base."}'),
 ('critical-care-pharmacology', 5, '{"en":"Critical Care Pharmacology","ar":"علم الأدوية في العناية الحرجة"}', '{"en":"Medication classes, monitoring and safe administration."}'),
 ('infection-sepsis', 6, '{"en":"Infection and Sepsis","ar":"العدوى والإنتان"}', '{"en":"Recognition, prevention and infection control."}'),
 ('general-icu-nursing', 7, '{"en":"General ICU Nursing","ar":"تمريض العناية المركزة العام"}', '{"en":"Assessment, comfort, skin, nutrition and mobility."}'),
 ('hematology-transfusion', 8, '{"en":"Hematology and Transfusion","ar":"أمراض الدم ونقل الدم"}', '{"en":"Coagulation, bleeding and blood products."}'),
 ('professional-practice', 9, '{"en":"Professional Nursing Practice","ar":"الممارسة التمريضية المهنية"}', '{"en":"Communication, documentation, ethics and safety."}'),
 ('critical-care-emergencies', 10, '{"en":"Critical Care Emergencies","ar":"الطوارئ في العناية الحرجة"}', '{"en":"Recognising and responding to acute deterioration."}');
