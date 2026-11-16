# Live Supabase integration report (development project only)

Date: 2026-11-14 · Project: `icu-nursing-dev` (`dvmevjomyaqrojsiffnf`, ap-south-1, PostgreSQL 17.11) · **Development environment only. No production deployment. No other Supabase project was touched** (the tooling pins this project ref in `scripts/live/mgmt.ts`).

## How access was obtained
The owner supplied a Supabase personal access token through the secure credential form (saved as a network secret; I never saw its value). It was used only against `api.supabase.com/v1/projects/dvmevjomyaqrojsiffnf/…`. The publishable key was read from that project's API-keys endpoint and written to the **git-ignored** `.env.local`. Test-harness code reads the project's secret key **in memory only** (to create clearly-labelled test accounts and generate verification/recovery links without an inbox); the application never uses it, and a scan of the production client bundle found no secret key material. **Please revoke the access token when you are done** (supabase.com/dashboard/account/tokens) and remove it from the environment's network secrets.

## 1. Migrations
| Migration | Applied to live project | Notes |
|---|---|---|
| `0001_identity.sql` | ✅ | roles, MFA-aware helpers (`private` schema), audit log, role admin RPCs, default-deny |
| `0002_content_schema.sql` | ✅ | content model, public views, learner state, 10 domains, FK indexes |
| `0003_workflow.sql` | ✅ | publication workflow functions |
| `0004_storage.sql` | ✅ | `topic-images` bucket + object policies |

Applied in order, one transaction per file, recorded in `supabase_migrations.schema_migrations`. Compatibility with Supabase PostgreSQL 17 was good: no SQL had to change for the platform (`auth.users` trigger, `auth.uid()/jwt()`, storage policies all worked). The live advisors drove two improvements which were folded into the migrations (the dev project was empty, so it was reset and re-applied): helper functions moved to a non-exposed `private` schema; policies rewritten (single policy per role/action, `(select auth.uid())`, fixed `search_path`, 12 FK indexes).

Live catalog verification (`npm run live:verify`, 19 checks, all pass): 17 tables all with RLS; exactly 2 public views; **exactly 15 RPCs executable by `authenticated`, none by `anon`**; `anon` can `SELECT` only domains and the two public views; no workflow-table write access for `authenticated`; workflow columns not updatable; every application function pins `search_path` and none falls back to PUBLIC execute; signup trigger present; 40 policies, 42 indexes, 20 triggers; bucket = public, 2 MB, PNG/JPEG/WebP only; 4 storage policies; 10 domains; **no clinical or demo content imported**.

## 2. Supabase advisors
| | First run | Final |
|---|---|---|
| Security | 33 (1 ERROR, 4+22 WARN exposed definer functions, 4 mutable search_path, 1 INFO) | **17**: 2 ERROR + 15 WARN |
| Performance | 38 (12 unindexed FKs, 11 auth initplan, 8 multiple permissive, 7 unused) | **19, all INFO "unused index"** (database has had no traffic) |

Remaining security findings are **accepted by design** and tested:
- `security_definer_view` ×2 (`public_topics`, `public_domains`): the *only* public read surface. They expose approved, published snapshots; direct table access for `anon` is denied (`tests/db`, `tests/live`).
- `authenticated_security_definer_function_executable` ×15: the workflow, admin and learner-progress RPCs. Each checks the caller's role **and MFA** inside the function and is refused otherwise (see §4 and the 43 live tests). Internal helpers are not callable at all.

## 3. Authentication (live)
Configured through the Management API (`npm run live:auth`, read back and verified): email confirmation required; password minimum 12; TOTP MFA enabled (phone/WebAuthn off); refresh-token rotation on; anonymous sign-ins off; security-notification emails on; JWT expiry 1 h; redirect allow-list = `http://localhost:3000/auth/callback`, `http://localhost:3100/auth/callback`.

| Check | Result |
|---|---|
| Weak password rejected at sign-up (`weak_password`) | ✅ |
| Unverified account cannot sign in (`email_not_confirmed`); verification link (token hash) confirms it; profile created with display name | ✅ |
| Wrong password and unknown user give identical errors | ✅ |
| Session persists across client restarts; token refresh issues a new access token | ✅ |
| Sign-out ends the session; global sign-out revokes other sessions | ✅ |
| Password reset: recovery link signs in once, weak new password refused, strong one accepted, old password dead, link single-use | ✅ |
| Reset request for an unknown address reveals nothing | ✅ |
| Metadata/role claims cannot create roles; learner role only; user cannot grant themselves anything | ✅ |
| TOTP: admin without MFA is aal1 and powerless; enrolment + code → aal2; wrong code rejected; re-login returns to aal1 until challenged | ✅ |
| UI: login errors, dashboard, sign-out, protected-route redirects, MFA gating and in-browser TOTP enrolment, email-link callback (`/auth/callback`) + reset form, open-redirect neutralised, session shared across tabs | ✅ (10 Playwright live tests) |
| **Real email delivery** (registration confirmation, reset email) | ⛔ **Not verifiable**: see blockers |

