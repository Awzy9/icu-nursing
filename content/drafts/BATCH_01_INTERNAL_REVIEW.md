# Batch 1 – internal content-quality review

Date: 2026-11-14 · Scope: the six drafts in `content/drafts/batch-01/` · Reviewer: the AI author itself.

**Limits of this review.** It was done by the same system that wrote the drafts, so it can catch inconsistencies, unsourced claims and structural defects, but it is **not** independent and **not** clinical review. It does not replace the qualified human reviewers (CLINICAL_REVIEWER_MATRIX.md). All six drafts remain DRAFT / AI-generated / NOT clinically reviewed.

## Method
1. Claim-to-source trace: for each factual statement I re-checked the text I had actually read (CDC PDF text, SHEA 2022 and SSC 2021 full texts, NICE chapters, AHRQ page, Open RN section, pressure-injury Quick Reference Guide).
2. Automated checks (validator + 23 unit tests): structure, status/no-review claims, scope labels, dosing patterns, MCQ quality (position balance, distractor length/plausibility, longest-correct-option bias, explanation for every wrong option), and new consistency checks: topic ID, domain name and source IDs must match the curriculum and register.
3. Manual read for scope (nursing vs prescriber), international wording, and MCQ single-best-answer.

## Defects found and fixed
| # | Finding | Fix |
|---|---|---|
| 1 | Three drafts used domain names that differ from the curriculum ("Professional Practice", "General ICU Nursing Care") | Corrected; a unit test now enforces it |
| 2 | Precautions draft stated three items (WHO "five moments", eye protection for droplet, dedicated equipment for contact) that were **not** on the CDC pages read | Kept as general practice but explicitly labelled as not from the sources read |
| 3 | CLABSI comparison table paraphrased the 2011 site-selection and prophylaxis recommendations loosely | Rechecked against the PDF text; table now states the exact categories (femoral avoid IA; subclavian preferred for non-tunneled adult CVCs IB; avoid subclavian in dialysis/advanced kidney disease IA; no routine systemic prophylaxis) |
| 4 | Sepsis draft defined septic shock from memory | Replaced with a statement that the Sepsis-3 definition is cited but not read; no criteria given |
| 5 | Sepsis MCQ 3 relies on "cultures before antimicrobials if no delay" | Verified in the SSC 2021 text (best-practice statement) and added to the comparison table |
| 6 | SBAR MCQ 5 had distractors that were too easy (television programme, neighbour's name) | Rewritten with plausible low-risk handover items |
| 7 | Documentation draft listed verbal-order read-back, which the section read does not cover | Labelled as outside the source; local policy governs |

## Checks that passed
- Every draft: DRAFT status, `clinically_reviewed: false`, empty reviewers, banner present, required 13 sections, scope table with independent / collaborative / needs order / prescriber labels, SBAR escalation, no dose or rate patterns, references with URLs and access dates, evidence/limits section.
- 36 MCQs: answer positions A 8 / B 9 / C 9 / D 10; correct option longest in no more than half the questions per topic; each wrong option has its own explanation; distractors are plausible, scenario-based and focus on prioritisation, monitoring, escalation, scope and judgment.
- No draft instructs a nurse to prescribe, choose a drug, or start a treatment without an order.

## Residual risks (cannot be closed by AI self-review)
1. **Pressure-injury draft** rests on an abridged Quick Reference Guide, not the full chapters; staging is deliberately absent.
2. **Sepsis draft** rests on NICE (UK) and SSC **2021**; the **2026** SSC update could not be read, so thresholds and timing statements may have changed.
3. **CLABSI draft**: the 2017 CDC chlorhexidine-dressing update was confirmed only from its landing page; antiseptic dry-time and local product details are not in any source read.
4. **Documentation draft** reflects one US open textbook section; national regulator standards are unverified.
5. **Precautions draft** is based on two CDC summary pages; duration/discontinuation criteria and WHO/ECDC guidance are not covered.
6. **SBAR draft** cites a tool description, not outcome evidence.
7. MCQ correctness has not been validated by clinicians; item statistics do not exist.
8. Arabic terminology and cultural fit are unreviewed.

## Verdict
The six drafts **meet the internal structural and source-traceability criteria** and are suitable to hand to human reviewers as DRAFT material. They are **not** approved, and nothing may be published or imported as reviewed content until the appointed reviewers (NE, BN, IPC, CCP, and a pharmacist where medicines appear) have genuinely approved each topic in the platform workflow. Batch 2 stays on hold until the owner says the Batch 1 gate has been passed, and the four blocked topics need accessible sources first.
