# Phase 15 master checklist (resume point for future sessions)

Durable progress tracker for the 8-workstream plan. Update this file as work proceeds; do not repeat completed items.

## Workstream 1 — Medication evidence audit (50 drafts)

**Status: monitoring-gap pass complete (0/50 remaining); deeper reassessment (adverse-effects breadth, interactions, contraindications) not yet done on most drafts.** Batches 7a/7b/7c closed monitoring-section gaps on all 24 previously-flagged drafts (re-reading already-cited FDA labels in full, re-confirming version/effective date unchanged, adding genuinely sourced content, never reproducing dose/rate/compatibility wording).

Reviewed and changed this phase (monitoring + adverse-effects content added, label currency re-verified 2026-11-16):
MD-01 Norepinephrine, MD-02 Epinephrine, MD-03 Vasopressin, MD-04 Dobutamine, MD-05 Milrinone, MD-06 Propofol (batch 4), MD-10 Morphine, MD-12 Rocuronium, MD-15 Insulin, MD-17 Adenosine, MD-20 Calcium gluconate, MD-21 Sodium bicarbonate, MD-23 Meropenem, MD-24 Vancomycin, MD-25 Ceftriaxone (also corrected a stale/inaccurate gap note — the calcium interaction was actually in the already-read warnings field), MD-26 Cefazolin, MD-27 Azithromycin, MD-32 Nicardipine, MD-33 Labetalol, MD-36 Furosemide (batch 4), MD-38 Haloperidol, MD-39 Hydromorphone, MD-40 Naloxone, MD-41 Flumazenil (batch 4), MD-42 Atropine, MD-46 Tranexamic acid, MD-49 Pantoprazole.

**"Monitoring: no statement sourced from the label" is now 0/50.** ("Adverse effects: a single statement" is 42/50 remaining — lower priority, same fix pattern as above, not yet done.)

Not yet re-audited this phase for adverse-effects/interactions/contraindications depth (~31 of 50, exact list changes as work proceeds): MD-07 to MD-09, MD-11, MD-13-14, MD-16, MD-18-19, MD-22, MD-28-31, MD-34-35 (MD-34 esmolol already fixed Phase 15 batch 1), MD-37, MD-43-45, MD-47-48, MD-50 — run `npx tsx scripts/audit-evidence.ts` and read `docs/phase14/evidence_gaps.csv` for the current exact list before resuming.

Known systemic, documented (not fixable per-draft without a new source type):
- "Escalation: no nursing-practice source" — flagged on all 50 drafts; needs a nursing-level escalation/early-warning-score guideline distinct from a regulator label. Not located/accessed this phase.
- "US label only, no other regulator read" — flagged on all 50; EMA/MHRA/SFDA labels not read this phase.
- "High-alert status not determined from a source read" — flagged on 41; the ISMP high-alert list is licensed for internal non-commercial use and is never reproduced verbatim.

Confirmed genuinely inaccessible this phase (left `not_read`, not fabricated):
- AACN practice-alert summaries cited by SK-18/SK-19 (full text needs a free AACN login).
- AHA 2025 guidelines (`cpr.heart.org`, `professional.heart.org`, `ahajournals.org`) — 403/Cloudflare challenge on every fetch attempted.

## Workstream 2 — Nursing skill drafts audit (25 drafts)

**Status: in progress.** Batch 8a: SK-21 Infection prevention and SK-19 Defibrillator safety fully fixed (new "assessment" and "monitoring" sections added with genuinely sourced content; SK-21's CDC Core Practices page was re-fetched and found to answer a gap previously marked unreachable — hand-hygiene moments; SK-19's already full-read ERC ALS 2025 PDF, extracted via pdftotext since WebFetch alone could not parse the binary, yielded pad-position/implanted-device and post-shock monitoring content not previously used). Batch 8b: SK-17 CRRT circuit monitoring and SK-15 Patient repositioning — found several items already correctly citing a full-read source (N-AHS-CRRT-ALARM-2025; S-AARC-PVA) but mislabelled `support: "partial"`; corrected to `"sourced"` per the validator's own rule (a full-read-cited statement is "sourced", not an invented addition). No new content added to these two; both were a classification fix.

