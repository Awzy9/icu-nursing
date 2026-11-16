-- Phase 14: subscription and entitlement infrastructure. MOCK PAYMENTS ONLY.
--
-- Design rules (docs/phase14/SUBSCRIPTION_ARCHITECTURE.md):
--   * No payment provider has been chosen and no live payment exists. provider is constrained to 'mock'; a later migration widens it once the owner chooses.
--   * Every state change goes through a SECURITY DEFINER function. Learners get SELECT on their own rows only; nobody gets table write access.
--   * Subscription writes (subscribe, advance, admin set) are refused unless private.mock_payments_allowed(): a development database with the explicit
--     mock_payments_enabled switch. Cancelling and resuming your own subscription is always allowed.
--   * Entitlements describe capacity and convenience features only. The features catalogue has kind in ('capacity','convenience'): there is no way to
--     represent "access to content" as an entitlement, so a subscription can never open an unpublished clinical item or replace a publication gate.
--   * Premium access exists only while a live subscription (trialing, active, past_due) has current_period_end in the future. Cancelling ends access at the
--     period end (cancel_at_period_end); an administrator or a provider can end it early (status canceled).
--   * Account deletion erases subscriptions (ON DELETE CASCADE); event rows keep no user (SET NULL) and hold no personal data.
begin;

alter table public.app_settings add column mock_payments_enabled boolean not null default false;

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create table public.features (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$' and key !~ '(draft|unpublished|clinical|content|review|publish)'),
  kind text not null check (kind in ('capacity', 'convenience')),
  description text not null
);
create table public.plans (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,30}$'),
  name text not null,
  tier integer not null unique check (tier >= 0),
  price_minor integer check (price_minor is null or price_minor >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  check ((price_minor is null) = (currency is null))
);
create table public.plan_entitlements (
  plan_code text not null references public.plans (code) on delete cascade,
  feature text not null references public.features (key),
  primary key (plan_code, feature)
);

insert into public.features (key, kind, description) values
  ('progress_export', 'convenience', 'Download your own practice and progress summary'),
  ('detailed_statistics', 'convenience', 'Detailed statistics on your own question and case results');
-- No price is set: the owner has not chosen one (price_minor and currency stay null).
insert into public.plans (code, name, tier) values ('free', 'Free', 0), ('premium', 'Premium', 1);
insert into public.plan_entitlements (plan_code, feature) values ('premium', 'progress_export'), ('premium', 'detailed_statistics');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_code text not null references public.plans (code),
  status public.subscription_status not null,
  provider text not null check (provider = 'mock'),
  provider_ref text,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end > current_period_start)
);
create unique index subscriptions_one_live_per_user on public.subscriptions (user_id) where status in ('trialing', 'active', 'past_due');
create index subscriptions_user_idx on public.subscriptions (user_id);

create table public.subscription_events (
  id bigint generated always as identity primary key,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (event_type in ('created', 'renewed', 'canceled', 'resumed', 'expired', 'payment_failed', 'admin_change')),
  provider text not null default 'mock',
  provider_event_id text,
  detail jsonb not null default '{}'::jsonb check (pg_column_size(detail) < 2000),
  created_at timestamptz not null default now()
);
create unique index subscription_events_idem on public.subscription_events (provider, provider_event_id) where provider_event_id is not null;
create index subscription_events_user_idx on public.subscription_events (user_id, id desc);

alter table public.features enable row level security;
alter table public.plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;
create policy features_read on public.features for select to authenticated using (true);
create policy plans_read on public.plans for select to authenticated using (true);
create policy plan_entitlements_read on public.plan_entitlements for select to authenticated using (true);
create policy subscriptions_own on public.subscriptions for select to authenticated using (user_id = auth.uid());
create policy subscription_events_own on public.subscription_events for select to authenticated using (user_id = auth.uid());
revoke all on public.features, public.plans, public.plan_entitlements, public.subscriptions, public.subscription_events from anon, authenticated;
grant select on public.features, public.plans, public.plan_entitlements, public.subscriptions, public.subscription_events to authenticated;

-- ------------------------------------------------------------------ helpers
create or replace function private.mock_payments_allowed() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select environment = 'development' and mock_payments_enabled from public.app_settings limit 1), false)
$$;

