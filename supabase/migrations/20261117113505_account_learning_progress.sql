-- Account-owned working-edition learning. Self-study records are not competency certification.
begin;
create table public.working_attempts (
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null check (question_id ~ '^[A-Z0-9-]{1,60}$'),
 module_key text not null check (module_key ~ '^[A-Z0-9-]{1,40}$'),
 choice smallint not null check (choice between 0 and 3),
 correct boolean not null,
 answered_at timestamptz not null default now(),
 primary key(user_id,question_id)
);
create table public.working_bookmarks (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_key text not null check (module_key ~ '^[A-Z0-9-]{1,40}$'),
 created_at timestamptz not null default now(),
 primary key(user_id,module_key)
);
create table public.working_lessons (
 user_id uuid not null references auth.users(id) on delete cascade,
 module_key text not null check (module_key ~ '^[A-Z0-9-]{1,40}$'),
 completed boolean not null default false,
 updated_at timestamptz not null default now(),
 primary key(user_id,module_key)
);
alter table public.working_attempts enable row level security;
alter table public.working_bookmarks enable row level security;
alter table public.working_lessons enable row level security;
revoke all on public.working_attempts,public.working_bookmarks,public.working_lessons from anon,public;
grant select,insert,update,delete on public.working_attempts,public.working_bookmarks,public.working_lessons to authenticated;
create policy working_attempts_owner on public.working_attempts for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy working_bookmarks_owner on public.working_bookmarks for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy working_lessons_owner on public.working_lessons for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- An older offline retry must not replace a more recent answer from another device.
create function public.working_record_attempt(p_question_id text,p_module_key text,p_choice smallint,p_correct boolean,p_answered_at timestamptz)
returns void language sql security invoker set search_path='' as $$
 insert into public.working_attempts(user_id,question_id,module_key,choice,correct,answered_at)
 values(auth.uid(),p_question_id,p_module_key,p_choice,p_correct,least(p_answered_at,now()))
 on conflict(user_id,question_id) do update set module_key=excluded.module_key,choice=excluded.choice,correct=excluded.correct,answered_at=excluded.answered_at
 where public.working_attempts.answered_at <= excluded.answered_at;
$$;
revoke all on function public.working_record_attempt(text,text,smallint,boolean,timestamptz) from public,anon;
grant execute on function public.working_record_attempt(text,text,smallint,boolean,timestamptz) to authenticated;
commit;
