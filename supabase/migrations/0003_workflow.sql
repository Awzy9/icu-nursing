-- 0003_workflow.sql
-- Clinical publication workflow, enforced in the database:
--   DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED   (+ CHANGES_REQUESTED, ARCHIVED, ROLLBACK)
-- Only these SECURITY DEFINER functions can change workflow state. API roles have no write access to
-- status / published_version_id / content_versions / content_reviews (see 0002 grants).
--
-- Invariants:
--  * A version is approved ONLY by record_review(), called by an assigned human clinical reviewer
--    with MFA, who is not the author, covering every required reviewer role.
--  * AI-assisted/generated content needs at least two distinct approving reviewers, regardless of settings.
--  * A topic is published only from an approved version, by a publisher/admin with MFA.
--  * Draft guidelines can be cited only when explicitly acknowledged (they are then labelled as drafts).
--  * Learners only ever read the immutable published snapshot, never the working copy.

create or replace function public._require_role(p_role public.app_role) returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null or not public.has_staff_role(p_role) then
    raise exception '% access with MFA required', p_role using errcode = '42501';
  end if;
end $$;

-- Builds the immutable snapshot that learners will read.
create or replace function public._topic_snapshot(p_topic uuid) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'title', t.title, 'summary', t.summary, 'level', t.level, 'est_minutes', t.est_minutes,
    'guideline_note', t.guideline_note, 'origin', t.origin, 'jurisdiction_scope', t.jurisdiction_scope,
    'sections', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'sort', s.sort, 'title', s.title, 'body', s.body) order by s.sort, s.id)
                          from public.topic_sections s where s.topic_id = t.id), '[]'::jsonb),
    'actions', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'scope', a.scope, 'text', a.text,
                          'institutional_protocol_required', a.institutional_protocol_required, 'jurisdiction_note', a.jurisdiction_note, 'sort', a.sort) order by a.sort, a.id)
                         from public.topic_actions a where a.topic_id = t.id), '[]'::jsonb),
    'references', coalesce((select jsonb_agg(jsonb_build_object('organization', so.organization, 'title', so.title, 'url', so.url,
                          'version_label', so.version_label, 'is_draft_guideline', so.is_draft_guideline, 'last_checked', so.last_checked,
                          'citation', r.citation, 'pinpoint', r.pinpoint, 'independently_written_note', r.independently_written_note) order by r.sort, so.organization)
                            from public.topic_references r join public.sources so on so.id = r.source_id where r.topic_id = t.id), '[]'::jsonb),
    'images', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'storage_path', i.storage_path, 'alt_text', i.alt_text, 'caption', i.caption,
                          'licence', i.licence, 'attribution', i.attribution) order by i.sort, i.id)
                        from public.topic_images i where i.topic_id = t.id), '[]'::jsonb),
    'reviewer_roles', '[]'::jsonb
  ) from public.topics t where t.id = p_topic
$$;

-- Lists everything that blocks submission (empty array = ready). Used by the editor UI.
create or replace function public.validate_topic_for_review(p_topic uuid) returns text[]
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  t public.topics;
  problems text[] := '{}';
begin
  select * into t from public.topics where id = p_topic;
  if not found or not public.can_read_topic(p_topic) then
    raise exception 'topic not found' using errcode = 'P0002';
  end if;
  if btrim(coalesce(t.title ->> 'en', '')) = '' then problems := array_append(problems, 'English title is required'); end if;
  if btrim(coalesce(t.summary ->> 'en', '')) = '' then problems := array_append(problems, 'English summary is required'); end if;
  if not exists (select 1 from public.topic_sections where topic_id = p_topic and kind = 'objectives' and btrim(body ->> 'en') <> '') then
    problems := array_append(problems, 'A learning objectives section is required');
  end if;
  if exists (select 1 from public.topic_sections where topic_id = p_topic and btrim(coalesce(body ->> 'en', '')) = '') then
    problems := array_append(problems, 'Every section needs English text');
  end if;
  if not exists (select 1 from public.topic_references where topic_id = p_topic) then
    problems := array_append(problems, 'At least one reference is required');
  end if;
  if exists (select 1 from public.topic_references r join public.sources s on s.id = r.source_id
             where r.topic_id = p_topic and s.is_draft_guideline and not r.draft_acknowledged) then
    problems := array_append(problems, 'A draft guideline is cited without acknowledging that it is a draft (it must be labelled as not final)');
  end if;
  if exists (select 1 from public.topic_references r join public.sources s on s.id = r.source_id
             where r.topic_id = p_topic and s.licence_class = 'RED' and coalesce(btrim(r.independently_written_note), '') = '') then
    problems := array_append(problems, 'A RED-licensed source is cited without an "independently written" note');
  end if;
  if exists (select 1 from public.topic_images where topic_id = p_topic and btrim(coalesce(alt_text ->> 'en', '')) = '') then
    problems := array_append(problems, 'Every image needs English alt text');
  end if;
  if exists (select 1 from public.topic_images where topic_id = p_topic and not is_original
             and (lower(btrim(licence)) in ('', 'unknown') or licence_class in ('RED', 'UNVERIFIED'))) then
    problems := array_append(problems, 'Every non-original image needs a verified, reusable licence');
  end if;
  if t.origin in ('ai_assisted', 'ai_generated') and cardinality(t.required_review_roles) < 2 then
    problems := array_append(problems, 'AI-assisted content requires at least two reviewer roles');
  end if;
  return problems;