create or replace function private.sub_event(p_sub uuid, p_user uuid, p_type text, p_detail jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.subscription_events (subscription_id, user_id, event_type, detail) values (p_sub, p_user, p_type, coalesce(p_detail, '{}'::jsonb))
$$;

-- Moves any live subscription whose period has ended to its next state. Called before every read or change, so access never outlives the period.
create or replace function private.sub_normalise(p_user uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.subscriptions; guard int := 0;
begin
  loop
    select * into r from public.subscriptions where user_id = p_user and status in ('trialing', 'active', 'past_due') and current_period_end <= now() for update;
    exit when not found or guard >= 24;
    guard := guard + 1;
    if r.cancel_at_period_end or r.status = 'past_due' then
      update public.subscriptions set status = 'expired', updated_at = now() where id = r.id;
      perform private.sub_event(r.id, r.user_id, 'expired', jsonb_build_object('reason', case when r.cancel_at_period_end then 'cancelled_at_period_end' else 'payment_not_recovered' end));
    else
      -- mock provider: the renewal always succeeds, one more month
      update public.subscriptions set status = 'active', current_period_start = r.current_period_end, current_period_end = r.current_period_end + interval '30 days', updated_at = now() where id = r.id;
      perform private.sub_event(r.id, r.user_id, 'renewed', jsonb_build_object('provider', 'mock'));
    end if;
  end loop;
end $$;

create or replace function private.entitlements_of(p_user uuid) returns text[]
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(array_agg(distinct pe.feature order by pe.feature), '{}')
  from public.subscriptions s join public.plan_entitlements pe on pe.plan_code = s.plan_code
  where s.user_id = p_user and s.status in ('trialing', 'active', 'past_due') and s.current_period_end > now()
$$;

create or replace function private.sub_state(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.subscriptions; plan text := 'free'; hist jsonb; has_sub boolean;
begin
  select * into r from public.subscriptions where user_id = p_user order by (status in ('trialing', 'active', 'past_due')) desc, created_at desc limit 1;
  has_sub := found;
  if has_sub and r.status in ('trialing', 'active', 'past_due') and r.current_period_end > now() then plan := r.plan_code; end if;
  select coalesce(jsonb_agg(jsonb_build_object('type', e.event_type, 'at', e.created_at, 'detail', e.detail) order by e.id desc), '[]'::jsonb) into hist
  from (select * from public.subscription_events where user_id = p_user order by id desc limit 20) e;
  return jsonb_build_object(
    'plan', plan, 'premium', plan <> 'free',
    'status', case when has_sub then r.status::text else 'none' end,
    'period_end', case when has_sub then r.current_period_end end,
    'cancel_at_period_end', coalesce(has_sub and r.cancel_at_period_end, false),
    'entitlements', to_jsonb(private.entitlements_of(p_user)),
    'mock_payments', private.mock_payments_allowed(),
    'history', hist);
end $$;

-- ------------------------------------------------------------------ learner functions
create or replace function public.sub_get_my() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  perform private.sub_normalise(u);
  return private.sub_state(u);
end $$;

create or replace function public.sub_mock_subscribe(p_plan text, p_trial boolean default false) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); p public.plans; sid uuid;
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  if not private.mock_payments_allowed() then raise exception 'payments are not enabled in this environment' using errcode = '55000'; end if;
  select * into p from public.plans where code = p_plan and active and tier > 0;
  if not found then raise exception 'unknown or inactive plan' using errcode = '22023'; end if;
  perform private.sub_normalise(u);
  if exists (select 1 from public.subscriptions where user_id = u and status in ('trialing', 'active', 'past_due')) then
    raise exception 'already subscribed' using errcode = '23505';
  end if;
  insert into public.subscriptions (user_id, plan_code, status, provider, provider_ref, current_period_start, current_period_end)
  values (u, p.code, case when p_trial then 'trialing' else 'active' end::public.subscription_status, 'mock', 'mock_' || substr(md5(random()::text), 1, 12),
          now(), now() + case when p_trial then interval '7 days' else interval '30 days' end)
  returning id into sid;
  perform private.sub_event(sid, u, 'created', jsonb_build_object('plan', p.code, 'trial', p_trial, 'provider', 'mock', 'test_transaction', true));
  return private.sub_state(u);
end $$;

create or replace function public.sub_cancel() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); r public.subscriptions;
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  perform private.sub_normalise(u);
  select * into r from public.subscriptions where user_id = u and status in ('trialing', 'active', 'past_due') for update;
  if not found then raise exception 'no active subscription' using errcode = 'P0002'; end if;
  if not r.cancel_at_period_end then
    update public.subscriptions set cancel_at_period_end = true, canceled_at = now(), updated_at = now() where id = r.id;
    perform private.sub_event(r.id, u, 'canceled', jsonb_build_object('access_until', r.current_period_end));
  end if;
  return private.sub_state(u);
end $$;

create or replace function public.sub_resume() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); r public.subscriptions;
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  perform private.sub_normalise(u);
  select * into r from public.subscriptions where user_id = u and status in ('trialing', 'active', 'past_due') for update;
  if not found then raise exception 'no active subscription' using errcode = 'P0002'; end if;
  if r.cancel_at_period_end then
    update public.subscriptions set cancel_at_period_end = false, canceled_at = null, updated_at = now() where id = r.id;
    perform private.sub_event(r.id, u, 'resumed');
  end if;
  return private.sub_state(u);
end $$;

