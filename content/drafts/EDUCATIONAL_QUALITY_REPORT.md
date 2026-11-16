# Educational quality report (Phase 3, 2026-11-15)
All content is AI-generated DRAFT and **not clinically reviewed**. This report covers technical and educational-quality checks only; it is not clinical approval and it cannot establish that a question has one clinically defensible best answer – that needs clinician item review.

## 1. MCQ audit (240 questions; script `scripts/audit-mcqs.ts`, output `MCQ_AUDIT.md`)
| Check | Before this batch | After |
|---|---|---|
| Answer positions A/B/C/D | 53/70/62/55 | **59/63/60/58.** (nine questions re-ordered; per-topic and per-batch validator rules still pass) |
| Distractors using absolute wording (always, never, only, completely…) while the key does not (a test-wiseness cue) | 138 (34 questions with two or more) | **67** (rewritten in 34 questions; the rewritten distractors were kept clearly wrong) |
| Correct option is the unique longest | 81 (33.8 %) | **84 (35.0 %)** – still above the 25 % expected by chance |
| Very short 'why not' explanations (under 25 characters) | 24 | 0 (lengthened; several had said only "Correct practice." or "Nursing assessment.") |
| Missing 'why correct', missing wrong-option explanations, fewer than four options | 0 | 0 (validator-enforced) |
| Question-type tags | – | judgment 43, prioritization 23, application 44, understanding 40, scope 37, safety 36, monitoring 14, assessment 1, documentation 2. |
Remaining automated flags: 124 questions, mostly (a) the unique-longest key, (b) the heuristic "no clinical context in an application-type stem" (many are false positives because the stem names a device or document, not a patient), (c) very short stems on understanding questions. These are listed in `MCQ_AUDIT.md`.

**Residual risks (need human item review):** length bias is reduced per topic (validator allows at most three of six) but not eliminated; some questions test document wording (for example "which statement matches the guideline") rather than bedside judgement; several scope questions share the same pattern (the prescriber decision is the key); distractors were written by the same author as the keys; correctness of every key rests on the cited source passage, which the claim trace checks only by wording.

## 2. Supporting references
- All 40 drafts have a reference section with URLs and access dates (validator rule). **566 statements** are traced to source text (wording match only; see `batch-02-claim-trace.csv`).
- Link check of the 58 unique URLs cited in the drafts: 54 reachable, 4 refused automated access (HTTP 403 from cdc.gov pages that were read earlier by other means): https://www.cdc.gov/infection-control/hcp/basics/standard-precautions.html, https://www.cdc.gov/infection-control/hcp/basics/transmission-based-precautions.html, https://www.cdc.gov/infection-control/media/pdfs/Guideline-BSI-H.pdf, https://www.cdc.gov/infection-control/hcp/c-i-dressings/index.html.
- All 35 draft-to-draft cross-references (for example "see D02-T12") point to existing topic IDs.

## 3. Readability of the drafts
Median draft length about 2,700 words (range 1930–3753); average sentence length about 15 words; mean Flesch reading ease about 29 (college level – expected for clinical text with guideline wording, but heavy for novice learners). Findings: the 20-section template is complete but long; section 9 tables are dense; MCQs sit at the end; no key-points summary or glossary exists. Recommendations in section 5.

## 4. The application's learning experience (code and test review)
What exists: library with search and filters; topic pages with a sticky "On this page" table of contents, readable line length, references and review-status panels; bookmarks; "mark complete" and viewed/in-progress tracking; a dashboard (in progress, recent, completed, bookmarked); sign-in, MFA and CAPTCHA flows; axe accessibility checks in E2E (127 passing). Placeholders only: skills, medications, simulation, exams and assistant routes show "coming soon". **Not present:** any quiz or question UI (the 240 MCQs exist only in draft markdown), case-based or scenario items, study or revision modes, spaced repetition, per-section progress, search inside a topic, glossary, print view. Draft content is deliberately not loaded into the app (no import).

## 5. Recommended improvements (non-clinical, can be built and tested without publishing drafts)
1. Add a structured **key points** block and a short learning-objectives card at the top of each topic template; collapse sections 9–20 by default on mobile.
2. Add a **glossary** and abbreviation tooltips (render-only, from a reviewed glossary file).
3. Show **reading time** per section and a "continue where you left off" link on the dashboard using stored progress.
4. Make the draft/review status banner persistent and consistent for any non-reviewed topic.
5. Implement the quiz engine and study modes described in `docs/INTERACTIVE_FEATURES_PROPOSAL.md`, developed against synthetic non-clinical fixtures.
6. Add a **print/export** stylesheet and per-section deep links.
7. Item-writing review of all MCQs by clinicians and an item-writing educator when the review phase starts (postponed by owner decision).
