-- Account-owned scenario decision history. The validation helper stays outside the public API.
-- No new grants on learner tables; existing ownership RLS remains authoritative.
begin;
-- Decisions belong to the same owner-protected row as the position and score.
alter table public.working_sessions add column decisions jsonb;
-- Keep null distinct from []: null means history not supplied by the client.
create function private.working_decision_history_valid(history jsonb)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare item jsonb; pos integer; previous integer := 0;
begin
  if history is null then return true; end if;
  if jsonb_typeof(history) <> 'array' then return false; end if;
  if jsonb_array_length(history) > 100 then return false; end if;
  for item in select value from jsonb_array_elements(history) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if not (item ? 'position' and item ? 'choice') or (item - 'position' - 'choice') <> '{}'::jsonb then return false; end if;
    if jsonb_typeof(item->'position') is distinct from 'number' or jsonb_typeof(item->'choice') is distinct from 'number' then return false; end if;
    if (item->>'position') !~ '^[1-9][0-9]{0,2}$' or (item->>'choice') !~ '^[0-3]$' then return false; end if;
    pos := (item->>'position')::integer;
    if pos <= previous then return false; end if;
    previous := pos;
  end loop;
  return true;
end;
$$;
revoke all on function private.working_decision_history_valid(jsonb) from public,anon;
grant execute on function private.working_decision_history_valid(jsonb) to authenticated;
alter table public.working_sessions add constraint working_sessions_decision_history_valid
  check ((kind='scenario' or decisions is null) and private.working_decision_history_valid(decisions));

-- New RPC, not an ambiguous overload. Legacy app versions retain the existing signature.
create function public.working_save_session_v2(p_module_key text,p_kind text,p_version text,p_position integer,p_score integer,p_finished boolean,p_updated_at timestamptz,p_decisions jsonb)
returns void language sql security invoker set search_path='' as $$
 insert into public.working_sessions(user_id,module_key,kind,version,position,score,finished,updated_at,decisions)
 values(auth.uid(),p_module_key,p_kind,p_version,p_position,p_score,p_finished,least(p_updated_at,now()),p_decisions)
 on conflict(user_id,module_key) do update set kind=excluded.kind,version=excluded.version,position=excluded.position,score=excluded.score,finished=excluded.finished,updated_at=excluded.updated_at,decisions=excluded.decisions
 where public.working_sessions.updated_at <= excluded.updated_at;
$$;
revoke all on function public.working_save_session_v2(text,text,text,integer,integer,boolean,timestamptz,jsonb) from public,anon;
grant execute on function public.working_save_session_v2(text,text,text,integer,integer,boolean,timestamptz,jsonb) to authenticated;

-- Legacy saves have no decision history. Clear it whenever a legacy write wins,
-- because even equal positions and scores do not establish identical decisions.
create or replace function public.working_save_session(p_module_key text,p_kind text,p_version text,p_position integer,p_score integer,p_finished boolean,p_updated_at timestamptz)
returns void language sql security invoker set search_path='' as $$
 select public.working_save_session_v2(p_module_key,p_kind,p_version,p_position,p_score,p_finished,p_updated_at,null::jsonb);
$$;
-- Existing ownership RLS, foreign-key cascade, and table privileges are unchanged.
commit;