-- Test-only time travel for the mock provider: makes the current period appear p_days older. Refused unless mock payments are enabled.
create or replace function public.sub_mock_advance(p_days integer, p_payment_fails boolean default false) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid := auth.uid(); r public.subscriptions;
begin
  if u is null then raise exception 'sign in required' using errcode = '42501'; end if;
  if not private.mock_payments_allowed() then raise exception 'payments are not enabled in this environment' using errcode = '55000'; end if;
  if p_days is null or p_days < 1 or p_days > 400 then raise exception 'days out of range' using errcode = '22023'; end if;
  select * into r from public.subscriptions where user_id = u and status in ('trialing', 'active', 'past_due') for update;
  if not found then raise exception 'no active subscription' using errcode = 'P0002'; end if;
  update public.subscriptions set current_period_start = current_period_start - make_interval(days => p_days), current_period_end = current_period_end - make_interval(days => p_days), updated_at = now() where id = r.id;
  if p_payment_fails and not r.cancel_at_period_end and (select current_period_end <= now() from public.subscriptions where id = r.id) then
    update public.subscriptions set status = 'past_due', updated_at = now() where id = r.id;
    perform private.sub_event(r.id, u, 'payment_failed', jsonb_build_object('provider', 'mock', 'test_transaction', true));
  end if;
  perform private.sub_normalise(u);
  return private.sub_state(u);
end $$;

-- ------------------------------------------------------------------ administrator functions (admin role, MFA, audited with a reason)
create or replace function public.adm_sub_list(p_query text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare out jsonb;
begin
  if not private.has_staff_role('admin') then raise exception 'administrator access with MFA required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(x order by x ->> 'email'), '[]'::jsonb) into out from (
    select jsonb_build_object('user_id', s.user_id, 'email', u.email, 'plan', s.plan_code, 'status', s.status, 'period_end', s.current_period_end, 'cancel_at_period_end', s.cancel_at_period_end, 'provider', s.provider) x
    from public.subscriptions s join auth.users u on u.id = s.user_id
    where p_query is null or p_query = '' or u.email ilike '%' || replace(replace(p_query, '%', ''), '_', '') || '%'
    order by u.email limit 100) q;
  perform private.write_audit('adm_sub_list', 'subscription', null, jsonb_build_object('filtered', coalesce(p_query, '') <> ''));
  return out;
end $$;

create or replace function public.adm_sub_set(p_user uuid, p_plan text, p_status public.subscription_status, p_days integer, p_reason text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.subscriptions; sid uuid;
begin
  if not private.has_staff_role('admin') then raise exception 'administrator access with MFA required' using errcode = '42501'; end if;
  if not private.mock_payments_allowed() then raise exception 'payments are not enabled in this environment' using errcode = '55000'; end if;
  if p_reason is null or length(btrim(p_reason)) < 5 or length(p_reason) > 300 then raise exception 'a reason of 5 to 300 characters is required' using errcode = '22023'; end if;
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'unknown user' using errcode = 'P0002'; end if;
  if not exists (select 1 from public.plans where code = p_plan and active) then raise exception 'unknown or inactive plan' using errcode = '22023'; end if;
  if p_days is null or p_days < 1 or p_days > 400 then raise exception 'days out of range' using errcode = '22023'; end if;
  perform private.sub_normalise(p_user);
  select * into r from public.subscriptions where user_id = p_user and status in ('trialing', 'active', 'past_due') for update;
  if p_status in ('canceled', 'expired') then
    if not found then raise exception 'no live subscription to end' using errcode = 'P0002'; end if;
    update public.subscriptions set status = p_status, current_period_end = now(), current_period_start = least(current_period_start, now() - interval '1 second'), updated_at = now() where id = r.id;
    sid := r.id;
  elsif found then
    update public.subscriptions set plan_code = p_plan, status = p_status, current_period_end = now() + make_interval(days => p_days), cancel_at_period_end = false, canceled_at = null, updated_at = now() where id = r.id;
    sid := r.id;
  else
    insert into public.subscriptions (user_id, plan_code, status, provider, provider_ref, current_period_start, current_period_end)
    values (p_user, p_plan, p_status, 'mock', 'mock_admin', now(), now() + make_interval(days => p_days)) returning id into sid;
  end if;
  perform private.sub_event(sid, p_user, 'admin_change', jsonb_build_object('plan', p_plan, 'status', p_status, 'days', p_days, 'reason', btrim(p_reason)));
  perform private.write_audit('adm_sub_set', 'subscription', sid::text, jsonb_build_object('plan', p_plan, 'status', p_status, 'reason', btrim(p_reason)));
  return private.sub_state(p_user);
end $$;

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant execute on function public.sub_get_my(), public.sub_mock_subscribe(text, boolean), public.sub_cancel(), public.sub_resume(), public.sub_mock_advance(integer, boolean),
  public.adm_sub_list(text), public.adm_sub_set(uuid, text, public.subscription_status, integer, text) to authenticated;

commit;
