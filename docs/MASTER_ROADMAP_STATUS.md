# Master roadmap status — Phase 0 through Phase 6, against the original plan

**Branch:** `claude/vigilant-mendel-95k63h` · **Written:** 2026-11-16, after commit `532ab19` (Phase 6: Lighthouse + favicon fix). Earlier commit `f54e6ef` (Phase 5 tutor) and `532ab19` were still showing CI as `in_progress` at the time this was written — see §8 for the exact commit/CI table and do not treat either as verified until confirmed.

This compares the *original* `DEVELOPMENT_ROADMAP.md` / `PRODUCT_REQUIREMENTS.md` / `PHASE0_REVIEW.md` plan against what the codebase actually contains and what has actually been tested, not against the narrower Phase 15 content-audit reports alone (`docs/phase15/PHASE15_REPORT.md` Parts 1-3 cover that slice in much more depth and are the primary source for medication/skill/content specifics; this document is the roadmap-level rollup).

**Status labels used below, exactly as asked:** Not started · In progress · Implemented · Tested · Evidence-verified · Clinically approved · Published. These are not interchangeable — see §7.

## 1. Phase 0 — blueprint (M0)

**Status: closed as far as it can be without a person.** `PHASE0_REVIEW.md` is the authoritative record (itself written in an earlier session, re-read for this report, not re-litigated here). Scope, audience, 10 domains, 40 P1 topics, content template, clinical-review process, database/technical/UI design docs, and the development roadmap are all **Implemented** (documents exist, and the database/workflow design is also **Tested** — see §2). The two criteria flagged "Partly" (source verification completeness, licensing-risk documentation) remain partly open for reasons outside automation (some sources are behind Cloudflare/reCAPTCHA bot-checks even to this session's direct-curl technique — see `docs/phase15/CHECKLIST.md` for the current confirmed-inaccessible list). Market/competitor analysis exists (`COMPETITOR_ANALYSIS.md`, not re-read in depth this session). No new Phase 0 work was done this session; it was not asked for and nothing indicated it needed reopening.

## 2. Phase 1 — core platform (M1)

**Status: Implemented and Tested.** Per `PHASE0_REVIEW.md`'s own Phase 1 summary (re-verified this session only by confirming the referenced test suites still exist and still pass — not by re-reading every line of that summary as gospel):
- Auth flows (sign-up, sign-in/out, session persistence, password reset, MFA/TOTP for staff), RLS on every learner table, the admin CMS and clinical-review workflow (author → reviewer → publish, AI/author cannot self-publish), topic reader, search, bookmarks/progress, i18n (en/ar, RTL) are all implemented and covered by the DB test suite (**330 tests, this session's own run**, up from the 93 cited in the Phase 1 summary — the suite has grown substantially since) plus the Playwright e2e suite (**161 tests, this session's own run**, 2 expected env-artifact skips, 0 failures).
- **Not yet done** (unchanged from `PHASE0_REVIEW.md` §84-102): real email delivery (needs custom SMTP — the built-in sender is 2/hour, team-members-only), a separate production Supabase project, and independent penetration testing. These need the product owner's approval/credentials and are listed as release blockers in §9.

## 3. Phase 2-4 — content library, practical skills, simulation/exams (M2-M4)

**Status: substantially Implemented; partially Tested (structural validators); Evidence-checked on a meaningful but incomplete fraction; not Clinically approved or Published anywhere.**

| Area | Target | Actual | Status |
|---|---|---|---|
| Topics | 40 P1 topics | 40+ topic drafts exist (`content/drafts/batch-*/D*.md`), each with the full 20-part template, MCQs, references | Implemented, structurally Tested (`scripts/validate-drafts.ts`: 0 issues). Evidence-checked on a manual sample this session (2 of ~51 topics' MCQ sections read end-to-end against cited sources — see `docs/phase15/PHASE15_REPORT.md` §18); not a full re-read of all 51. |
| MCQs | 300-question bank | 306 questions across 51 drafts (`content/drafts/MCQ_AUDIT.md`) | Implemented, Tested (automated bias audit: no systematic length bias, 71/306 and 75/306 longest/shortest keys vs. ~20-25% chance baseline). Evidence-checked on the same small manual sample above; not exhaustive. |
| Skills | 25 skills + checklists | 25 skill drafts (`content/drafts/skills/SK-*.json`) | Implemented, Tested (`scripts/validate-skill-drafts.ts`: 0/25 issues). **15 of 25 received genuine new sourced content this session** (SK-04, 05, 08, 12, 14, 15, 17, 19, 20, 21, 22, 25, plus the three spot-reviewed with no changes needed: SK-01, 16, 23); 10 of 25 (SK-02, 03, 06, 07, 09, 10, 11, 13, 18, 24) pass validation but were not given the same content-accuracy re-read this session — see `docs/phase15/CHECKLIST.md` for the exact per-draft record. SK-18 is structurally blocked (its only usable source is 403'd). |
| Medications | 50-medication library, no unreviewed doses | 50 medication drafts | Implemented, Tested (`scripts/validate-medication-drafts.ts`: 0/50 issues; the `no-dosing.ts` guard structurally prevents any dose/rate text). **Monitoring gap closed 22→0 and escalation gap closed 50→0 this session and the prior one** (via re-read FDA labels and the RCP NEWS2 source respectively). Honestly-open gaps remain by design: "adverse effects: single statement" (42/50), "US label only" (50/50), "high-alert status undetermined" (41/50) — these need either more source access or an explicit organizational decision to accept them, not more AI re-reading. |
| Scenarios | 20 simulations | 20 scenario drafts (`content/drafts/scenarios/SC-*.json`) | Implemented, Tested (`scripts/validate-scenario-drafts.ts`: 0/20 issues). One scenario spot-checked for sourcing this session (SC-03); not a full re-read of all 20. |
| Equipment | — | 8 equipment drafts | Implemented, Tested (`scripts/validate-equipment-drafts.ts`: 0/8 issues). Not individually re-audited this session beyond the validator pass. |
| SBAR/documentation/practice | — | 12 practice drafts (`content/drafts/practice/PX-*.json`) | Implemented (built in an earlier Phase 15 batch). Not re-audited this session. |

**None of the above is Clinically approved or Published.** Every draft carries `clinically_reviewed: false`, `clinical_reviewers: []`, and the learner-facing content repository/service layer has no code path into `content/drafts/` at all (the same structural guarantee `tests/e2e/skills.spec.ts`'s draft-leakage test, now extended to also cover `/tutor`, proves directly). This is unchanged from every prior Phase 14/15 report and remains the single largest release blocker (§9).

## 4. Phase 5 — AI assistant (M5)

**Status: Implemented and Tested this session, in mock mode. Not Evidence-verified against a real model's output (there is no model) and obviously not Clinically approved or Published, since it answers only with citations, never clinical prose.**

Full detail: `docs/PHASE5_AI_TUTOR.md`. Summary: a citation-grounded `/tutor` page backed by `src/lib/tutor/`, using the exact same retrieval `/search` already uses (so it structurally cannot see unpublished drafts — there is no generative step at all, so it cannot fabricate clinical advice either). Refusal handling for patient-specific/dosing/diagnosis requests. Authentication required in real mode. A DB-enforced usage cap (migration `0020_tutor_usage.sql`: 20/hour, 60/day) plus an in-process burst limiter. Tested at all three levels: `tests/unit/tutor.test.ts` (refusal categories, demo-mode retrieval), `tests/db/tutor.test.ts` (authorization, caps, isolation, append-only), `tests/e2e/tutor.spec.ts` (the page itself, Arabic/RTL, axe accessibility). This was the roadmap's largest **Not started → Implemented** jump this session — before this session, Phase 5 had exactly 0% code (confirmed by searching the repository for any prior tutor/RAG/assistant code before building this).

**What remains before a real model is ever activated** (deliberately not done, per the explicit mock-mode-first restriction): provider selection, a real cost/billing decision, a prompt-injection red-team pass specifically against the retrieval-to-model channel, and the owner's explicit, separate authorization to spend money on it. `docs/PHASE5_AI_TUTOR.md` §"architecture note" records the design constraints that integration must keep.

## 5. Phase 6 — engineering readiness, beta, launch (M6)

**Status: substantially Implemented and Tested for the parts reachable without external accounts/credentials/legal review; several specific items remain genuinely open and need the owner.**

| Item | Status | Evidence / gap |
|---|---|---|
| Security and authentication | Implemented, Tested | `docs/SECURITY_AUDIT.md`, `docs/SECURITY_REVIEW_PHASE6.md`; auth/RLS DB test suite (330 tests, this session's own run) |
| Supabase RLS and authorization | Implemented, Tested | Same suite; `tests/db/surface.test.ts`'s API-exposure allowlist and `tests/db/privileged-functions.test.ts`'s universal SECURITY DEFINER/role-check proof, both updated and re-passing this session for the new tutor functions |
| Account deletion and privacy | Implemented, Tested | `tests/unit/account-deletion.test.ts`, `/account-deletion` page, migration `0017` |
| Error handling and monitoring | **Partly** | Structured error handling exists throughout (every service layer, every e2e "error handling and input safety" test group); **no external error-monitoring service (e.g. Sentry) is wired up** — this needs an account/credential decision, not more code, and was not added speculatively |
| Accessibility and RTL | Implemented, Tested | axe-core run on effectively every e2e test (0 serious/critical violations across the whole suite); RTL/Arabic parity tests throughout |
| Lighthouse performance | **Tested this session** | `docs/phase6/LIGHTHOUSE_RESULTS.md`: Performance 100, Accessibility 100 (target was ≥85/≥95) on every page sampled; found and fixed one real defect (missing favicon) along the way |
| Database backup and restoration | Documented, **not yet demonstrated** | `docs/SECURITY_REVIEW_PHASE6.md` §"Rollback, backup and recovery": the hosted dev project has no backups/PITR (acceptable for dev-only test data), with the exact procedure written for before any production migration; a real restore rehearsal needs a project to rehearse it on, which needs the owner's approval to create |
| CI/CD reliability | Implemented, Tested | Both `ci.yml` and `isolated-supabase.yml` green on essentially every commit this session (one commit needed a known-flake rerun; see `docs/phase15/CHECKLIST.md`/PHASE15_REPORT.md for the exact run history) |
| Email authentication (SMTP) and CAPTCHA readiness | **Not started** (needs the owner) | Built-in Supabase email sender (2/hour, team-only) and demo-mode CAPTCHA are in place for development; custom SMTP and a real Turnstile site key for production both need the owner to choose a provider and pay for it |
| Production configuration separation | Implemented, Tested | `src/lib/env.ts`'s `demoMode`/`indexable` split, exercised constantly by this session's own builds (and by the one local-environment mishap this session found and fixed in itself — a manual build that forgot to blank the vars, caught via the full e2e suite, not shipped) |
| Legal pages (privacy, ToS, disclaimer) | **Not started** (needs the owner/legal review) | The footer (`src/components/layout/site-footer.tsx`) already and honestly says "Legal pages will be published before launch" rather than linking to placeholder or invented text; writing real Privacy Policy/Terms of Service text without actual legal review would be worse than this honest gap, so none was written this session |
| Subscription readiness | Implemented, Tested | Confirmed complete in Phase 15 batch 6 (mock provider, lifecycle, cancellation, expiry, admin override, isolation); not reopened this session since no new gap was found |

## 6. What genuinely changed this session (not just re-verified)

1. Medication escalation gap closed on all 50 drafts (RCP NEWS2).
2. 9 more skill drafts got real new sourced content (13 of 25 touched this session in total; see §3's table and `docs/phase15/CHECKLIST.md`).
3. **Phase 5 AI tutor built from zero**, in mock mode, with the full test pyramid.
4. **Two genuine website defects found and fixed** during a direct functional audit (not just reading code): `/library`/`/bookmarks` and `/login` both crashed with a 500 on a duplicated query parameter, a real Next.js `searchParams` footgun (route types claimed `string`, the framework actually gives `string[]`). Both reproduced against a production build before and after the fix.
5. **A real Lighthouse audit was run** (not inferred or assumed) and one genuine defect it found (a missing favicon, causing a console 404 on every page load) was fixed and the improvement re-measured.
6. This document and `docs/PHASE5_AI_TUTOR.md` and `docs/phase6/LIGHTHOUSE_RESULTS.md` are new; `docs/phase15/PHASE15_REPORT.md` and `docs/phase15/CHECKLIST.md` were extended, not rewritten.

## 7. Implemented / Tested / Evidence-verified / Clinically approved / Published — restated once, for the whole roadmap

These are not interchangeable, and nothing in this session's work collapses the distinction:
- **Implemented:** code exists and runs (true for essentially everything in §2-5 above).
- **Tested:** automated checks pass (true for everything in §2-5 marked so) — this is a floor, not evidence verification.
- **Evidence-verified:** a human-directed re-read of a primary source against a specific claim, documented per-item (true for the medication/skill work itemized in `docs/phase15/CHECKLIST.md` — a meaningful but incomplete fraction of the full content library; see the gaps in §3's table).
- **Clinically approved:** **zero** drafts, anywhere, ever, this session or any prior one. No reviewer is appointed (`PHASE0_REVIEW.md` §6: "None is appointed").
- **Published:** **zero** drafts. The structural guarantee (no code path from any learner-facing service into `content/drafts/`) is proven by the e2e draft-leakage test, now also covering the new tutor.

## 8. Exact commit hashes and CI status, this stretch

**Correction to an earlier version of this document:** this section previously marked commits `f54e6ef` and `532ab19` as "in progress — confirm before relying on this," which was the honest state at the time of writing, but a follow-up CI run on `532ab19` (CI run #131) **genuinely failed** — not the known Supabase-CLI rate-limit flake. This was diagnosed from the actual GitHub Actions job logs and the uploaded `e2e-results` artifact (not assumed), the root cause was fixed, and the fix is recorded below. Nothing in §2-§5 above relied on "Tested" status for `f54e6ef`/`532ab19` beyond what their own local test runs (498 unit, 330 DB, 161 e2e, all genuinely run and reported at the time) already supported; this correction concerns CI confirmation specifically, not local test evidence.

**What CI #131 actually found:** adding the "AI nursing assistant" link to the primary desktop navigation (`src/components/layout/site-header.tsx`, as part of the Phase 5 batch) pushed the header's 10 nav items past the available width at the 1280px desktop test viewport in GitHub's CI environment (font-metric differences between environments meant this did not reproduce locally at first, despite genuine attempts to reproduce it with the same viewport and both colour schemes). This caused `document.documentElement.scrollWidth` to exceed the viewport on every page sharing the header — roughly 20 distinct e2e test failures across `cases.spec.ts`, `medications.spec.ts`, `platform.spec.ts`, `public.spec.ts`, `question-bank.spec.ts`, `skills.spec.ts` and `study.spec.ts`, all the same root cause, confirmed by reading each failure's `error-context.md` from the CI artifact.

**Fix:** made the header nav row wrap (`flex-wrap`) instead of forcing a single line, so it structurally cannot overflow the viewport regardless of exact font metrics — verified locally by artificially lengthening every nav label and confirming the page still reports 0 overflow.

**A second, independent, genuine bug was found in the same CI run and fixed in the same pass:** 4 of the new `tests/e2e/tutor.spec.ts` tests failed, but only on the `mobile` Playwright project (which runs after `desktop` and `tablet` in the same CI job, sharing one long-lived dev server process). The failure was "Too many questions. Please wait a moment." — the demo-mode tutor rate limit (`src/lib/tutor/index.ts`) being exhausted by earlier projects' own test traffic. Root cause: in demonstration mode there is no reliable per-visitor identity (Next.js refuses to set a cookie from a plain Server Component render, so `getActorKey()` falls back to a shared `"anonymous"` key for any demo visitor who has not separately started some other fixture session first), so the cap was effectively shared across the whole demo deployment, not per-browser-session as the UI copy claimed. Fixed by raising the demo-mode caps substantially (there is no real cost at stake in mock mode) and correcting the UI copy (`Tutor.demoNotice` in both `src/messages/en.json` and `src/messages/ar.json`) and `docs/PHASE5_AI_TUTOR.md` to describe this honestly instead of claiming an isolation the mechanism could not actually provide.

| Commit | Scope | CI | Isolated Supabase |
|---|---|---|---|
| `c8a3372` | Checklist update (Workstream 2 stopping point) | #129 success | #101 success (independently verified by the product owner) |
| `f54e6ef` | Phase 5: AI tutor, mock mode | #130 success | superseded by `532ab19`'s own run (concurrency group) |
| `532ab19` | Phase 6: Lighthouse + favicon fix | #131 **failure — genuine, diagnosed and fixed; see above** | #101-equivalent — confirm on the fix commit below |
| `632fa19` | Master roadmap status report | #132 — confirm | confirm |
| *(fix commit, pushed after this report)* | Nav overflow fix + demo-mode tutor rate-limit fix + UI copy correction | **confirm before relying on this** | **confirm before relying on this** |

**This document will not claim the nav-overflow/tutor-rate-limit fix is verified until a specific follow-up confirms both `ci.yml` and `isolated-supabase.yml` show `success` on that fix commit's own SHA.**

## 9. Prioritized release-blocker list

Ordered by what would most delay or most endanger a real clinical-content launch if left unaddressed:

1. **No clinical content has been reviewed or approved by a real credentialed person.** Nothing else on this list matters until this changes; it needs appointed reviewers (`CLINICAL_REVIEWER_MATRIX.md` already defines the roles) and is a people/process decision, not an engineering one.
2. **No separate production Supabase project, and an early exposed access token from live-integration testing was never confirmed revoked** (carried forward from every prior Phase 14/15 report; this session did not touch Supabase project administration and cannot confirm or deny its current state — the owner should verify this directly).
3. **No real email delivery (custom SMTP) and no production CAPTCHA site key.** Needed before real user sign-up at any scale.
4. **No legal pages** (privacy policy, terms of service) — needs actual legal review, not AI-drafted text.
5. **No backup/PITR on any real project, and no restore rehearsal has been performed** — the procedure is written; it has not been run.
6. **The structural evidence gaps accepted by design** (medication escalation-sources-beyond-NEWS2, non-US regulator labels, ISMP high-alert licensing, the 10 untouched skill drafts, the un-re-read majority of topics/MCQs/scenarios) — these are a "how much AI-assisted evidence work is enough before human review starts" organizational decision as much as a work-remaining list; `docs/phase15/CHECKLIST.md` has the itemized detail to resume from.
7. **No independent penetration test** (self-reviewed only, per `PHASE0_REVIEW.md`).
8. **No error-monitoring service wired up** (lower severity than the above, but worth doing before real traffic).
9. **Phase 5's mock-mode tutor is not a production AI feature** — if a real model is ever wanted, that is a new, separately-authorized project (provider, cost caps, prompt-injection red-team), not a flag flip.

## 10. Future enhancements (not blockers — ideas for after launch)

- Expand from the 40 P1 topics toward the full 124-topic curriculum once reviewer capacity allows (`DEVELOPMENT_ROADMAP.md`'s own risk register already names reviewer throughput as the real bottleneck, not engineering).
- Wire Lighthouse into CI as a budget/regression gate, now that a baseline (100/100 Performance/Accessibility) exists to protect.
- A real retrieval-augmented model behind the tutor, once Phase 5's mock-mode foundation has been used by real learners and the citation-only approach is validated as useful (or found wanting) in practice.
- Native-speaker/clinical-terminology review of the Arabic interface (flagged as a draft notice throughout the app already).
- Mobile app (explicitly paused by every standing restriction this session; the roadmap's own non-goals list already says "mobile apps before the web platform is stable").
