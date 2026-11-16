# Phase 4 integration and Phase 5 report: study modes and case-based learning

Branch `claude/vigilant-mendel-95k63h`. Not merged (PR #2 untouched), not deployed. All 40 clinical drafts and 240 clinical MCQs remain AI-generated DRAFT: not imported, not published, not reviewed. Clinical review, reviewer recruitment and the AI assistant were not started. ICU Scope and ICU Knowledge Map were not touched. The real Turnstile secret and CAPTCHA settings were not touched.

## 1. Integration with the development Supabase project
**Pre-flight (before any change).** Project reference confirmed as `dvmevjomyaqrojsiffnf`, name `icu-nursing-dev`, region ap-south-1, ACTIVE_HEALTHY, migrations 0001-0005 applied, 1 user / 1 role / 0 topics / 646 audit rows. Default privileges already revoke API-role grants (migration 0001), so new objects start closed. Backups: the project has no stored backups and no point-in-time recovery, so rollback readiness is **additive-only migrations plus manual down-scripts** in `supabase/rollback/` (0006+0007, 0008, 0009; never applied automatically). Each migration ran in one transaction.

**Applied to `icu-nursing-dev` only**
| Migration | Content |
|---|---|
| `0006_question_bank.sql` | question bank tables, 10 `qb_*` functions, content gate |
| `0007_fixture_environment_guard.sql` | `app_settings.environment` (default `production`) + CHECK: fixtures can only be visible when `environment = 'development'`; gate function re-checks it |
| `0008_study_modes.sql` | Leitner schedule, revision launchers, history, overview (`st_*`), covering indexes |
| `0009_cases.sql` | case tables, scoring keys, attempts, `cs_*` functions, structure + publication guards |
Data after each step: still 1 user, 1 role, 646 audit rows; nothing deleted.

**Fixture control.** The 16 synthetic questions and 3 synthetic cases are loaded in the dev project (all `demo_synthetic`, labelled `SYNTHETIC FIXTURE`). `app_settings.environment` was set to `development` and `question_fixtures_visible` to `true` on this dev project by the verification script. On any database whose `environment` is `production` (the default) or `staging`, enabling visibility is rejected by a CHECK constraint and the gate also refuses to serve fixtures; the app additionally refuses fixture mode when `NEXT_PUBLIC_APP_ENV=production`. No clinical question or case exists in the database.

**Advisors (after all migrations).** Security: `security_definer_view` x2 (pre-existing public views, intentional `security_barrier` read surface), `auth_leaked_password_protection` x1 (owner action: needs the Auth setting, Pro plan feature), `authenticated_security_definer_function_executable` x35 (intentional: the 35 RPCs validate `auth.uid()` and are the only learner write path; the allowlist is enforced by tests). Performance: 10 `unused_index` INFO items on brand-new tables (expected, no traffic yet); the two unindexed-foreign-key findings from the first run were fixed by migration 0008.

## 2. Study and revision modes
Routes: `/study` (dashboard), `/study/sheets`, `/study/sheets/[slug]`; revision attempts run in the existing runner. Priorities delivered:
1. **Practise incorrectly answered questions**: "Answered incorrectly" set (latest answer wrong).
2. **Flagged and bookmarked** sets.
3. **Deterministic spaced repetition (Leitner)**: wrong -> box 1, due now; correct -> one box up (cap 5); next review after 0/1/3/7/14 days for boxes 1-5. No randomness. Implemented identically in SQL and TypeScript and cross-tested.
4. **Revision history and due counters**: per-user history of revealed answers, "due now" counter, next review time, reviews today, boxes view.
5. **Study dashboard** with progress by topic (answered / correct / due).
6. **Key-point revision sheets** built only from the content repository's published topics (objectives, red flags, scope-labelled actions); in this environment only labelled synthetic demonstration topics exist.
Security: `learner_review_schedule` own-row read, no learner writes; schedule updated only inside `reveal_answer` (exam answers join the schedule only at submission); every set is intersected with the content gate; withdrawn questions leave all counters; revision attempts keep answer secrecy.

## 3. Case-based learning
Routes: `/cases`, `/cases/attempt/[id]` (runner and completed summary). Features: dashboard with progress and best scores; step-by-step branching (different options lead to different later steps, some steps skipped); multiple decision points (3-4 per case); feedback after every committed decision including all options' points, scope-of-practice label and explanation; deterministic 0/1/2 points per decision (denominator = 2 x decisions actually taken); completion summary and path; resume (starting a case with an unfinished attempt returns it); discard; progress tracking. Scoring is described everywhere as educational feedback, **not proof of clinical competence**.
Security: scoring keys (`case_option_keys`) are unreadable by learners; `cs_get` for an in-progress case returns only the current step's text and shuffled option text (no points, scope, feedback or later steps); decisions are final and must follow the current step; own-attempt privacy; guard trigger validates structure (>= 2 steps, every step has a 2-point and a lower option, branching goes forward, all steps reachable, last step ends) and the clinical publication safeguards; published cases are immutable; no function sets clinical review fields.
Content: 3 synthetic nonclinical cases (fictional ferry office / library), 11 steps. No clinical draft text is used (unit-tested against the drafts).

## 4. Test results (final commit)
| Check | Result |
|---|---|
| Lint (`--max-warnings 0`), typecheck | pass |
| Unit | **263 passed** (17 files) |
| Database/RLS on real PostgreSQL 16, migrations 0001-0009 | **228 passed** (11 files) |
| E2E + accessibility (Playwright, desktop/tablet/mobile) | **218 passed, 4 skipped, 0 failed** (axe: 0 serious/critical on all new pages incl. Arabic RTL and dark mode) |
| Draft validator | 40 of 40 pass |
| Build | pass |
| Live verification on `icu-nursing-dev` (`scripts/live/verify-question-bank.ts`) | **all checks pass** (see 5) |
| Live schema verification (`verify-schema.ts`) | all pass (tables, RLS, allowlist of 35 RPCs, grants) |
Two defects were found and fixed by these tests along the way: header navigation overflowed at tablet width after adding links (breakpoint moved to `lg`), and scrollable tables were not keyboard-focusable (now focusable regions). A first Leitner bug (first correct answer entered box 1) was caught by the DB test before release.

## 5. What was tested where
| Feature | Real dev Supabase project | Local only (PostgreSQL 16 / fixtures engine) |
|---|---|---|
| Migrations 0006-0009 apply cleanly, schema, RLS enabled, grants, function allowlist, advisors | **yes** | yes |
| Fixture loading and visibility control (`production` refuses, `development` allows) | **yes** | yes |
| Clinical-kind draft question/case unreadable, unstartable, unpublishable | **yes** | yes |
| Learner cannot read other learners' attempts; cannot write tables; anon denied | **yes** (role impersonation via the Management API SQL endpoint) | yes |
| Server-side scoring (exam 25.0%, case 100%), answer-key secrecy, practice finality, seeded-order parity with TypeScript | **yes** | yes |
| Leitner schedule, revision set, history, overview, study privacy | **yes** (one scenario each) | yes (exhaustive) |
| Case secrecy, branching, resume, final commits | **yes** (one full run) | yes (exhaustive) |
| Timer expiry, bookmarks, flags, per-domain filters, 5-attempt caps, withdrawn items, guard and freeze triggers, structure validation | no | **yes** |
| Full UI: runners, dashboards, sheets, keyboard, axe, RTL, dark mode, mobile | no (UI runs on the fixtures engine) | **yes** (Playwright) |
| Real sign-in, PostgREST/GoTrue transport, `supabase-js` RPC calls from the Next.js app | **no** | no |
The live checks impersonate `authenticated`/`anon` with `SET LOCAL ROLE` plus JWT claims on temporary test users (inserted and deleted by the script; cascading removal verified), because real sign-in needs the CAPTCHA widget and its secret must not be weakened. They do **not** exercise PostgREST itself. App-to-database wiring is covered by zod parsing of real function output (DB tests) rather than a browser session against the hosted project.

## 6. Isolated local/CI testing investigation
* Sandbox: Docker CLI present, **no daemon** (`/var/run/docker.sock` absent); Supabase CLI 3.1.0 available. A local stack cannot start here.
* GitHub-hosted runners include Docker, so `supabase start` with Auth CAPTCHA enabled against Cloudflare's public **test** secret is feasible in CI, keeping the real secret out of it. Not enabled: the live suites would first need `LIVE_PROJECT_REF`/`LIVE_PROJECT_URL` parameterisation with an allow-list that excludes `icu-nursing-dev` (work plan in `docs/ISOLATED_LIVE_TESTING.md`), and I could not run such a job to prove it. No hosted project was created and no CAPTCHA or Auth setting was changed.
* Existing CI (`.github/workflows/ci.yml`) already runs lint, typecheck, unit, the PostgreSQL-backed DB/RLS suite and the Playwright suite on every PR; a step was added that fails if the generated fixture seed files drift.

## 7. Known limitations and remaining issues
* No real learner content exists: only labelled synthetic fixtures. With fixtures off, every learner area shows an honest empty state.
* Fixture mode keeps state in server memory (lost on restart); intended for development and tests.
* The case "scope-of-practice" labels reuse the nursing wording of the real topics; the fictional vignettes say so explicitly. Real clinical cases will need native clinical review of the labels and wording.
* Spaced-repetition intervals (0/1/3/7/14 days) are a simple default, not validated for clinical learning; they are documented and easy to change in one function.
* Revision sheets reuse the published-topic snapshot; with no published clinical topics they show only synthetic demo topics.
* Arabic UI strings (including plural forms) are a draft pending native review; fixtures are mostly English with labelled fallback.
* Accessibility checks are automated only; no manual screen-reader testing.
* Hosted `auth_leaked_password_protection` is off (owner action; plan feature).
* Rate limiting remains the best-effort per-instance limiter; database caps limit unfinished attempts (5) and cases (5).
* Streaming not-found pages return HTTP 200 with the not-found UI (content still withheld).

## 8. Owner actions
1. Decide whether to run the isolated CI job for the CAPTCHA-dependent live suites (needs the parameterisation work above) or approve a second hosted test project.
2. Optionally enable leaked-password protection on the dev project when the plan allows.
3. Arrange native Arabic review and a manual screen-reader pass.
4. Decide who reviews and when clinical review is un-postponed; until then nothing clinical can appear in any learner area.
5. Review the branch; no merge, deployment, payment, agreement or import was made.
