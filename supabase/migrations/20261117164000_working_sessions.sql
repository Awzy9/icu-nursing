-- Resumable quiz/scenario sessions for the working edition. One row per (user, module): position,
-- running score, and whether it finished. Individual question answers are already durable in
-- working_attempts; this table only remembers *where in the module* to resume, so content changes
-- (a new catalog build) can be detected via `version` and never silently misapplied to a stale position.
begin;
create table public.working_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null check (module_key ~ '^[A-Z0-9-]{1,40}$'),
  kind text not null check (kind in ('quiz','scenario')),
  version text not null check (char_length(version) between 1 and 2000),
  position integer not null check (position >= 0),
  score integer not null default 0 check (score >= 0),
  finished boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,module_key)
);
alter table public.working_sessions enable row level security;
revoke all on public.working_sessions from anon,public;
grant select,insert,update,delete on public.working_sessions to authenticated;
create policy working_sessions_owner on public.working_sessions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- An older offline retry must not revive a module past where a more recent save already left it.
create function public.working_save_session(p_module_key text,p_kind text,p_version text,p_position integer,p_score integer,p_finished boolean,p_updated_at timestamptz)
returns void language sql security invoker set search_path='' as $$
 insert into public.working_sessions(user_id,module_key,kind,version,position,score,finished,updated_at)
 values(auth.uid(),p_module_key,p_kind,p_version,p_position,p_score,p_finished,least(p_updated_at,now()))
 on conflict(user_id,module_key) do update set kind=excluded.kind,version=excluded.version,position=excluded.position,score=excluded.score,finished=excluded.finished,updated_at=excluded.updated_at
 where public.working_sessions.updated_at <= excluded.updated_at;
$$;
revoke all on function public.working_save_session(text,text,text,integer,integer,boolean,timestamptz) from public,anon;
grant execute on function public.working_save_session(text,text,text,integer,integer,boolean,timestamptz) to authenticated;
commit;