end $$;

create or replace function public.submit_for_review(p_topic uuid) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.topics;
  problems text[];
  vno integer;
  vid uuid;
begin
  select * into t from public.topics where id = p_topic for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  if not ((t.author_id = auth.uid() and public.has_staff_role('author')) or public.has_staff_role('admin')) then
    raise exception 'only the author (with MFA) or an administrator can submit this topic' using errcode = '42501';
  end if;
  if t.kind <> 'clinical' then raise exception 'demonstration content cannot enter clinical review' using errcode = '22023'; end if;
  if t.status not in ('draft', 'changes_requested') then
    raise exception 'topic is % and cannot be submitted', t.status using errcode = '55000';
  end if;
  problems := public.validate_topic_for_review(p_topic);
  if cardinality(problems) > 0 then
    raise exception 'topic is not ready for review: %', array_to_string(problems, '; ') using errcode = '22023';
  end if;
  select coalesce(max(version_no), 0) + 1 into vno from public.content_versions where topic_id = p_topic;
  insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin, submitted_by)
  values (p_topic, vno, 'in_review', public._topic_snapshot(p_topic), t.required_review_roles, t.origin, auth.uid())
  returning id into vid;
  update public.topics set status = 'in_review' where id = p_topic;
  perform public.write_audit('submit_for_review', 'topic', p_topic::text, jsonb_build_object('version_id', vid, 'version_no', vno));
  return vid;
end $$;

