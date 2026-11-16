# AI-assisted evidence verification: D02-T09 septic-shock six MCQs

Date: 2026-11-16
Branch: `claude/vigilant-mendel-95k63h`
Clinical draft: `content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md`
Status: **Unpublished draft, not clinically approved; automated/source-level audit only.**
Primary source examined this round: official SCCM Surviving Sepsis Campaign **2026 adult recommendation-level webpage**, including its statements, population, strength, certainty and relevant remarks. **The complete guideline article, studies, supplements and all 129 statements were not read in this round.**

## Item-level audit against official source

| Question | Key | Decision and evidence | Applied change or limitation |
| --- | --- | --- | --- |
| Q1 blood culture vs antimicrobial timing | D | **Supported.** SSC 2026 strongly recommends cultures as soon as possible and ideally before antimicrobial therapy (low certainty). For possible/probable/definite septic shock, strongly recommends antimicrobials immediately, ideally within 1 hour of recognition (very low certainty). | Explanation now includes both grades and avoids implying cultures may cause delays to emergency antimicrobials. |
| Q2 dynamic fluid responsiveness | B | **Supported with methodological clarification.** SSC 2026 conditionally suggests dynamic over static/exam-only indicators (low certainty), e.g. passive-leg-raise or fluid-bolus response assessed with stroke volume / stroke volume variation / pulse pressure / pulse pressure variation. | Explanation updated: blood pressure alone is not an adequate substitute for such dynamic assessment. |
| Q3 who needs review | C | **Clinical reasoning consistent** with poor perfusion and escalating vasoactive support, but this is a constructed priority judgment, *not* a graded SSC statement or source-validated clinical scoring instrument. | Fixed text saying “Three patients” despite four choices. No fabricated numeric threshold added. |
| Q4 antipyretics for outcomes | A | **Supported.** SSC 2026 conditionally suggests against antipyretics or surface cooling *to improve clinical outcomes* (very low certainty), while permitting use for symptoms/pain or other indications. | Existing answer and rationale appropriately scoped; unchanged. |
| Q5 post-resuscitation fluid removal | A | **Supported with indication caveat.** SSC 2026 conditionally suggests active fluid removal after *acute resuscitation* (very low certainty); considers vasopressors, cardiorespiratory function, course, weight, oedema and balance, not oedema alone. | Stem now states acute resuscitation ended and includes contextual clinical variables; explanation clarifies conditional nature, not mandatory removal. |
| Q6 nursing vs prescribing | D | **Reasonable role distinction**, but official SSC guidelines do **not** establish country-specific legal prescribing or nursing scope. | Key unchanged; must be cross-checked with local regulator and workplace policy before clinical approval. |

## Additional follow-up from previous batch — D04-T06 potassium MCQ Q3

The UK Kidney Association **July 2026** Guideline 17.1.2 suggests potassium checks at least at **1, 2, 4, 6 and 24 hours** following recognition/treatment of moderate or severe hyperkalaemia (2C), while Guideline 17.2 recommends glucose monitoring at **0, 30, 60, 90, 120, 180, 240, 300, 360 minutes** following insulin-glucose therapy (1C).

This directly supports the *substance and quoted intervals* of D04-T06 Q3, which says repeated potassium and glucose checks are needed. No dose or insulin regimen was added. These schedules are educational representations of the UK guideline, not universal physician orders for all patients and jurisdictions.

Source: https://guidelines.ukkidney.org/hyperkalaemia/11-1-ii-hyperkalaemia-in-hospital/11-1-5-ii-hyperkalaemia-in-hospital-17-1-17-2/

## Original source and limitations

Official SSC 2026: https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
- Cultures / antibiotic timing: official recommendations and remarks.
- Dynamic assessment and serial perfusion: fluid resuscitation recommendations.
- Antipyretics: official conditional recommendation and exception remarks.
- Active fluid removal: official conditional recommendation and acute-resuscitation phase definition.

The above audit examined **all six MCQ stems, options, keys and explanations** alongside the source's matching recommendation text; question Q3 is clinical interpretation, Q6 depends on jurisdiction-specific scope. Therefore **six MCQs received targeted item-level review**, not formal approval or a complete topic-wide source audit.

## Version control and CI

- Unpublished D02-T09 MCQ text edited on development branch at commit `dc3a40b`.
- Generated staff-only draft index and history updated at commit `854cfa2`, with no approval flags changed.
- **CI must be confirmed separately on the actual final commit.** Previous intermediate failures must not be represented as successful runs.
- No clinician identities, approval flags, `reviewed_on` dates, learner fixtures, production release, or billing settings were changed.

## Next review targets

1. D06-T01 sepsis MCQ question-by-question against 2026 SSC and NICE NG253 (UK-specific rules separated).
2. D02-T08 shock recognition and D02-T12 vasoactive monitoring MCQs against graded 2025 ESICM and SSC 2026 text; complete 2025 guideline still not fully read.
3. D02-T14 arrest and D02-T15 defibrillation MCQs against 2025 ERC full primary text, with copyright restrictions.
4. Pressure injury draft D07-T04 against accessible 2026 full chapters; reconcile clinical grading and source-register scope.
