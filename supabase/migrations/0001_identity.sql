-- 0001_identity.sql
-- Identity, roles, MFA-aware authorization helpers, audit log. Default-deny everywhere.
-- Compatible with Supabase (auth.users, auth.uid(), auth.jwt()). No service-role key is ever
-- required by the application: privileged actions are SECURITY DEFINER functions with explicit checks.

-- ---------------------------------------------------------------------------------------------
-- Default-deny: nothing is granted to API roles unless a migration grants it explicitly.
-- ---------------------------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
-- PostgreSQL grants EXECUTE on new functions to PUBLIC by default; a schema-scoped revoke cannot remove that,
-- so this must be the global form. Every function therefore starts locked down and is granted explicitly.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

create type public.app_role as enum ('learner', 'author', 'clinical_reviewer', 'publisher', 'admin');

-- ---------------------------------------------------------------------------------------------
-- Settings (single row, changed only by a database owner / migration)
-- ---------------------------------------------------------------------------------------------
create table public.app_settings (
  id boolean primary key default true check (id),
  require_staff_mfa boolean not null default true,
  require_distinct_reviewers boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.app_settings default values;
alter table public.app_settings enable row level security;

-- ---------------------------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text check (char_length(display_name) between 1 and 80),
  country text check (country ~ '^[A-Z]{2}$'),
  preferred_locale text not null default 'en' check (preferred_locale ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

-- Reviewer capacities map to CLINICAL_REVIEWER_MATRIX.md role codes.
create table public.reviewer_specialties (
  user_id uuid not null references auth.users (id) on delete cascade,
  specialty text not null check (specialty in ('NE', 'BN', 'PH', 'RT', 'CCP', 'NEPH', 'NEURO', 'IPC', 'OTHER')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, specialty)
);
alter table public.reviewer_specialties enable row level security;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------------------------
-- aal2 means the session completed multi-factor authentication (Supabase JWT claim `aal`).
create or replace function public.is_aal2() returns boolean
language sql stable as $$ select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' $$;

create or replace function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r)
$$;

-- Staff roles additionally require MFA (aal2) when app_settings.require_staff_mfa is true.
create or replace function public.has_staff_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_role(r)
     and (r = 'learner' or not (select require_staff_mfa from public.app_settings) or public.is_aal2())
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.has_staff_role('author') or public.has_staff_role('clinical_reviewer')
      or public.has_staff_role('publisher') or public.has_staff_role('admin')
$$;

-- ---------------------------------------------------------------------------------------------
-- Audit log: append-only, readable by administrators only.
-- ---------------------------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, at desc);
alter table public.audit_log enable row level security;

create or replace function public.audit_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end $$;
create trigger audit_log_no_update before update or delete on public.audit_log for each row execute function public.audit_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log for each statement execute function public.audit_immutable();

create or replace function public.write_audit(p_action text, p_type text, p_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_log (actor, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_type, p_id, coalesce(p_details, '{}'::jsonb))
$$;

-- Generic row-change audit trigger.
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  j jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (actor, action, entity_type, entity_id, details)
  values (
    auth.uid(), tg_op, tg_table_name, coalesce(j ->> 'id', j ->> 'user_id'),
    jsonb_build_object('old', case when tg_op <> 'INSERT' then to_jsonb(old) end,
                       'new', case when tg_op <> 'DELETE' then to_jsonb(new) end)
  );
  return coalesce(new, old);
end $$;

create trigger user_roles_audit after insert or update or delete on public.user_roles for each row execute function public.audit_row();
create trigger reviewer_specialties_audit after insert or update or delete on public.reviewer_specialties for each row execute function public.audit_row();

-- ---------------------------------------------------------------------------------------------
-- New users: profile + learner role. Only display_name is read from user-controlled metadata;
-- roles can NEVER come from metadata.
-- ---------------------------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, display_name, experience_level, country, preferred_locale)
  values (
    new.id,
    lower(new.email),
    nullif(left(btrim(coalesce(m ->> 'display_name', '')), 80), ''),
    case when m ->> 'experience_level' in ('beginner', 'intermediate', 'advanced') then m ->> 'experience_level' end,
    case when m ->> 'country' ~ '^[A-Z]{2}$' then m ->> 'country' end,
    case when m ->> 'preferred_locale' ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$' then m ->> 'preferred_locale' else 'en' end
  );
  insert into public.user_roles (user_id, role) values (new.id, 'learner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Role administration (administrators with MFA only)
-- ---------------------------------------------------------------------------------------------
create or replace function public.admin_grant_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.has_staff_role('admin') then
    raise exception 'administrator access with MFA required' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'unknown user' using errcode = 'P0002';
  end if;
  insert into public.user_roles (user_id, role, granted_by) values (p_user, p_role, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.admin_revoke_role(p_user uuid, p_role public.app_role) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.has_staff_role('admin') then
    raise exception 'administrator access with MFA required' using errcode = '42501';
  end if;
  if p_role = 'learner' then
    raise exception 'the learner role cannot be revoked' using errcode = '22023';
  end if;
  if p_role = 'admin' and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'cannot remove the last administrator' using errcode = '22023';
  end if;
  delete from public.user_roles where user_id = p_user and role = p_role;
end $$;

create or replace function public.admin_set_specialty(p_user uuid, p_specialty text, p_enabled boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.has_staff_role('admin') then
    raise exception 'administrator access with MFA required' using errcode = '42501';
  end if;
  if p_enabled then
    insert into public.reviewer_specialties (user_id, specialty, granted_by) values (p_user, p_specialty, auth.uid()) on conflict do nothing;
  else
    delete from public.reviewer_specialties where user_id = p_user and specialty = p_specialty;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security + grants (default deny; everything below is an explicit allow)
-- ---------------------------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant execute on function public.is_aal2(), public.has_role(public.app_role), public.has_staff_role(public.app_role), public.is_staff() to authenticated;
grant execute on function public.admin_grant_role(uuid, public.app_role), public.admin_revoke_role(uuid, public.app_role), public.admin_set_specialty(uuid, text, boolean) to authenticated;

-- profiles: own row; administrators read all; publishers read profiles of clinical reviewers (for assignment).
grant select on public.profiles to authenticated;
grant update (display_name, country, preferred_locale, experience_level) on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select to authenticated using (public.has_staff_role('admin'));
create policy profiles_select_publisher_reviewers on public.profiles for select to authenticated
  using (public.has_staff_role('publisher') and exists (select 1 from public.user_roles r where r.user_id = profiles.id and r.role = 'clinical_reviewer'));
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- user_roles / reviewer_specialties: read-only through the API; changes only via admin functions.
grant select on public.user_roles, public.reviewer_specialties to authenticated;
create policy roles_select_own on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy roles_select_admin on public.user_roles for select to authenticated using (public.has_staff_role('admin'));
create policy specialties_select_own on public.reviewer_specialties for select to authenticated using (user_id = auth.uid());
create policy specialties_select_staff on public.reviewer_specialties for select to authenticated
  using (public.has_staff_role('admin') or public.has_staff_role('publisher'));

-- audit_log: administrators read; nobody writes through the API.
grant select on public.audit_log to authenticated;
create policy audit_select_admin on public.audit_log for select to authenticated using (public.has_staff_role('admin'));

-- app_settings: no API access at all (read inside SECURITY DEFINER helpers only).
