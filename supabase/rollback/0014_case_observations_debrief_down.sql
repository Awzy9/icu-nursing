-- MANUAL ROLLBACK for 0014: restores the 0009 cs_get and case_item_frozen definitions and drops the new columns (authored observations, consequences and debriefs are lost).
begin;
alter table public.case_steps drop constraint if exists case_steps_observations_ok;
drop function if exists private.case_observations_ok(jsonb);
alter table public.case_steps drop column if exists observations;
alter table public.case_option_keys drop column if exists consequence;
alter table public.case_items drop column if exists debrief;
create or replace function private.case_item_frozen() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'published' and (new.title is distinct from old.title or new.vignette is distinct from old.vignette or new.kind is distinct from old.kind
       or new.domain_id is distinct from old.domain_id or new.version is distinct from old.version or new.code is distinct from old.code) then
    raise exception 'a published case is immutable; retire it and publish a new version' using errcode = '55000';
  end if;
  return new;
end $$;
-- cs_get: re-run the definition of public.cs_get from supabase/migrations/0009_cases.sql after this script.
commit;
