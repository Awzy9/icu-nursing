# Targeted evidence verification — pressure injury prevention and ventilator alarm safety

**Date:** 2026-11-16  
**Scope:** All six existing MCQs from `D07-T04` and all six from `D01-T09` were opened and examined (stems, 4 distractors, answer key and explanation), with targeted independent comparison against accessible primary sources. **This is not a comprehensive line-by-line review of both topic narratives or clinical approval.**
**Clinical status:** unchanged `DRAFT`, `clinically_reviewed: false`; no publication.

## Source coverage genuinely checked this batch

- International Guideline 4th ed., 2026 **Repositioning and Mobilization** chapter (good practice R1, R4–R6, conditional R7, R8, and their clarifiers/implementation remarks): https://internationalguideline.com/repositioning
- **Device-Related Pressure Injuries** chapter (device removal when feasible, DRPI4 recommendation and proning qualifier): https://internationalguideline.com/drpi
- **Skin and Tissue Assessment** chapter (medium/dark skin tones, visual plus tactile assessment): https://internationalguideline.com/assessment
- HAMILTON-C1 operator manual **v2.2.x**, manufacturer technical fault/event distinction and alarm recommendations: https://www.hamilton-medical.com/dam/jcr%3Afb63acb2-87c1-477d-add9-21fe559bf9e9/HAMILTON-C1_ops-manual_v2.2.x_en-us_10078281.00.pdf ; relevant extract reviewed via indexed manufacturer PDF, *not the entire PDF or every alarm type*. The 2020 edition named in the draft and the US release may have specific terminology differences.
- AARC **2024 Patient–Ventilator Assessment** guideline recommendations, including focus on bedside assessment, skin around artificial airways, manometer cuff pressure, and securement assessment: https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/ ; https://www.aarc.org/wp-content/uploads/2024/10/patient-ventilator-assessment-aarc-cpg.pdf (recommendation statements; entire guideline not reread this batch).

## D07-T04 — pressure injury prevention: six MCQs

| Question | Key | Finding | Editorial decision |
| --- | --- | --- | --- |
| Q1 heel skin changes while on vasopressors | B | Supported: assess, offload if safe, check perfusion, escalate. **Important clinical distinction:** dusky heel with poor flow may be ischemic; do not presume pressure injury staging without differential/perfusion assessment. | Retained key and prompt. |
| Q2 individualized turns | D | Supported by 2026 R4–R7. R7 conditionally permits **2 or 3 hour** intervals for many when appropriate support surface available, **very-low-certainty**; shock/hypoperfusion may need *more frequent incremental shifts*. | Added full chapter nuance to §9. No universal 2-hour rule. |
| Q3 tissue checks under medical devices | C | Supported by 2026 device chapter; do not destabilize ETT/catheters by manipulating securement alone. | Source summary amended to explicitly protect life-sustaining equipment. |
| Q4 support surface does not substitute for turning | A | Explicit in 2026 R1. | No key change. |
| Q5 darker skin detection | D | Supported by 2026 Skin/Tissue Assessment: color **plus** tissue temperature, consistency, edema, pain; blanching alone unreliable. | No key change. |
| Q6 physician-only device decision | B | **Scope error:** an unsafe implication of universally physician-only removal/replacement. The correct action is coordinated evaluation by **authorized airway/medical/nursing/RT team** according to competence and local protocols, not necessarily physician-only. | Rewrote stem, B option and rationale, preserving B as the answer. |

**Disclosure:** The three full online chapter pages were selectively reviewed for the above recommendations, but the *entire 2026 guideline*, all chapter reference lists and recommendation evidence tables were **not** verified. Draft metadata continues to reflect the Quick Reference Guide as the principal earlier-read source; §20 now records which additional full-chapter recommendations were examined. No copyrighted guideline tables were reproduced.

## D01-T09 — ventilator alarm response: six MCQs

| Question | Key | Finding | Editorial decision |
| --- | --- | --- | --- |
| Q1 alarm while preparing medications | C | Supported patient-first safety principle; respond to patient before routinely silencing alarm. | Rephrased awkward source attribution in stem. |
| Q2 HAMILTON-C1 timed alarm mute | A | Matches model-specific manual explanation; actual mute duration/behavior varies by version/model and alarm class. | Retained, device-specific warning. |
| Q3 multiple alarms | B | Manufacturer warns one triggering condition can cause several alarm messages; first assess patient and ventilation. | Retained. |
| Q4 alarm limits to extremes | D | Manufacturer warns extremes can defeat safety; investigate clinical/circuit cause and only trained authorized team adjusts limits. | Retained. |
| Q5 oxygen enrichment and alarm suppression | B | Manufacturer's v2.2.x material describes suppression of oxygen alarms during O2 enrichment. Do not treat as universal across models; monitor patient independently. | Retained with existing scope limitation. |
| Q6 'technical fault' | C | **Safety ambiguity fixed:** manufacturer distinguishes *technical events* where ventilation may continue from true technical faults that lead to safety ventilation or ambient state. In compromised ventilation, urgently ensure alternate ventilation, get help, tag device out of service and document code. | Clarified **technical fault and inadequate ventilation** in stem, alternative ventilation with help in option C, nuance in explanation. |

**Disclosure:** Full operator manual was not reread this batch; targeted indexed manufacturer extracts were used for technical event/fault and previous model-specific alarm claims, which still require full device- and software-version validation before clinical instruction.

## Other related topics screened for consistency

- `D01-T12` ETT care: AARC 2024 strongly supports manometer-based cuff pressure assessment and recommends *against continuous pressure monitoring specifically as a VAP-prevention intervention*; these are not contradictory statements. Source licensing and the nurse-vs-RT task boundaries require local review.
- `D01-T07` ventilator parameters: AARC and ESICM statements have different populations (all ventilated patients vs ARDS) and strengths, noted in draft. Full claim verification not completed here.
- Cross-topic ETT fixation in proning: 2026 DRPI4 gives a conditional very-low-certainty recommendation on fixation devices in adults, with a *do not use in prone position* clarification and manufacturer's device instructions. Full proning and airway securement protocols remain external.

## GitHub implementation and integrity

- Draft updates: `D07-T04` and `D01-T09` on the development branch, followed by regeneration of the staff-only draft index and version history at `b90a14a`.
- Only unpublished educational text and audit-history records changed. No clinical status, date of professional signoff, license permissions, published topic content, production deployment, payment integration, or PR merge.
- A unit/e2e/DB green CI result **has not been confirmed yet** for the final document commit.

## Remaining priority

1. Review the **six D01-T12 ETT-care MCQs** and the **six D01-T07 ventilator-parameter MCQs** against AARC 2024 and ESICM 2023 recommendation statements, including responsible scope and evidence grade.
2. Verify the device-specific HAMILTON-C1 operator manual against the exact PDF version listed in the draft and clarify the alarm/fault categories throughout the narrative.
3. Complete high-risk medication/transfusion and CRRT topic MCQs.
4. Preserve clinical-review gating and do not translate an AI evidence audit into professional approval.
