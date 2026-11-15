-- Phase 10: per-user persistence for the equipment-learning section (bookmarks and viewed diagram parts).
--
-- Scope and safeguards (same pattern as the question bank, study modes, cases and skills):
--   * learners have NO direct table access beyond reading their own rows; every write is a SECURITY DEFINER function that calls private.require_user();
--   * the equipment CONTENT is not stored here (it is bundled, synthetic and nonclinical). Rows may only reference synthetic fixture codes
--     (module_code ~ '^SYN-EQ-[0-9]{3}$' is a CHECK constraint), so no clinical equipment module can be persisted until a later migration adds a gated content table;
--   * fixture isolation: every function refuses (module not found) unless fixtures are visible on a development database, exactly as private.skill_is_visible();
--   * ownership: RLS limits reads to the owner; functions only ever touch auth.uid()'s rows;
--   * ceilings: at most 50 bookmarks per learner and 8 viewed parts per module (200 rows in all).
begin;

create or replace function private.equipment_fixtures_visible() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select question_fixtures_visible and environment = 'development' from public.app_settings limit 1), false)
$$;

create table public.equipment_bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_code text not null check (module_code ~ '^SYN-EQ-[0-9]{3}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, module_code)
);
alter table public.equipment_bookmarks enable row level security;

create table public.equipment_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  module_code text not null check (module_code ~ '^SYN-EQ-[0-9]{3}$'),
  part_id text not null check (part_id ~ '^[a-z]{1,24}$'),
  viewed_at timestamptz not null default now(),
  primary key (user_id, module_code, part_id)
);
alter table public.equipment_progress enable row level security;

-- The learner's whole state in one call. Empty (fixtures = false) when fixtures are not visible.
create or replace function public.eq_state() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if not private.equipment_fixtures_visible() then
    return jsonb_build_object('fixtures', false, 'bookmarks', '[]'::jsonb, 'viewed', '{}'::jsonb);
  end if;
  return jsonb_build_object(
    'fixtures', true,
    'bookmarks', coalesce((select jsonb_agg(module_code order by module_code) from public.equipment_bookmarks where user_id = u), '[]'::jsonb),
    'viewed', coalesce((select jsonb_object_agg(module_code, parts) from (
        select module_code, jsonb_agg(part_id order by viewed_at, part_id) as parts from public.equipment_progress where user_id = u group by module_code) x), '{}'::jsonb));
end $$;

create or replace function public.eq_set_bookmark(p_code text, p_on boolean) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if p_code is null or p_code !~ '^SYN-EQ-[0-9]{3}$' then raise exception 'invalid module' using errcode = '22023'; end if;
  if not private.equipment_fixtures_visible() then raise exception 'module not found' using errcode = 'P0002'; end if;
  if coalesce(p_on, false) then
    if (select count(*) from public.equipment_bookmarks where user_id = u) >= 50 then raise exception 'bookmark limit reached' using errcode = '54000'; end if;
    insert into public.equipment_bookmarks (user_id, module_code) values (u, p_code) on conflict do nothing;
  else
    delete from public.equipment_bookmarks where user_id = u and module_code = p_code;
  end if;
end $$;

create or replace function public.eq_mark_viewed(p_code text, p_part text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if p_code is null or p_code !~ '^SYN-EQ-[0-9]{3}$' or p_part is null or p_part !~ '^[a-z]{1,24}$' then raise exception 'invalid selection' using errcode = '22023'; end if;
  if not private.equipment_fixtures_visible() then raise exception 'module not found' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.equipment_progress where user_id = u and module_code = p_code and part_id = p_part) then
    if (select count(*) from public.equipment_progress where user_id = u and module_code = p_code) >= 8
       or (select count(*) from public.equipment_progress where user_id = u) >= 200 then raise exception 'progress limit reached' using errcode = '54000'; end if;
    insert into public.equipment_progress (user_id, module_code, part_id) values (u, p_code, p_part) on conflict do nothing;
  end if;
end $$;

create or replace function public.eq_reset_progress(p_code text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := private.require_user();
begin
  if p_code is null or p_code !~ '^SYN-EQ-[0-9]{3}$' then raise exception 'invalid module' using errcode = '22023'; end if;
  delete from public.equipment_progress where user_id = u and module_code = p_code;
end $$;

-- Privileges: learners read only their own rows and cannot write directly.
revoke all on public.equipment_bookmarks, public.equipment_progress from public, anon, authenticated;
grant select on public.equipment_bookmarks, public.equipment_progress to authenticated;
create policy equipment_bookmarks_own_read on public.equipment_bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy equipment_progress_own_read on public.equipment_progress for select to authenticated using (user_id = (select auth.uid()));

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.eq_state(), public.eq_set_bookmark(text, boolean), public.eq_mark_viewed(text, text), public.eq_reset_progress(text) to authenticated;

commit;
