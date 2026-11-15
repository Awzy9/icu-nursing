# Security review, Phase 6 (question bank, study, cases, isolated testing)

Scope: the 35 `SECURITY DEFINER` functions the API exposes to signed-in users (16 workflow/admin/learner + 10 `qb_*` + 3 `st_*` + 6 `cs_*`), the content-visibility conditions, row-level security, attempt ownership, fixture controls, and the test-key controls introduced for CI. Evidence is from real PostgreSQL, the local Supabase stack in CI (real PostgREST, GoTrue, Kong, Mailpit) and the hosted `icu-nursing-dev` project.

## Method
| Control | Verified by |
|---|---|
| All 35 exposed functions are SECURITY DEFINER with a pinned `search_path`; **each one refuses a JWT with no user**; each staff/admin function refuses a role-less learner | `tests/db/privileged-functions.test.ts` (enumerates the catalogue, so a new function cannot be added unexercised) |
| API surface allowlist (functions, table grants, anon grants) | `tests/db/surface.test.ts` |
| Content gate (draft clinical items invisible; guards reject partial publication; frozen content) | `tests/db/question-bank.test.ts`, `tests/db/cases.test.ts` |
| Answer-key secrecy, attempt ownership, no learner writes **over real PostgREST** | `tests/live/isolated.live.test.ts` (local stack in CI) and `scripts/live/verify-app-on-dev.ts` (hosted dev, real sessions) |
| Anonymous access: no tables, no functions, nothing in the OpenAPI document | same |
| Fixture control: cannot be enabled outside a development database, and is re-checked at read time | DB tests, live tests (production flip over the real API) |
| Hosted-project protection: Cloudflare test keys and the dummy CAPTCHA token cannot reach a hosted project | `tests/unit/live-guard.test.ts` (allow-list, import-time refusal) |

## Findings and fixes
| # | Finding | Severity | Status |
|---|---|---|---|
| F1 | A signed-in learner could start and finish attempts in a loop, growing `quiz_attempts`, `quiz_attempt_items`, `case_attempts` without bound (only *unfinished* attempts were capped). | Medium (availability / storage cost) | **Fixed** in `0010_attempt_rate_limits.sql`: 100 question-bank attempts and 60 case starts per rolling hour per learner, enforced in the database for every client. Applied to dev; tested. |
| F2 | pg_graphql (`/graphql/v1`) is a second API surface the app never uses; it lets any signed-in user introspect table/column names and query every table they hold SELECT on (row-level security still held, tested). | Low (information exposure / attack surface) | **Fixed** in `0011_disable_graphql_surface.sql`: EXECUTE revoked from `anon` and `authenticated` on the GraphQL entry point (reversible; guarded for databases without pg_graphql). |
| F3 | The sign-up form answered *"Password must be at least 12 characters"* for any server-side weak-password rejection, including a 23-character password that merely lacked an upper-case letter. Found by the isolated stack, whose stricter policy differs from the hosted project's. | Low (misleading security message, usability) | **Fixed**: accurate `passwordWeak` message (English/Arabic), applied to sign-up and password reset; the help text now states the policy. |
| F4 | CI test-key handling: tests sent Cloudflare's dummy CAPTCHA token and could, in principle, be pointed at any project. | Preventive | **Controls added**: explicit loopback allow-list (`scripts/live/isolated-targets.json`), `requireIsolated()` before any test-token or test-secret operation, refusal at import time when the target is not allow-listed, allow-list of the only three Cloudflare public test secrets, and a unit test that proves the dev project cannot be an isolated target. |

## Checked and found sound
* **Content-visibility conditions.** `question_is_visible` / `case_is_visible`: published, not retired, approval timestamps, and either (`demo_synthetic` + `SYNTHETIC FIXTURE` label + fixtures flag + `environment = 'development'`) or (clinical + named approver + independent `clinical_reviewer` + published topic). No function sets the clinical review fields, so no clinical question or case can become visible; the guard trigger rejects any writer.
* **Fixtures in production.** Database default `environment = 'production'`; CHECK constraint forbids `question_fixtures_visible = true` unless `environment = 'development'`; visibility function re-checks; app refuses fixture mode when `NEXT_PUBLIC_APP_ENV=production`. The live test flips a development database to `production` over the real API and every fixture disappears.
* **Attempt ownership.** Every function resolves attempts with `user_id = auth.uid()`; not-found and not-yours are indistinguishable. Raw PostgREST requests to read another learner's attempt return nothing; RPC calls fail with "attempt not found".
* **Answer-key secrecy.** In-progress responses carry no key, rationale, explanation, points, scope or later step (asserted on raw PostgREST bodies, and on the HTML/RSC payloads the browser receives). Exam correctness stays NULL in the learner's own rows until submission.
* **Writes.** `INSERT/UPDATE/DELETE` on every question-bank, study and case table is refused over PostgREST with 401/403; the only write path is the RPC set.
* **search_path.** Every function pins `search_path`; nobody can create objects in `public` or `private`.

## Remaining risks (documented, not fixed)
1. **Aggregate statistics poisoning.** `question_stats` is updated by every learner's revealed answers; an adversarial account could skew staff-visible difficulty statistics. Not learner-visible; mitigated by the hourly ceilings; revisit when statistics drive decisions.
2. **Owner-level changes.** A database owner can drop the fixture CHECK constraint or edit `app_settings` (the live tests do so on throw-away databases). Protect owner access (Supabase dashboard MFA) and treat `app_settings.environment` as a deploy-time invariant.
3. **Rate limiting.** The Next.js limiter is per instance and best-effort. The database ceilings and Supabase Auth limits are the real controls.
4. **No audit trail for learner actions** (attempts, answers). Acceptable for learner data; add if regulators require it.
5. **Leaked-password protection** is off on the hosted dev project (a plan feature; owner action).
6. **Hosted dev has no stored backups and no point-in-time recovery** (see below).
7. **Supabase default keys in CI** (local stack JWT secret and keys) are public defaults by design; the stack exists only for the lifetime of the job and binds to loopback inside the runner.

## Rollback, backup and recovery
* **Migrations 0006 to 0011 are additive or replace functions; each has a manual down-script** in `supabase/rollback/` (never applied automatically). Rolling back loses only question-bank/study/case data.
* **Hosted dev project:** the Management API reports `backups: []`, `pitr_enabled: false`. The project contains test data only (1 account, 0 topics), so this is acceptable *for dev*. **For a private staging project, enable daily backups (and PITR if the plan allows) before inviting anyone, and rehearse a restore into a scratch project once.**
* **Before any production migration:** `supabase db dump` (schema and data) to encrypted storage, run the migrations in a transaction on a restored copy first, keep the down-script next to the migration, and verify with `scripts/live/verify-schema.ts`.
* **Recovery objectives to decide with the owner:** suggested RPO 24 h (daily backup) and RTO 4 h for staging; tighter for production once real learner data exists.