create or replace function public.withdraw_submission(p_topic uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.topics;
begin
  select * into t from public.topics where id = p_topic for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  if not ((t.author_id = auth.uid() and public.has_staff_role('author')) or public.has_staff_role('admin')) then
    raise exception 'only the author (with MFA) or an administrator can withdraw' using errcode = '42501';
  end if;
  if t.status <> 'in_review' then raise exception 'topic is not in review' using errcode = '55000'; end if;
  update public.content_versions set status = 'withdrawn' where topic_id = p_topic and status = 'in_review';
  update public.topics set status = 'draft' where id = p_topic;
  perform public.write_audit('withdraw_submission', 'topic', p_topic::text);
end $$;

create or replace function public.assign_reviewer(p_version uuid, p_reviewer uuid, p_specialty text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.content_versions;
  t public.topics;
  aid uuid;
begin
  if auth.uid() is null or not (public.has_staff_role('publisher') or public.has_staff_role('admin')) then
    raise exception 'publisher access with MFA required' using errcode = '42501';
  end if;
  select * into v from public.content_versions where id = p_version for update;
  if not found then raise exception 'version not found' using errcode = 'P0002'; end if;
  select * into t from public.topics where id = v.topic_id;
  if v.status <> 'in_review' then raise exception 'version is not in review' using errcode = '55000'; end if;
  if not (p_specialty = any (v.required_review_roles)) then
    raise exception 'role % is not required for this version', p_specialty using errcode = '22023';
  end if;
  if p_reviewer = t.author_id or p_reviewer = v.submitted_by then
    raise exception 'an author cannot review their own content' using errcode = '22023';
  end if;
  if not exists (select 1 from public.user_roles where user_id = p_reviewer and role = 'clinical_reviewer') then
    raise exception 'user is not a clinical reviewer' using errcode = '22023';
  end if;
  if not exists (select 1 from public.reviewer_specialties where user_id = p_reviewer and specialty = p_specialty) then
    raise exception 'reviewer does not hold the % specialty', p_specialty using errcode = '22023';
  end if;
  insert into public.review_assignments (version_id, reviewer_id, specialty, assigned_by)
  values (p_version, p_reviewer, p_specialty, auth.uid())
  on conflict (version_id, reviewer_id, specialty) do update set assigned_by = excluded.assigned_by
  returning id into aid;
  perform public.write_audit('assign_reviewer', 'topic', v.topic_id::text, jsonb_build_object('version_id', p_version, 'reviewer', p_reviewer, 'specialty', p_specialty));
  return aid;
end $$;

-- Recomputes a version's state after a review is recorded.
create or replace function public._evaluate_version(p_version uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.content_versions;
  approved_roles text[];
  n_reviewers integer;
begin
  select * into v from public.content_versions where id = p_version for update;
  if v.status <> 'in_review' then return; end if;

  if exists (select 1 from public.content_reviews where version_id = p_version and decision = 'reject') then
    update public.content_versions set status = 'rejected' where id = p_version;
    update public.topics set status = 'changes_requested' where id = v.topic_id and status = 'in_review';
  elsif exists (select 1 from public.content_reviews where version_id = p_version and decision = 'request_changes') then
    update public.content_versions set status = 'changes_requested' where id = p_version;
    update public.topics set status = 'changes_requested' where id = v.topic_id and status = 'in_review';
  else
    select array_agg(distinct specialty), count(distinct reviewer_id) into approved_roles, n_reviewers
      from public.content_reviews where version_id = p_version and decision = 'approve';
    if approved_roles is not null
       and v.required_review_roles <@ approved_roles
       and (not (select require_distinct_reviewers from public.app_settings) or n_reviewers >= cardinality(v.required_review_roles))
       and (v.origin = 'human' or n_reviewers >= 2) then
      update public.content_versions set status = 'approved', approved_at = now() where id = p_version;
      update public.topics set status = 'approved' where id = v.topic_id and status = 'in_review';
    end if;
  end if;
end $$;

create or replace function public.record_review(p_version uuid, p_specialty text, p_decision public.review_decision, p_comments text default null) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v public.content_versions;
  t public.topics;
  rid uuid;
begin
  if auth.uid() is null or not public.has_staff_role('clinical_reviewer') then
    raise exception 'clinical reviewer access with MFA required' using errcode = '42501';
  end if;
  select * into v from public.content_versions where id = p_version for update;
  if not found then raise exception 'version not found' using errcode = 'P0002'; end if;
  select * into t from public.topics where id = v.topic_id;
  if not exists (select 1 from public.review_assignments where version_id = p_version and reviewer_id = auth.uid() and specialty = p_specialty) then
    raise exception 'you are not assigned to review this version as %', p_specialty using errcode = '42501';
  end if;
  if auth.uid() = t.author_id or auth.uid() = v.submitted_by then
    raise exception 'an author cannot review their own content' using errcode = '42501';
  end if;
  if v.status <> 'in_review' then raise exception 'version is not in review' using errcode = '55000'; end if;
  if p_decision <> 'approve' and btrim(coalesce(p_comments, '')) = '' then
    raise exception 'comments are required when requesting changes or rejecting' using errcode = '22023';
  end if;
  insert into public.content_reviews (version_id, reviewer_id, specialty, decision, comments)
  values (p_version, auth.uid(), p_specialty, p_decision, p_comments)
  returning id into rid;
  perform public._evaluate_version(p_version);
  perform public.write_audit('record_review', 'topic', v.topic_id::text, jsonb_build_object('version_id', p_version, 'specialty', p_specialty, 'decision', p_decision));
  return rid;
end $$;

create or replace function public.publish_topic(p_topic uuid, p_version uuid, p_review_months integer default 12) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.topics;
  v public.content_versions;
  roles jsonb;
begin
  perform public._require_role('publisher');
  select * into t from public.topics where id = p_topic for update;
  select * into v from public.content_versions where id = p_version and topic_id = p_topic for update;
  if t.id is null or v.id is null then raise exception 'topic or version not found' using errcode = 'P0002'; end if;
  if t.kind <> 'clinical' then raise exception 'demonstration content cannot be published here' using errcode = '22023'; end if;
  if v.status <> 'approved' or t.status <> 'approved' then
    raise exception 'only an approved version can be published (version is %, topic is %)', v.status, t.status using errcode = '55000';
  end if;
  if p_review_months not between 1 and 36 then raise exception 'review interval must be 1-36 months' using errcode = '22023'; end if;
  select coalesce(jsonb_agg(distinct specialty), '[]'::jsonb) into roles from public.content_reviews where version_id = p_version and decision = 'approve';
  if t.published_version_id is not null then
    update public.content_versions set status = 'superseded' where id = t.published_version_id;
  end if;
  update public.content_versions set status = 'published', published_at = now(), snapshot = snapshot || jsonb_build_object('reviewer_roles', roles) where id = p_version;
  update public.topics set published_version_id = p_version, status = 'published', archived_at = null,
         first_published_at = coalesce(first_published_at, now()),
         last_reviewed_at = (select max(reviewed_at) from public.content_reviews where version_id = p_version),
         next_review_at = now() + make_interval(months => p_review_months)
   where id = p_topic;
  perform public.write_audit('publish', 'topic', p_topic::text, jsonb_build_object('version_id', p_version, 'version_no', v.version_no));
end $$;

-- Start a new revision of a published topic. The live version stays visible until the new one is approved and published.
create or replace function public.start_revision(p_topic uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.topics;
begin
  select * into t from public.topics where id = p_topic for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  if not ((t.author_id = auth.uid() and public.has_staff_role('author')) or public.has_staff_role('admin')) then
    raise exception 'only the author (with MFA) or an administrator can revise' using errcode = '42501';
  end if;
  if t.status <> 'published' or t.kind <> 'clinical' then raise exception 'only a published clinical topic can be revised' using errcode = '55000'; end if;
  update public.topics set status = 'draft' where id = p_topic;
  perform public.write_audit('start_revision', 'topic', p_topic::text);
end $$;

create or replace function public.rollback_topic(p_topic uuid, p_version uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  t public.topics;
  v public.content_versions;
begin
  perform public._require_role('publisher');
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then raise exception 'a reason of at least 10 characters is required' using errcode = '22023'; end if;
  select * into t from public.topics where id = p_topic for update;
  select * into v from public.content_versions where id = p_version and topic_id = p_topic for update;
  if t.id is null or v.id is null then raise exception 'topic or version not found' using errcode = 'P0002'; end if;
  if v.status <> 'superseded' or v.published_at is null then
    raise exception 'only a previously published (superseded) version can be restored' using errcode = '55000';
  end if;
  if t.published_version_id is not null then
    update public.content_versions set status = 'superseded' where id = t.published_version_id;
  end if;
  update public.content_versions set status = 'published' where id = p_version;
  update public.topics set published_version_id = p_version, archived_at = null where id = p_topic;
  perform public.write_audit('rollback', 'topic', p_topic::text, jsonb_build_object('to_version', v.version_no, 'reason', p_reason));
end $$;

create or replace function public.archive_topic(p_topic uuid, p_reason text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._require_role('publisher');
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then raise exception 'a reason of at least 10 characters is required' using errcode = '22023'; end if;
  update public.topics set archived_at = now(), status = 'archived' where id = p_topic;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  perform public.write_audit('archive', 'topic', p_topic::text, jsonb_build_object('reason', p_reason));
end $$;

create or replace function public.restore_topic(p_topic uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.topics;
begin
  perform public._require_role('admin');
  select * into t from public.topics where id = p_topic for update;
  if not found or t.status <> 'archived' then raise exception 'topic is not archived' using errcode = '55000'; end if;
  update public.topics set archived_at = null, status = case when published_version_id is not null then 'published'::public.content_status else 'draft'::public.content_status end where id = p_topic;
  perform public.write_audit('restore', 'topic', p_topic::text);
end $$;

grant execute on function
  public.validate_topic_for_review(uuid), public.submit_for_review(uuid), public.withdraw_submission(uuid),
  public.assign_reviewer(uuid, uuid, text), public.record_review(uuid, text, public.review_decision, text),
  public.publish_topic(uuid, uuid, integer), public.start_revision(uuid), public.rollback_topic(uuid, uuid, text),
  public.archive_topic(uuid, text), public.restore_topic(uuid)
to authenticated;

-- Internal helpers: never callable through the API (defence in depth on top of the default-deny above).
revoke all on function public._require_role(public.app_role), public._topic_snapshot(uuid), public._evaluate_version(uuid) from public, anon, authenticated;
