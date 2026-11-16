# AI-assisted targeted evidence review — ICU sedatives and vasopressor pharmacology

**Date:** 2026-11-16  
**Scope:** D05-T01 and D05-T03, six MCQs each (12 total), selected clinical claims, and source/version metadata.  
**Status:** targeted claim-level evidence checking only. **Neither draft is professionally clinically reviewed or approved; no learner publication.**

## Evidence consulted directly in this batch

- SCCM 2025 PADIS Focused Update, **official recommendation page**: https://sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline . The conditional/moderate-certainty preference for dexmedetomidine over propofol applies only when light sedation and/or reducing delirium are highest priorities in mechanically ventilated ICU adults. The page states insufficient evidence for a recommendation on benzodiazepines for ICU anxiety.
- SCCM Surviving Sepsis Campaign **2026**, **official recommendation page**: https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026 . Norepinephrine is first-line over dopamine (high-certainty), epinephrine and selepressin (each low-certainty); another conditional statement prefers norepinephrine over vasopressin or angiotensin II. Distinguish add-on strategies and context-specific cardiac dysfunction; do not extrapolate to all shock.
- FDA 2026 Diprivan/propofol US labeling, **public search snippet of precautions**, not full-label systematic review: https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/019627Orig1s077lbl.pdf . Infection-control, triglyceride and propofol-infusion syndrome precautions were identified; manufacturer labeling is not a critical-care clinical practice guideline.
- Drug-specific label and textbook items identified in the *pre-existing draft* were not individually fetched or re-read during this review. Their exact revision dates, dose/indication/contraindication contexts, and generalizability remain unverified by this batch.

## D05-T01 (sedatives), six MCQs

| Item | Answer | Targeted finding | Changes |
|---|---|---|---|
| Q1 IV lorazepam and respiratory depression | A | Existing draft accurately attributes respiratory suppression risk to a US introductory nursing textbook/label. No manufacturer-specific complete label check this batch. | Key retained. |
| Q2 benzodiazepine + opioid | D | Combination can cause profound sedation and respiratory depression; exact boxed warning not individually re-read this batch. | Key retained. |
| Q3 propofol/dexmedetomidine rather than benzodiazepines | A | Properly attributed to **PADIS 2018**, not falsely presented as the 2025 head-to-head statement. | Key retained. |
| Q4 unexpectedly unresponsive/hypotensive during sedation | C | **Safety/scope correction:** avoid universal protocol language about automatically pausing sedation or saying reversal agents *always* require an order in every legal setting. Severe hypotension/airway compromise demands immediate assessment, urgent help and authorized protocol actions. | Rewrote stem, correct answer and explanations; retained C. |
| Q5 2025 light-sedation preference | B | Matches **conditional/moderate-certainty** SCCM 2025 recommendation for specified priority, not all ventilated patients. | Key retained; source caveat emphasized in narrative. |
| Q6 sedation choice/target versus bedside nursing care | D | Appropriately describes common care-role distinctions but local authorization for sedation protocols varies by jurisdiction. | Key retained; needs local professional review. |

**Additional corrected inconsistency:** Draft subtitle had asserted no propofol or dexmedetomidine pharmacology even though it cites selected US FDA label safety excerpts for both; fixed to describe actual *limited label safety* evidence, without claiming complete ICU pharmacology.

## D05-T03 (vasopressors and inotropes), six MCQs

| Item | Answer | Targeted finding | Changes |
|---|---|---|---|
| Q1 norepinephrine mechanism | A | Introductory textbook mechanism plausible; receptor-specific clinical effects not cross-verified against full pharmacology textbook this batch. | Key retained. |
| Q2 first-line vasopressor in adult septic shock | C | SSC 2026 **strong** recommendation for norepinephrine over dopamine, epinephrine and selepressin, with separate certainty grades; separate conditional guidance for vasopressin or angiotensin II. | Explained certainty and context more precisely. |
| Q3 dopamine, low urine output but normal pressure | D | **Safety issue identified:** former rationale said the *dopamine dose may need reduction*. Oliguria may reflect multiple processes and does not itself dictate a dopamine rate change. | Replaced answer D with verify trend/perfusion, investigate collection issues and promptly escalate. Clearly leave drug/rate decisions to authorized team. |
| Q4 dobutamine monitoring | B | ECG, blood pressure and perfusion monitoring consistent with established drug safety principles; no complete label re-read this batch. | Key retained. |
| Q5 epinephrine extravasation checks | C | Plausible introductory text/label safety statement; manufacturer-specific full label review pending. | Key retained. |
| Q6 prescriber vs bedside administration decisions | A | Drug choice is a prescribing decision, but trained bedside infusion titration may be protocolized; no universal profession-only rule. | Key retained; local scope verification pending. |

## Changes pushed

- `D05-T01` sedative-safety MCQ and source-description correction: commit `9e06112`.
- `D05-T03` dopamine-oliguria and SSC grading corrections: commit `52583e6`.
- Regenerated unpublished draft `src/content/draft-index.json` and history in `src/content/draft-history.json` after changes: commit `79840a4`.

**Integrity:** These edits do not include drug doses, rate orders, reviewer identities, altered `clinically_reviewed` flags or publication. They are **not** an independently credentialed signoff.

## Follow-up

1. Obtain and compare full latest accessible manufacturer labels for midazolam, lorazepam, propofol, dexmedetomidine, norepinephrine, vasopressin, epinephrine, dopamine, dobutamine and phenylephrine with region-appropriate information.
2. Verify each MCQ explanation and distractor against actual label sections, not only introductory textbooks; explicitly distinguish pharmacology, monitoring and prescribing.
3. Investigate high-alert and adverse-effect source gaps for the outstanding 35 medication records, recording the exact availability and license.
4. Review clinical scenarios separately; automated content validators do not replace claim-by-claim safety review.
5. Check CI and isolated Supabase on **the final commit**, and do not claim green based on a previous commit.
