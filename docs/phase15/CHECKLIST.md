# Phase 15 master checklist (resume point for future sessions)

Durable progress tracker for the 8-workstream plan. Update this file as work proceeds; do not repeat completed items.

## Workstream 1 — Medication evidence audit (50 drafts)

**Status: in progress.** Batches 7a/7b closed monitoring-section gaps on 16 drafts (re-reading already-cited FDA labels in full, re-confirming version/effective date unchanged, adding genuinely sourced content, never reproducing dose/rate numbers).

Reviewed and changed (monitoring + adverse-effects content added, label currency re-verified 2026-11-16):
MD-01 Norepinephrine, MD-02 Epinephrine, MD-03 Vasopressin, MD-04 Dobutamine, MD-05 Milrinone, MD-06 Propofol (batch 4), MD-10 Morphine, MD-12 Rocuronium, MD-15 Insulin, MD-17 Adenosine, MD-32 Nicardipine, MD-33 Labetalol, MD-36 Furosemide (batch 4), MD-38 Haloperidol, MD-39 Hydromorphone, MD-40 Naloxone, MD-41 Flumazenil (batch 4), MD-42 Atropine, MD-46 Tranexamic acid.

Still flagged "monitoring: no statement sourced from the label" (next to audit): MD-20 Calcium gluconate, MD-21 Sodium bicarbonate, MD-23 Meropenem, MD-24 Vancomycin, MD-25 Ceftriaxone, MD-26 Cefazolin, MD-27 Azithromycin, MD-49 Pantoprazole (intravenous).

Not yet re-audited at all this phase (31 of 50): MD-07 to MD-09, MD-11, MD-13-14, MD-16, MD-18-19, MD-22, MD-28-31, MD-34-35 (MD-34 esmolol already fixed Phase 15 batch 1), MD-37, MD-43-45, MD-47-48, MD-50, and any others not listed above — run `npx tsx scripts/audit-evidence.ts` and read `docs/phase14/evidence_gaps.csv` for the current exact list before resuming.

Known systemic, documented (not fixable per-draft without a new source type):
- "Escalation: no nursing-practice source" — flagged on all 50 drafts; needs a nursing-level escalation/early-warning-score guideline distinct from a regulator label. Not located/accessed this phase.
- "US label only, no other regulator read" — flagged on all 50; EMA/MHRA/SFDA labels not read this phase.
- "High-alert status not determined from a source read" — flagged on 41; the ISMP high-alert list is licensed for internal non-commercial use and is never reproduced verbatim.

Confirmed genuinely inaccessible this phase (left `not_read`, not fabricated):
- AACN practice-alert summaries cited by SK-18/SK-19 (full text needs a free AACN login).
- AHA 2025 guidelines (`cpr.heart.org`, `professional.heart.org`, `ahajournals.org`) — 403/Cloudflare challenge on every fetch attempted.

## Workstream 2 — Nursing skill drafts audit (25 drafts)

**Status: not started.** Begin after workstream 1's remaining 8 monitoring gaps are closed. Use the same re-read-the-cited-source, add-only-genuinely-sourced-content methodology. Priority list from `docs/phase14/EVIDENCE_GAP_AUDIT.md`'s skills section (score-ranked) — re-generate with `scripts/audit-evidence.ts` before starting.

## Workstream 3 — Remaining educational content audit (topics, questions, scenarios, equipment)

**Status: not started.**

## Workstream 4 — Website learner-journey review

**Status: largely verified complete** (Phase 15 batch 6) for navigation, search, Learn hub, disclaimers, EN/AR + light/dark accessibility. Not yet specifically re-audited this workstream: homepage/onboarding, error/empty/loading states, account/profile pages.

## Workstream 5 — Subscription readiness

**Status: verified complete** (Phase 15 batch 6) — lifecycle, cancellation, expiry, payment failure, admin override, isolation, billing UI all implemented and tested. No further action planned unless a concrete gap is found.

## Workstream 6 — Evidence verification / clinical governance workflow

**Status: implemented** (Phase 15 batch 3, migration `0019_ai_evidence_review.sql`) — structurally cannot approve anything. Not yet reviewed for the newer asks in workstream 6 (licensing checks, discrepancy tracking depth) — revisit after workstreams 1–2.

## Workstream 7 — Quality assurance

Run after every batch: `npm run lint`, `npx tsc --noEmit -p .`, `npx vitest run --config vitest.config.ts` (unit), `DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npx vitest run --config vitest.db.config.ts` (DB — start local Postgres first: `pg_ctlcluster 16 main start`), relevant Playwright suites (`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test ... --project=desktop`), `npx tsx scripts/validate-medication-drafts.ts` / `validate-skill-drafts.ts` / `validate-practice-drafts.ts` as relevant, then `npx tsx scripts/audit-evidence.ts`, `build-draft-index.ts`, `build-draft-register.ts` to regenerate generated files before committing.

## Workstream 8 — Final report

**Status: not started.** Write after workstreams 1–3 (at minimum) are substantively complete.

## Restrictions (unchanged, every batch)

No mobile development. No production deployment. No PR #2 merge. No live payments. No embedded learner-facing AI assistant. No weakening safety tests/publication gates to pass CI. No clinical draft marked reviewed/approved/published. AI evidence checks stay separate from clinical approval (migration `0019`, never touches `content_reviews` or `record_review()`).
