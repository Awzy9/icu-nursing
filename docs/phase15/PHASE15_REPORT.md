# Phase 15 progress report — ICU Nurse Knowledge Map (website-only; mobile paused)

**Branch:** `claude/vigilant-mendel-95k63h` · **Final verified commit:** `5d38b06bf0aa3017aee5330554f69a183e735785`
**CI on that exact commit:** `CI` run #107 — success. `Isolated Supabase live tests` run #76 — success.
PR #2 was not merged. No production deployment was made. No mobile/Expo/EAS work was done. No AI assistant was embedded in the website. No live payment was activated. No clinical draft was marked reviewed, approved or published.

This is a **progress report, not a closeout**: Phase 15 is ongoing. It covers three completed, individually-verified batches plus the CI stabilization that followed them. Several of the six priorities the owner set for Phase 15 are only partially addressed; see §6.

## 1. What shipped this phase

| Batch | Scope | Priority addressed |
|---|---|---|
| 1 | Medication evidence re-check (esmolol gap closed); personal competency notes | P2 (strengthen competency-learning), P3 (medication evidence) |
| 2 | Dashboard quick links to Skills/Practice labs; learner plan status + manage-plan link; mock billing wired into isolated CI | P4 (navigation/experience), P5 (subscription infrastructure) |
| 3 | AI-assisted evidence verification workflow for unpublished drafts (new, staff-only) | P6 (clinical evidence-review workflow) |
| — | Three CI-stabilization fixes (see §4) | required by Step 3 ("rerun both workflows until they pass on the same final commit") |

### 1.1 Medication evidence (batch 1)
Re-read the esmolol FDA label in full and found hyperkalaemia / serum-potassium monitoring already present in the label but not reflected in the draft (`content/drafts/medications/MD-34-esmolol.json`); added two sourced statements (safety alert + monitoring item). Re-confirmed labels for insulin, piperacillin-tazobactam, nitroglycerin and flumazenil are unchanged since Phase 14's re-check (`label_currency_check` on each, still enforced by `tests/unit/evidence-audit.test.ts`).

### 1.2 Competency notes (batch 1)
Competency self-assessment (`src/components/practice/status.tsx`) gained a personal, per-skill note field: debounced autosave, "Saved." live-region confirmation, 300-character cap, stored only on the learner's own device (`local-progress.ts`), and included as a fourth CSV column in the existing premium export. Notes are never transmitted, never shared between learners, and carry no clinical content guard because they hold no clinical content by construction (private personal annotations only).

### 1.3 Dashboard integration (batch 2)
`src/app/[locale]/dashboard/page.tsx` now shows quick-link buttons to Skills and Practice labs, and — when a billing service is configured — the learner's plan (Free/Premium) with a link to `/account/billing`. `BILLING_MODE=mock` was added to the isolated-Supabase CI job so this exercises real Supabase-backed auth rather than silently rendering nothing in that environment (the DB itself still refuses subscribe/advance unless `app_settings.mock_payments_enabled` is separately on — unaffected).

### 1.4 AI-assisted evidence verification workflow (batch 3)
New migration `0019_ai_evidence_review.sql` adds `public.ai_evidence_reviews`, an append-only log, plus three SECURITY DEFINER functions (`adm_ai_evidence_summary`, `adm_ai_evidence_list`, `adm_ai_evidence_set`). Purpose: let staff record that a tool such as ChatGPT (used by a person, with web browsing) was asked to check an unpublished draft's claims against current guidelines, systematic reviews, trials or regulatory sources, and what it found.

