-- Replay safety for account-owned learning rows. No new privileges or tables.
-- Preserve the existing timestamp clamp for older clients. Clients that retry
-- must retain the original event time and must not send a future timestamp:
-- the legacy clamp is not a stable idempotency key for future-dated events.
begin;

create or replace function public.working_record_attempt(p_question_id text,p_module_key text,p_choice smallint,p_correct boolean,p_answered_at timestamptz)
returns void language sql security invoker set search_path='' as $$
 insert into public.working_attempts as current_attempt(user_id,question_id,module_key,choice,correct,answered_at,box)
 values(auth.uid(),p_question_id,p_module_key,p_choice,p_correct,least(p_answered_at,now()),private.leitner_next_box(1,p_correct))
 on conflict(user_id,question_id) do update
 set module_key=excluded.module_key,choice=excluded.choice,correct=excluded.correct,answered_at=excluded.answered_at,
     box=private.leitner_next_box(current_attempt.box,excluded.correct)
 where current_attempt.answered_at < excluded.answered_at;
$$;

-- First accepted event wins timestamp ties; an equal-time legacy request must
-- not replace a newer client's decision history. The conflict update evaluates
-- against the locked current row rather than a separate pre-read.
create or replace function public.working_save_session_v2(p_module_key text,p_kind text,p_version text,p_position integer,p_score integer,p_finished boolean,p_updated_at timestamptz,p_decisions jsonb)
returns void language sql security invoker set search_path='' as $$
 insert into public.working_sessions as current_session(user_id,module_key,kind,version,position,score,finished,updated_at,decisions)
 values(auth.uid(),p_module_key,p_kind,p_version,p_position,p_score,p_finished,least(p_updated_at,now()),p_decisions)
 on conflict(user_id,module_key) do update
 set kind=excluded.kind,version=excluded.version,position=excluded.position,score=excluded.score,finished=excluded.finished,updated_at=excluded.updated_at,decisions=excluded.decisions
 where current_session.updated_at < excluded.updated_at;
$$;

-- Existing grants, owner RLS, and the legacy wrapper are unchanged.
-- Account-bound replay endpoint. A change of authenticated user between the
-- device's queue read and the RPC call must fail on the database itself.
-- Returns false only for future events; they remain queued without clamping.
create function public.working_replay_event(p_expected_user uuid,p_event jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare
  event_at timestamptz;
  event_kind text;
  module_key text;
begin
  if auth.uid() is null or p_expected_user is distinct from auth.uid() then
    raise exception 'Account mismatch' using errcode='42501';
  end if;
  if jsonb_typeof(p_event) is distinct from 'object' then
    raise exception 'Invalid event' using errcode='22023';
  end if;
  event_kind := p_event->>'kind';
  module_key := p_event->>'moduleKey';
  if module_key is null or module_key !~ '^[A-Z0-9-]{1,40}$'
     or jsonb_typeof(p_event->'at') is distinct from 'number'
     or (p_event->>'at') !~ '^[0-9]{1,16}$'
     or (p_event->>'at')::numeric > 8640000000000000 then
    raise exception 'Invalid replay event' using errcode='22023';
  end if;
  event_at := to_timestamp((p_event->>'at')::double precision / 1000);
  if event_at > now() then return false; end if;

  if event_kind = 'answer' then
    if coalesce(p_event->>'questionId','') !~ '^[A-Z0-9-]{1,60}$'
       or jsonb_typeof(p_event->'choice') is distinct from 'number'
       or coalesce(p_event->>'choice','') !~ '^[0-3]$'
       or jsonb_typeof(p_event->'correct') is distinct from 'boolean' then
      raise exception 'Invalid answer event' using errcode='22023';
    end if;
    perform public.working_record_attempt(p_event->>'questionId',module_key,(p_event->>'choice')::smallint,(p_event->>'correct')::boolean,event_at);
  elsif event_kind = 'checkpoint' then
    if coalesce(p_event->>'sessionKind','') not in ('quiz','scenario')
       or char_length(coalesce(p_event->>'version','')) not between 1 and 2000
       or jsonb_typeof(p_event->'position') is distinct from 'number'
       or coalesce(p_event->>'position','') !~ '^[0-9]{1,10}$'
       or jsonb_typeof(p_event->'score') is distinct from 'number'
       or coalesce(p_event->>'score','') !~ '^[0-9]{1,10}$'
       or jsonb_typeof(p_event->'finished') is distinct from 'boolean'
       or (p_event ? 'decisions' and (p_event->>'sessionKind' <> 'scenario' or jsonb_typeof(p_event->'decisions') <> 'array')) then
      raise exception 'Invalid checkpoint event' using errcode='22023';
    end if;
    perform public.working_save_session_v2(module_key,p_event->>'sessionKind',p_event->>'version',(p_event->>'position')::integer,(p_event->>'score')::integer,(p_event->>'finished')::boolean,event_at,p_event->'decisions');
  elsif event_kind = 'dismiss' then
    -- A finished marker preserves the timestamp even if there was no row yet.
    -- The existing learners' resume code ignores finished rows. No choices
    -- or previous score are retained in the dismissal marker.
    perform public.working_save_session_v2(module_key,'quiz','dismissed-v1',0,0,true,event_at,null::jsonb);
  else
    raise exception 'Invalid event kind' using errcode='22023';
  end if;
  return true;
end;
$$;
revoke all on function public.working_replay_event(uuid,jsonb) from public,anon;
grant execute on function public.working_replay_event(uuid,jsonb) to authenticated;

-- Compatibility for already-installed clients that DELETE an existing session.
-- Only owner-authorized API deletes are converted. Administrative deletion and
-- account FK cascades retain normal hard-delete semantics. This cannot create a
-- marker for a legacy DELETE matching zero rows; updated clients use the RPC.
create function private.working_legacy_session_dismiss()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if current_user = 'authenticated' and auth.uid() = old.user_id then
    update public.working_sessions
       set kind='quiz', version='dismissed-v1', position=0, score=0,
           finished=true, decisions=null,
           updated_at=greatest(old.updated_at + interval '1 millisecond', clock_timestamp())
     where user_id=old.user_id and module_key=old.module_key;
    return null;
  end if;
  return old;
end;
$$;
revoke all on function private.working_legacy_session_dismiss() from public,anon,authenticated;
create trigger working_legacy_session_dismiss before delete on public.working_sessions
for each row execute function private.working_legacy_session_dismiss();

commit;