## 4. Reviewer / publication workflow (live)
Run with clearly-labelled **test accounts** ("LIVE TEST … (test account, not a real clinician)"); roles were granted through the real admin RPC by an MFA-verified test administrator (the very first admin was bootstrapped by SQL, as the owner would). **No test account is, or is presented as, a qualified reviewer**, and all content is synthetic.

| Workflow step | Result |
|---|---|
| Author without MFA cannot create content; with MFA creates a draft with sections, source and reference | ✅ |
| Author cannot set status/published pointer/authorship, or touch another author's draft | ✅ |
| Submit → version 1 snapshot; working copy frozen; double submit refused | ✅ |
| Only a publisher with MFA assigns reviewers; wrong specialty, non-reviewer, author-as-reviewer and non-required roles refused | ✅ |
| Publish refused before approval; author and learner cannot review; reviewer without MFA / unassigned / wrong role refused; comments required for change requests | ✅ |
| One approval of two required roles is not enough; both distinct reviewers approve → approved | ✅ |
| Only publisher publishes; learners then see the snapshot with reviewer roles and review date | ✅ |
| Reviews immutable; author sees reviewer comments | ✅ |
| Change request → author edits → resubmit as version 2 → approve → publish | ✅ |
| Revision invisible to learners until approved + published; rollback to v1 (reason + publisher only); archive/restore | ✅ |
| Audit log records submit/assign/review/publish/revision/rollback with actors; readable only by MFA administrators | ✅ |
| Same flow through the real admin UI (author drafts + submits; publisher assigns; reviewer approves; publisher publishes; anonymous learner sees it) | ✅ |
| Learner views/completion/bookmarks persist across sign-ins; cannot forge progress or bookmark unpublished topics | ✅ (API and UI) |
| Image upload (UI): non-image disguised as PNG refused by file signature; real PNG stored under `<topic_id>/<uuid>.png` with licence + alt metadata; public URL works; other authors/learners/anonymous/SVG/oversize/wrong-folder/in-review uploads refused | ✅ |
| Abuse: learners calling every staff RPC; direct writes to roles/versions/reviews/audit/settings by learner and by an MFA admin; `private` schema and internal functions; MFA-less staff; cross-user reads | all refused ✅ |

## 5. Bugs found only by live testing (all fixed, with regression tests where possible)
1. Registration form posted blank optional fields (`experience=""`), which the validator rejected as a generic error.
2. Publishers could not list reviewer profiles (policy subquery was itself blocked by RLS) → `private.user_has_role()`; DB test added.
3. Reviewer queue query was ambiguous (two relationships between `content_versions` and `topics`).
4. React 19 wiped every form field after a server rejection → forms now keep input on errors and reset on success.
5. Staff MFA gate trusted an unverified JWT decode → now `getClaims()` (verified); the database enforces MFA independently anyway.
6. Sign-up showed "check your email" when Supabase rejected the address → now surfaces "enter a valid email" and rate-limit messages without revealing existing accounts.
7. Advisor findings listed in §2.

## 6. Remaining blockers and owner actions
| # | Item | Why |
|---|---|---|
| 1 | **Custom SMTP** (e.g. Resend/SES/Postmark) | Supabase's built-in sender allows **2 emails/hour per project** and only to organisation members. Real registration/reset email delivery, and any load, cannot be tested until you add SMTP credentials (dashboard or send them via the secure form). The app handles the limit gracefully |
| 2 | **CAPTCHA** (hCaptcha/Turnstile) | needs a provider site key + secret |
| 3 | **Leaked-password protection** | Pro plan feature (request returned 402) |
| 4 | Revoke the personal access token and remove it from the environment's network secrets | least privilege |
| 5 | Bootstrap your real first administrator (SQL in `docs/SECURITY.md`) and appoint real, credentialed reviewers | no clinical publication is possible without them |
| 6 | Production URLs, custom domain, redirect allow-list, and a **separate production project** | dev only so far |
| 7 | Erasure policy | reviews/audit are immutable and `content_reviews.reviewer_id` references users, so a reviewer account cannot be deleted; a pseudonymisation procedure is needed before launch |
| 8 | Backups/PITR and restore drill, monitoring, legal pages | launch checklist |
| 9 | App-level rate limits are per instance (best effort); add platform WAF/rate limiting at deployment | serverless |
| 10 | Draft-image URLs are public by URL (random UUID paths); acceptable for the diagrams planned, revisit if a draft ever contains sensitive material | design note |

## 7. Re-running
```bash
export NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/path/to/ca   # only needed behind the sandbox proxy
npm run live:env && npm run live:migrate && npm run live:verify && npm run live:advisors
npm run test:live                      # 43 API-level tests (creates and removes its own test users)
npm run build:live && npm run test:e2e:live   # 10 UI tests against the real app + project
npm run live:cleanup                   # removes any leftover LIVE TEST users/content
```
Locally these use `SUPABASE_ACCESS_TOKEN` (your own token) instead of the sandbox proxy. They refuse to run against any project other than the pinned dev ref.
