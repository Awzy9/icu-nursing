# Phase 14 - subscription and commercial infrastructure (mock payments only)

**Nothing here can charge anyone.** No payment provider has been chosen, no price has been set, and the only provider is a mock that never touches a network, takes no card and moves no money. A production deployment is always "billing off". A real provider, a price, taxes, invoices and refunds all need the owner's decision and a separate reviewed change.

## Free and premium
* **Free** keeps everything the site offers today: library, question bank, study modes, cases, skills, medications, equipment and practice labs.
* **Premium** adds two convenience features only (`progress_export`, `detailed_statistics`). Today one is wired: the export of the learner's own practice summary (CSV) on the competency page; it shows as locked, with a link to the plans, when the learner is not entitled.
* **Content is never sold or gated.** The `features` catalogue allows only kinds `capacity` and `convenience` and refuses names that look like content (`draft`, `unpublished`, `clinical`, `content`, `review`, `publish`), so a subscription cannot represent access to unpublished clinical material or replace a publication gate (tested in `tests/db/subscriptions.test.ts`). The existing publication gates are untouched.

## Data model (migration 0018)
`plans`, `features`, `plan_entitlements`, `subscriptions` (one live per user, enforced by a partial unique index; provider constrained to `mock`), `subscription_events` (append-only log, idempotency key per provider event, no personal data). RLS: a learner reads only their own subscription and events; nobody has table write access; every change goes through SECURITY DEFINER functions with a pinned search path (covered by the surface and privileged-function suites).

## Status, entitlements, cancellation and expiry
* Statuses: none, trialing, active, past_due, canceled (ended early by an administrator or provider), expired.
* Premium access exists only while a live subscription's `current_period_end` is in the future, evaluated on every read; a stored "active" row past its end is not premium even before it is normalised.
* Cancelling sets `cancel_at_period_end`: access continues to the end of the period, then the subscription expires. Cancelling twice changes nothing; resuming withdraws the cancellation. A failed (mock) payment ends access when the paid period ends; otherwise the mock renews for another month.
* Cancel, resume and read are always allowed. Subscribe, time travel and administrator changes are refused unless the database is a development database **and** `app_settings.mock_payments_enabled` is true.
* Account deletion erases the subscription (ON DELETE CASCADE); event rows keep no user. When a real provider is added, deletion must cancel the provider's subscription first.

## Administration
`/admin/subscriptions` (admin role with MFA): search by email, set or end a test subscription with a mandatory written reason; every action is audited (`adm_sub_list`, `adm_sub_set`) and logged as an event. Learners, other staff roles and an admin without a second factor are refused.

## Payment provider abstraction
`src/lib/billing/provider.ts` defines `PaymentProvider` (id, `live`, `createCheckout`, `verifyWebhook`). `MockPaymentProvider` signs and verifies webhook bodies with HMAC-SHA256 in constant time, bounds the body size, validates a strict event schema and rejects replays. `POST /api/billing/webhook` answers 503 when billing is off (always in production) or the secret is missing; in mock mode it applies events only to the in-memory fixture store, because a database deployment has no server credential for provider events (a real provider will need its own reviewed path and a service credential chosen by the owner).

## Where it appears
`/pricing` (public comparison, no price, no card field), `/account/billing` (plan, status, period, cancel/resume, plan history, test tools), footer "Plans" link, `/admin/subscriptions`. English and Arabic, accessibility-checked.

## Tests
Unit: pure state machine, fixture service, provider and webhook route (21 tests). Database: 15 tests (structure, grants, lifecycle, expiry, payments off, isolation, admin, deletion) plus the surface allowlist. End-to-end: pricing, full lifecycle, entitlement gate, Arabic, webhook refusal. Isolated Supabase CI: `tests/live/billing.live.test.ts` over real Auth sessions and real MFA.

## Owner decisions still needed before anything is live
Provider; prices and currencies; trial length; refund and tax handling; terms of sale and privacy notice for payment data; whether to keep a free tier forever; which further convenience features premium should include.
