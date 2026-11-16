# Phase 14 - practical nursing education

## What was built
**Practice labs** (`/practice`): interactive exercises for six areas, all driven by one shared exercise schema and pure, deterministic scoring (`packages/schemas/src/practice.ts`, unit-tested):
SBAR communication, bedside documentation, monitoring and escalation, infection prevention and safety, practical equipment education, competency checklists.

Exercise kinds: sort statements into categories (SBAR parts, clean/used), spot the problems in a record, put steps in order (keyboard-operable up/down buttons), choose the best action (optionally with a data table), and self-assessment checklists. After checking, every item is explained and a short debrief is shown. Everything is English and Arabic (right-to-left) and axe-clean in the end-to-end tests.

**Competency self-assessment map** (`/practice/competencies`): the learner rates themselves against the skills list (not started, learning, practised with support, practised independently). It is a personal record kept in the browser only; it is never sent to a server, never scored and never presented as verification. A print view and a "clear my data" control are provided.

## What learners see
Only **ten synthetic, nonclinical exercises** about a fictional workshop (`packages/fixtures/practice.json`, codes `SYN-PX-nnn`). The schema requires `synthetic: true`; a test proves that none of the clinical drafts can satisfy it; a vocabulary test proves the fixtures contain no clinical terms or doses. Pages are switched off in a production environment, as the other fixture-driven modules are.

## What is held back (unpublished drafts)
Twelve original practical drafts (`content/drafts/practice/PX-01..12`, built by `build_practice.py`) with sources, support levels and declared gaps: two SBAR calls, two documentation exercises, two monitoring and escalation exercises, two infection-prevention exercises, two equipment exercises and two self-assessment lists. Fictional people only; no doses, thresholds or protocols; `partial` evidence; English only (Arabic not yet written); `self_assessment_only` enforced for the competency area. A validator (`src/lib/practice-draft-validator.ts`) checks the structure, source tracing, dose and verdict wording; the drafts appear in the staff draft register and index as type "practice" (12 of 12).

New sources read in full this phase and registered: Open RN Nursing Fundamentals 2.5 Documentation (CC BY). The CDC hand-hygiene page was read as a landing page only (YELLOW).

## Explicitly not done
No competency verification, certificate, badge, leaderboard or clinical approval exists anywhere. Scores are stored on the device. Server-side progress for signed-in users is a possible later increment once the content is reviewed.
