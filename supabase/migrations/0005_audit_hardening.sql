-- 0005_audit_hardening.sql
-- Findings from the independent security audit (see docs/SECURITY_AUDIT.md).
--
-- A1 (hardening)  Public definer views gain security_barrier so a caller-supplied predicate can never be evaluated
--                 on unpublished base rows before the view's own filter (error-message side channel).
-- A2 (defence)    Nobody but the owner may create objects in the application schemas (search_path hijack hygiene).
-- A3 (governance) Authors can no longer choose WHO must review their own content: required_review_roles is set only by
--                 a publisher/administrator through set_required_roles().
-- A4 (governance) The source register (licence class, "draft guideline" flag, version label) is curated by
--                 publishers/administrators; authors can only cite existing sources. Previously an author could register
--                 a source as GREEN / not-a-draft and defeat the licence and draft-label checks.

alter view public.public_topics set (security_barrier = true);
alter view public.public_domains set (security_barrier = true);

revoke create on schema public from public, anon, authenticated;
revoke create on schema private from public, anon, authenticated;

-- A3 ---------------------------------------------------------------------------------------------
revoke insert (required_review_roles), update (required_review_roles) on public.topics from authenticated;

create or replace function public.set_required_roles(p_topic uuid, p_roles text[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare t public.topics;
begin
  if auth.uid() is null or not (private.has_staff_role('publisher') or private.has_staff_role('admin')) then
    raise exception 'publisher access with MFA required' using errcode = '42501';
  end if;
  select * into t from public.topics where id = p_topic for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  if t.kind <> 'clinical' or t.status not in ('draft', 'changes_requested') then
    raise exception 'reviewer roles can only be set while a clinical topic is a draft' using errcode = '55000';
  end if;
  if p_roles is null or cardinality(p_roles) < 1 or not (p_roles <@ array['NE','BN','PH','RT','CCP','NEPH','NEURO','IPC','OTHER']) then
    raise exception 'invalid reviewer roles' using errcode = '22023';
  end if;
  update public.topics set required_review_roles = (select array_agg(distinct r order by r) from unnest(p_roles) r) where id = p_topic;
  perform private.write_audit('set_required_roles', 'topic', p_topic::text, jsonb_build_object('roles', p_roles));
end $$;

-- A4 ---------------------------------------------------------------------------------------------
drop policy if exists sources_insert on public.sources;
create policy sources_insert on public.sources for insert to authenticated
  with check (private.has_staff_role('publisher') or private.has_staff_role('admin'));

-- (grant list unchanged for other functions; keep the default-deny posture for the new one)
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.set_required_roles(uuid, text[]) to authenticated;