**Structurally, this can never become an approval:**
- No column on the table (`clinically_reviewed`, `approved`, `published`, `status`) and no function in the migration touches `content_reviews`, draft status, or `public.record_review()` — the only function that can record a real clinical review. Proven by `tests/db/ai-evidence-review.test.ts` (schema introspection + row-count-unaffected assertions), not just asserted in a comment.
- Every read in the UI is paired with a danger-toned banner: "An AI evidence check is not a clinical review and does not approve, publish or change the review status of this draft." The draft register and detail pages continue to show "Not reviewed · not approved · not published" after an AI check is recorded — asserted directly in the live UI test.
- It never calls a live AI service and nothing runs automatically: a staff member records the result of a check performed outside the database, by hand. No AI assistant is embedded in the website by this migration (per the owner's restriction).
- Same safeguards as the existing draft-notes workspace (migration 0016): no table access except through the three functions; staff role + MFA (aal2) to read; author/publisher/admin to write (a clinical reviewer can read but not write, and still cannot approve anything through this path); draft keys pattern-matched; sources and summary length-capped (up to 20 sources, ≤300 chars each; summary ≤2000 chars); the same dose/rate text guard as draft notes (`private.draft_note_text_ok`) on the summary; append-only via immutable trigger; 20 writes/hour per user; every write audited (outcome only — recommendation and discrepancy flag — never the free text).

UI: a new "AI-assisted evidence checks" section on `/admin/content/register/[key]` (form for staff who can write, history list for everyone with read access) and a new "AI evidence check" column on the register list (count + "gap flagged" badge).

## 2. Content and question-bank totals

Unchanged from Phase 14 (166 unpublished draft entries across topics/questions/skills/medications/cases/equipment/practice; 306 MCQs across 51 drafts) — Phase 15 so far improved sourcing depth on an existing draft (esmolol) rather than adding new content volume. No change to scenario completion (still 20/20 decision graphs).

## 3. Evidence and licensing gaps

Same open gaps as reported in Phase 14 §4 (nursing-practice escalation sources for medications, non-US regulator labels unread, 5 labels older than 2026 not yet re-verified, 10 skills with local-protocol-only core sections, the two OpenStax cross-check gap notes on SC-02/SC-09), minus the one closed this phase: **esmolol's hyperkalaemia/serum-potassium monitoring gap is now closed** (§1.1). No clinical draft has been marked reviewed or approved; all review fields remain `clinically_reviewed: false` / `pharmacist_reviewed: false`.

## 4. CI stabilization (required before this report could be written)

Three real bugs were found and fixed while verifying batches 2 and 3 against the isolated Supabase live UI suite — each is a genuine fix, not a rerun-until-lucky:

1. **`ccda00a`** — the dashboard's new Skills quick-link (batch 2) duplicated a link already in the main nav, making `getByRole("link", { name: "Skills" })` ambiguous in the login test. Scoped both new link assertions to the main content region.
2. **`07997c1`** — the test file's shared run marker `RUN` (`Date.now().toString(36)`) occasionally ends in a digit immediately followed by a unit letter (observed: `...10g`), which trips the database's dose/rate guard (`private.draft_note_text_ok`) on the evidence-note and new AI-evidence-summary fields it protects — the guard matches any digit run followed by a unit abbreviation at a word boundary, including end-of-string. Introduced a digit-free `RUN_TEXT` for use in those two guarded fields.
3. **`5d38b06`** — the new AI-evidence-check test's `getByText("No action needed")` matched both the still-selected `<select>` option and the new history entry's badge. Scoped the assertion to the specific history list item.

All three were caught by actually running the isolated Supabase workflow against each pushed commit and reading the failure, not assumed. **Final verified commit `5d38b06` has both `CI` (run #107) and `Isolated Supabase live tests` (run #76) green.**

## 5. Full testing results (on commit `5d38b06`)

| Suite | Result |
|---|---|
| `npm run lint` | clean, 0 warnings |
| `tsc --noEmit` | clean |
| Unit tests (`vitest`) | **482 / 482 passed** (unchanged from Phase 14) |
| Database/RLS tests (local Postgres 16) | **323 / 323 passed** (314 + 9 new AI-evidence-review tests) |
| **CI workflow** (GitHub Actions, commit `5d38b06`) | **success** |
| **Isolated Supabase live tests** (GitHub Actions, commit `5d38b06`) | **success** |

## 6. Status against the six Phase 15 priorities and what's left

| # | Priority | Status |
|---|---|---|
| 1 | Complete/integrate educational content sections | Not substantively addressed this phase beyond existing content; still open |
| 2 | Improve real topics/skills/medications/questions/scenarios | Partial — esmolol gap closed (§1.1); the other 49 medication drafts and 25 skill drafts have not been re-audited this phase |
| 3 | Strengthen documentation, SBAR and competency-learning | Partial — competency notes added (§1.2); SBAR/documentation practice exercises themselves not expanded |
| 4 | Improve navigation, design, search, learning experience | Partial — dashboard quick links and plan status added (§1.3); broader nav/design/search work not started |
| 5 | Complete subscription infrastructure (mock payments only) | Partial — dashboard now surfaces plan status and mock billing is exercised in isolated CI; no further subscription-model changes this phase |
| 6 | Prepare AI evidence-review workflow (separate from clinical approval) | **Done** — see §1.4; structurally cannot approve anything, verified by 9 new DB tests and live UI coverage |

Restrictions honored throughout: no mobile development, no AI assistant embedded in the website, no production deployment, no live payments, PR #2 not merged, no changes outside this repository, no clinical draft deployed as approved content.

## 7. Next steps

Priorities 1–5 remain open at varying depth (see §6) and are the natural continuation of Phase 15 in further small batches, each followed by local verification, commit/push, and both CI workflows confirmed green on the same commit, per the owner's standing Step 3 instruction.
