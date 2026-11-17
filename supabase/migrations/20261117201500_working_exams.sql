-- Timed, mixed-topic exam mode for the working edition. The exam's content (prompts, options,
-- answers, explanations) stays in the static catalog (content/working-catalog.json) like the rest
-- of the working edition - this table only records which questions were drawn, the time limit, the
-- server-anchored start time, in-progress answers (for resume), and when it was submitted.
begin;
create table public.working_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_ids text[] not null check (array_length(question_ids,1) between 1 and 100),
  time_limit_seconds integer not null check (time_limit_seconds between 60 and 14400),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index working_exams_user_idx on public.working_exams(user_id, created_at desc);
alter table public.working_exams enable row level security;
revoke all on public.working_exams from anon,public;
-- Column-level grants: a learner can start their own exam, but started_at keeps its default (now()) since
-- they are never granted to set it directly - closing off crafting a future started_at via the REST API to
-- extend their own time limit. answers/submitted_at are each writable only through the functions below,
-- which also enforce "not after it was submitted" and "not after time ran out".
grant select on public.working_exams to authenticated;
grant insert (user_id,question_ids,time_limit_seconds) on public.working_exams to authenticated;
grant update (answers) on public.working_exams to authenticated;
grant update (submitted_at) on public.working_exams to authenticated;
create policy working_exams_owner_select on public.working_exams for select to authenticated using ((select auth.uid())=user_id);
create policy working_exams_owner_insert on public.working_exams for insert to authenticated with check ((select auth.uid())=user_id);
create policy working_exams_owner_update on public.working_exams for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function public.working_exam_start(p_question_ids text[],p_time_limit_seconds integer)
returns uuid language sql security invoker set search_path = '' as $$
 insert into public.working_exams(user_id,question_ids,time_limit_seconds) values(auth.uid(),p_question_ids,p_time_limit_seconds) returning id;
$$;
revoke all on function public.working_exam_start(text[],integer) from public,anon;
grant execute on function public.working_exam_start(text[],integer) to authenticated;

create or replace function public.working_exam_answer(p_exam_id uuid,p_question_id text,p_choice smallint)
returns void language plpgsql security invoker set search_path = '' as $$
declare e public.working_exams;
begin
  select * into e from public.working_exams where id=p_exam_id and user_id=auth.uid();
  if not found then raise exception 'exam not found'; end if;
  if e.submitted_at is not null then raise exception 'exam already submitted'; end if;
  if now() > e.started_at + make_interval(secs => e.time_limit_seconds) then raise exception 'time is up'; end if;
  if not (p_question_id = any(e.question_ids)) then raise exception 'question not in this exam'; end if;
  update public.working_exams set answers = jsonb_set(answers, array[p_question_id], to_jsonb(p_choice)) where id=p_exam_id;
end $$;
revoke all on function public.working_exam_answer(uuid,text,smallint) from public,anon;
grant execute on function public.working_exam_answer(uuid,text,smallint) to authenticated;

create or replace function public.working_exam_submit(p_exam_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.working_exams set submitted_at = now() where id=p_exam_id and user_id=auth.uid() and submitted_at is null;
end $$;
revoke all on function public.working_exam_submit(uuid) from public,anon;
grant execute on function public.working_exam_submit(uuid) to authenticated;
commit;
