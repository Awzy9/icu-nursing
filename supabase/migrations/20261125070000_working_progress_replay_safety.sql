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
commit;
