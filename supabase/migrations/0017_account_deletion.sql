-- Phase 12: learner-initiated account deletion.
--
-- Data review (from the live schema, see docs/phase12/ACCOUNT_DELETION_DESIGN.md):
--   * every learner table (profiles, bookmarks, learning_progress, quiz_*, learner_*, question_bookmarks, case_attempt*, skill_bookmarks, skill_sessions/items,
--     medication_bookmarks, equipment_*) references auth.users ON DELETE CASCADE, so deleting the auth user erases the learner's personal data;
--   * staff-authored records (topics, versions, content items, draft notes) reference the user ON DELETE SET NULL: the content survives, the author link is removed;
--   * public.content_reviews.reviewer_id is NO ACTION: clinical review records are accountability records and are RETAINED, so accounts that hold them are refused;
--   * public.audit_log.actor and storage.objects.owner have no foreign key; the audit log is append-only by design.
--
-- Safeguards in public.delete_my_account():
--   * acts only on auth.uid(): there is no user-id parameter, so another person's account cannot be addressed;
--   * recent authentication: the newest authentication-method timestamp in the JWT (amr) must be within 10 minutes, else 'recent sign-in required';
--   * a user with a verified second factor must be at aal2;
--   * the caller must type their own email address (case-insensitive);
--   * accounts holding any staff role (author, clinical_reviewer, publisher, admin) are refused: roles are removed by an administrator first, which also protects the last administrator;
--   * accounts with retained clinical review records are refused;
--   * the audit entry has NO actor, NO email and NO name, only a one-way hash of the id, the method and the time.
begin;

create or replace function private.seconds_since_authentication() returns bigint
language plpgsql stable set search_path = '' as $$
declare newest bigint;
begin
  select max((a ->> 'timestamp')::bigint) into newest
  from jsonb_array_elements(case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end) a
  where jsonb_typeof(a) = 'object' and (a ->> 'timestamp') ~ '^[0-9]{9,12}$';
  if newest is null then return null; end if;
  return extract(epoch from now())::bigint - newest;
end $$;

-- The generic row audit would record the cascaded deletion of the learner's own role rows with their user id. During self-service deletion that entry is
-- suppressed (the single account_deleted entry below is the record); every other deletion, including an administrator revoking a role, is audited as before.
create or replace function private.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  j jsonb := to_jsonb(coalesce(new, old));
begin
  if tg_op = 'DELETE' and tg_table_name in ('user_roles', 'reviewer_specialties') and coalesce(current_setting('app.account_deletion', true), '') = 'on' then
    return old;
  end if;
  insert into public.audit_log (actor, action, entity_type, entity_id, details)
  values (
    auth.uid(), tg_op, tg_table_name, coalesce(j ->> 'id', j ->> 'user_id'),
    jsonb_build_object('old', case when tg_op <> 'INSERT' then to_jsonb(old) end,
                       'new', case when tg_op <> 'DELETE' then to_jsonb(new) end)
  );
  return coalesce(new, old);
end $$;

create or replace function public.delete_my_account(p_email text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  u uuid := auth.uid();
  mail text;
  age bigint;
  has_factor boolean := false;
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;

  age := private.seconds_since_authentication();
  if age is null or age < -60 or age > 600 then raise exception 'recent sign-in required' using errcode = '28000'; end if;

  if to_regclass('auth.mfa_factors') is not null then
    execute 'select exists (select 1 from auth.mfa_factors where user_id = $1 and status = ''verified'')' into has_factor using u;
    if has_factor and not private.is_aal2() then raise exception 'second-factor verification required' using errcode = '28000'; end if;
  end if;

  select email into mail from auth.users where id = u;
  if mail is null or p_email is null or lower(btrim(p_email)) <> lower(mail) then raise exception 'confirmation does not match' using errcode = '22023'; end if;

  if exists (select 1 from public.user_roles where user_id = u and role <> 'learner') then
    raise exception 'staff accounts are removed by an administrator after their roles are revoked' using errcode = '55000';
  end if;
  if exists (select 1 from public.content_reviews where reviewer_id = u) then
    raise exception 'this account holds retained clinical review records; contact an administrator' using errcode = '55000';
  end if;

  -- Audit without personal data: no actor, no email, no name.
  insert into public.audit_log (actor, action, entity_type, entity_id, details)
  values (null, 'account_deleted', 'account', substr(encode(sha256(convert_to(u::text, 'UTF8')), 'hex'), 1, 16), jsonb_build_object('method', 'self_service'));

  -- Cascades erase the learner's rows; auth sessions and refresh tokens are removed with the user, which revokes every session.
  perform set_config('app.account_deletion', 'on', true);
  delete from auth.users where id = u;
  return jsonb_build_object('deleted', true);
end $$;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.delete_my_account(text) to authenticated;

commit;