Confirmed genuinely inaccessible this batch (left `not_read`, not fabricated — do not re-attempt without a new access method):
- `wtcs.pressbooks.pub` (Open RN Nursing Skills / Advanced Skills) — 403 Forbidden to both curl and WebFetch. Affects SK-11, SK-13, SK-18.
- AACN practice alerts (`aacn.org/clinical-resources/practice-alerts/...`) — require a free AACN login. Affects SK-07, SK-18, SK-19 (alarm/dysrhythmia alerts).
- AHA 2025 guidelines (`cpr.heart.org`, `ahajournals.org`) — 403/Cloudflare challenge. Affects SK-19.
- NCBI Bookshelf `NBK594490` — returns a browser-verification/bot-check page, not the article. Affects SK-13.
- `S-BSH-ATR` (BSH acute transfusion reactions guideline) — confirmed 404 in an earlier phase; not re-attempted. Affects SK-09.

**SK-18 ECG monitoring is structurally blocked**: its only non-AACN source (Open RN ch.7, `wtcs.pressbooks.pub`) is 403, so it has no source read in full at all and cannot carry a "sourced" statement under the validator's rule that a sourced item must cite a source read in full. Leave as-is until a working access method for either source is found.

Batches 10–11 (prior session stretch): SK-22 infusion pump safety, SK-12 urinary catheter care, SK-20 intrahospital transport, SK-25 pain assessment, SK-14 pressure injury prevention all received genuine new sourced content (see PHASE15_REPORT.md Part 2 for detail).

Batch 12: SK-21 infection prevention — direct curl + `pdftotext -layout` retrieval of the CDC/HICPAC 2007 Isolation Precautions guideline PDF (`Guideline-Isolation-H.pdf`, 403 to WebFetch, succeeds via curl) surfaced section III.B's Contact/Droplet/Airborne precaution category definitions, closing a previously-documented "not read" gap. Added as a sourced scope-section item; which-organism-needs-which-category correctly kept as local policy (not in section III.B). Source upgraded to `read:"full"`.

Batch 13: SK-05 tracheostomy care — the AARC CPG (previously cited only via its index/listing page and marked "cite-only, not_read") was located at its actual PDF URL on the AARC resource page and fetched/extracted in full. Its three PICO-question panel recommendations (tracheostomy bundles evaluated by subject-matter experts, multidisciplinary tracheostomy teams, protocol-directed weaning/decannulation) added as a new sourced item in the responsibilities section, framed as organisational/team-level guidance, not a specific bundle/team/protocol. Source upgraded to `read:"full"`.

Batch 14 spot-review (this session): re-checked SK-01 arterial line care, SK-23 sedation assessment, SK-16 safe patient mobilization against their cited sources for accuracy, not just access — all three already correctly and honestly cite partial/full sources with no overclaiming found; no changes needed. Re-confirmed still genuinely inaccessible on retry (curl, with no spoofed headers): NSW ACI tracheostomy guide (403), Open RN via NCBI Bookshelf NBK596713 and NBK594490 (reCAPTCHA bot-check page, HTTP 200 but not the article), `wtcs.pressbooks.pub` (403), AACN practice alerts alarm-management and dysrhythmia-monitoring (403/301-then-403), AHRQ TeamSTEPPS (403). BSH acute-transfusion-reactions guideline: the `b-s-h.org.uk/guidelines` landing page itself is now reachable (200, was previously logged as 404), but no direct link to the specific ATR guideline document could be found on it, and no URL was guessed — remains honestly `not_read`.

SCCM ABCDEF-bundle and PADIS pages (cited by SK-16, SK-23, SK-25) are reachable (HTTP 200) but their detailed per-element content loads via JS tabs that WebFetch's static extraction cannot reach; only the page's already-captured top-level content (six-element list, outcome statistics, licensing terms) is extractable — consistent with the drafts' own existing "partial, recommendation/page text only" citations. No change needed; this was a genuine re-verification, not a new finding.

Still on the priority worklist, not substantively re-reviewed this phase for correctness depth (structural audit confirms 0 validator issues, but a full content re-read against sources has not been done): SK-02 central venous catheter care, SK-03 peripheral IV care, SK-04 endotracheal tube care, SK-06 suctioning, SK-07 ventilator safety checks, SK-08 oxygen delivery devices, SK-09 blood transfusion, SK-10 enteral feeding, SK-11 nasogastric tube care, SK-13 chest drain monitoring, SK-18 ECG monitoring (structurally blocked, see above), SK-24 neurological assessment. Re-run `npx tsx scripts/audit-evidence.ts` for the current exact gap list before resuming.

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
