# Phase 14 - question bank quality (306 MCQs, all unpublished drafts)

Audit: `scripts/audit-mcqs.ts` (regenerates `content/drafts/MCQ_AUDIT.md`). Edits: `content/drafts/mcq_phase14_edits.py` (idempotent, run from the repository root).

## What the audit found
* Structure was sound: 306 questions, positions A/B/C/D balanced (75/79/77/75), no identical options, no near-duplicate questions (Jaccard 0.7), no template stem repeated four or more times.
* Answer length: the key is the unique longest in 23 % and the unique shortest in 24.5 %, which is chance level (25 % each); the mean key/distractor length ratio is 1.02. The ratio is reported, not targeted: no option was padded to move it.
* Real weaknesses: **33 explanations only named the source** ("This is the SCCM statement.", "Recommendation 14.7."), which teaches nothing; 21 stems had no context for an application-type question, and several source-recall questions were tagged as application, judgment or monitoring; a few distractors were noticeably thinner than their key.
* The flagging rule for "no clinical context" missed plural words ("patients"); it was corrected, so it no longer reports false positives.

## What changed (60 questions edited, no new clinical claim introduced)
* 41 explanations rewritten to say why the answer is right and why the others fail, restating only what the cited source and the question's own rationales already said.
* 21 stems given a short, realistic context (for example "A nurse is caring for an intubated adult patient...").
* 13 questions that ask what a guideline says are re-tagged `understanding`, because they test recall of the source rather than application.
* Distractors in 11 questions made more specific and plausible (the concrete details a real nurse would see), not longer for its own sake.
* The audit now also flags circular or thin "why correct" text (0 remaining), and reports questions per domain and repeated stem openings.

## Result
Flagged questions: 123 to 87 (all remaining flags are the informational "key is the unique longest" at chance level plus a handful of stylistic notes). Circular explanations: 33 to 0.

## Coverage and what is still open
Questions per domain: D01 48, D02 42, D03 24, D04 30, D05 18, D06 24, D07 24, D08 12, D09 18, expansion sets 66. Thinnest domains: D08 (12) and D05/D09 (18 each). New questions would need sources read in full; none were written this phase to avoid filler.
Every question remains an unpublished draft: none has had independent clinical review, and the learner-facing question bank still serves only the synthetic fixtures.
