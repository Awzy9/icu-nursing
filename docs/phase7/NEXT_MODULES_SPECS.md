# Implementation specifications for the next modules (prepared, not started)

None of these modules is implemented. Each reuses the Phase 4-7 pattern: content tables learners cannot read, SECURITY DEFINER functions, a visibility gate that requires review, a fixtures engine with synthetic content for development, isolated-CI live tests, and draft content kept outside the database until reviewed. The AI assistant is not started.

## 1. ICU medication reference library (50 medications)
**Goal.** An independent reference of 50 commonly encountered ICU medications by category (vasoactives, sedatives and analgesics, neuromuscular blockers, anticoagulants, antiarrhythmics, insulin and electrolytes, antimicrobials, reversal agents and others), written for nursing practice.
**Hard rules.** No dose, concentration, rate, titration or compatibility values until a pharmacist has reviewed them against the current licensed label; the draft validator already blocks dose/rate patterns. Nursing content only: monitoring, high-alert status, administration safety, extravasation and escalation, with a "prescriber decision" label for choice and dose. Source order: current regulator label (FDA/EMA/MHRA, verify reuse), ISMP lists (permission), professional society guidance; Open RN Nursing Pharmacology (CC BY, images need checking).
**Data model (migration 0013).** `medication_items` (code, kind synthetic|clinical, category, localized name/class/nursing summary, `sections`, `evidence_status`, `license_status`, `label_version` and `label_date`, pharmacist reviewer, approver), `medication_monitoring_items` (ordered, localized, with support level), `medication_revisions`, `medication_bookmarks`. A separate nullable `medication_dose_notes` table, **absent in the first release**, is added only with a mandatory pharmacist signature column and a CHECK that blocks publication without it. Gate as `skill_is_visible` plus pharmacist sign-off and a label date not older than a configured limit.
**Functions.** `md_list`, `md_get`, `md_progress`, `md_set_bookmark` (search escaped as in `sk_list`). No learner writes beyond bookmarks.
**UI.** Category browsing, search, comparison of two entries, class-level safety alerts, revision history, "label date" and licence panel, Arabic and RTL.
**Tests.** DB (gate, no-dose invariants, immutability), unit (validator, fixtures), isolated live API, Playwright with axe. Synthetic fixtures use fictional drugs ("Examplol") with no clinical claim.
**Work estimate.** Architecture 1 batch; 5 drafting batches of 10 medications each, each limited by pharmacist review and label access. **Blockers:** pharmacist reviewer, label licensing decision, owner approval for any dose content.

## 2. Question bank expansion from 240 to at least 300 original MCQs
**Status.** 240 unreviewed draft MCQs (40 topics x 6) exist in the topic drafts; the bank itself holds only synthetic fixtures.
**Plan.** +60 questions (target 66) as original items tied to the skills and equipment topics: 25 skills x 2 judgment/scope items (50) plus 16 equipment/monitoring items. Same MCQ rules as `src/lib/draft-validator.ts` (A-D, one best answer, per-option rationale, scope label, no dose patterns, no nonsense distractors), traced to the same registered sources; items for the five unsupported skills are limited to safety-escalation and scope-of-practice judgment that needs no unsourced procedure.
**Quality gates.** Duplicate/near-duplicate detection across all 300 (normalised stem n-gram overlap), answer-position balance (A-D within 20-30%), difficulty balance, one independent clinical review per item before import, import only through the existing `qb_*` publication guard.
**Tooling to add.** `scripts/mcq-audit.ts` (duplicates, balance, reading level, banned patterns) and a coverage matrix from skills/topics to questions.
**Blockers:** clinical reviewers (the same as for the topic drafts).

## 3. Twenty clinical simulation scenarios
**Engine.** The Phase 5 case engine already provides branching steps, 0-2 scoring and scope labels; scenarios extend it rather than create a new engine. Extensions: a timed mode (server-anchored clock as in exams), vital-sign "state" cards that change with decisions, and a debrief page that lists the decision path against a reference path and links to the relevant topic and skill.
**Scope (20).** Cardiac arrest, post-arrest care, septic shock, hypoxaemic respiratory failure, ventilator alarm, unplanned extubation, hyperkalaemia, diabetic ketoacidosis, raised ICP, delirium and agitation, line infection, transfusion reaction, pump programming error, CRRT access problem, pressure injury, pain and sedation mismatch, bleeding anticoagulated patient, SBAR escalation, family communication, safe transfer.
**Rules.** Each scenario names its sources and scope labels, contains no dose values, is flagged DRAFT, and passes the case-structure guard (every step reachable, one 2-point and one lower option per step). Synthetic nonclinical scenarios remain the only visible ones until review.
**Tests.** Existing `cases` DB/unit/e2e patterns plus timed-mode tests. **Blockers:** clinical authors and reviewers; simulation educator for the debrief design.

## 4. Equipment and monitoring education
**Scope.** Bedside monitor and alarms, arterial pressure transducer set-up, ventilator interface, infusion pumps, defibrillator, CRRT machine overview, enteral feeding pumps, pressure-relieving surfaces, temperature management devices.
**Approach.** Device-neutral concepts first (what the parameter means, what a safe check is, when to escalate) from public guidance; device-specific content only from manufacturer documents obtained under licence and always labelled with the model and software version. The product is a "Equipment" category inside the skills library (reuse of `skill_items` with `category = 'safety-infection-devices'` and an `applies_to` device tag in a later migration), not a new engine.
**Interactive aids.** Labelled diagrams (SVG, alt text, Arabic labels), alarm-response decision trees reusing the case engine, and a quiz set reusing the question bank.
**Blockers:** manufacturer documentation licences (RED), image rights, biomedical-engineering reviewer.

## Sequence recommendation
1. Close skills source gaps for the five unsupported skills (Open RN access first; it is the only permissive source and a browser session unblocks it).
2. Medication architecture with synthetic fixtures and the pharmacist workflow, in parallel with the MCQ audit tooling.
3. Scenario engine extensions (timed mode, state cards, debrief) with synthetic scenarios.
4. Equipment content once device documentation is licensed.
