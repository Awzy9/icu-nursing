# AI-assisted evidence review: Sepsis recognition D06-T01, six MCQs

**Date:** 2026-11-16  
**Draft:** `content/drafts/batch-01/D06-T01-sepsis.md`  
**Status:** unpublished / AI-assisted evidence checked at selected claims, **not professionally clinically approved**. No published content, licensing status, approval or review date changed.

## Evidence consulted
- Surviving Sepsis Campaign **2026** official adult guideline recommendations (screening, cultures and antimicrobial timing; recommendation-level text rather than all full publication/evidence tables): https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
- NICE **NG253**, last updated Sept 2026, sections **Could this be sepsis?**, **Evaluating risk**, **Managing suspected sepsis** (relevant web recommendations; the full NG253 PDF and evidence reviews were not read): https://www.nice.org.uk/guidance/ng253/chapter/could-this-be-sepsis ; https://www.nice.org.uk/guidance/ng253/chapter/Evaluating-risk ; https://www.nice.org.uk/guidance/ng253/chapter/Managing-suspected-sepsis

## Six-question audit

| Item | Answer | Evidence outcome | Action |
|---|---|---|---|
| Q1: older patient with confusion, falling BP and family concern | D | NICE NG253 1.1.2–1.1.4 and 1.6.1–1.6.4 explicitly warn about nonspecific presentations, the relevance of family concern, and clinical judgment notwithstanding NEWS2. **Issue:** previous case omitted an explicit suspicion of infection, potentially blurring sepsis vs alternative causes of deterioration. | Added suspected wound infection, specified NEWS2, clarified urgency despite score 4; assess differential diagnoses too. |
| Q2: four patients, high score and new confusion/hypotension | A | NICE NG253 NEWS2 ≥7 high-risk band with suspected/confirmed infection; clinical concerns increase urgency. | No key change. Phrase ‘score’ is contextual to earlier NEWS2 teaching; if used standalone, specify NEWS2 to avoid ambiguous scores. |
| Q3: cultures and antimicrobial administration | C | SSC 2026 strong/low-certainty for cultures ideally before antimicrobial; antibiotic initiation urgency differs by probability of infection and shock status. | No key change; **question is intentionally broad** on suspected sepsis and should not invent a universal 1-hour rule where infection likelihood/shock are unspecified. |
| Q4: qSOFA screening | B | SSC 2026 **strong/moderate** recommendation prefers NEWS/NEWS2/MEWS/SIRS over qSOFA alone for acutely ill hospital patients. | Replaced stale retrospective 2021 test with current 2026 wording and clarified screen ≠ diagnosis. |
| Q5: antimicrobial/fluid prescribing vs nursing observation/escalation | D | Appropriate example of bedside nursing vs clinician-directed decisions, **not a national legal scope determination** by SSC/NICE. | Key retained; verify against jurisdiction/employer policies before approval. |
| Q6: locally approved warning system vs NICE thresholds | C | NICE NEWS2 1.1.8 applies to defined UK populations/settings aged 16+, not currently/recently pregnant. It is **not** an interchangeable international scoring system. | Improved stem and corrected answer explanation to require local policy + clinical judgment without inventing universal numerical thresholds. |

**Review depth:** Each of the six existing questions (stems/options/answers/rationales) was inspected; source-backed statements Q1, Q2, Q3, Q4, Q6 received targeted comparison against official recommendation webpages. Q5 is a role/scope illustration and requires additional profession-specific review. **This is not a line-by-line review of every section in D06-T01 and not clinical approval.**

## Edits
- `D06-T01` question-text refinements (9 precise substitutions), committed `cc1ce1a`.
- Generated unpublished draft metadata and audit history updated, committed `3f504a0`.
- **No reviewer field, `clinically_reviewed`, `reviewed_on`, `published`, or clinical publication gate changed.**

## Outstanding
1. Full source-level reconciliation of all narrative sections of D06-T01 (2026 SSC and UK NICE jurisdiction labels, time-to-antibiotics scenarios, uncertainty, diagnostics).
2. Add specialized nursing role/scope evidence for the target region and setting; do not translate UK-specific rules into universal or Saudi requirements.
3. Full clinician and appropriate IP/permission signoff remains external.
4. CI on the final combined commit must be checked; earlier red builds are not proof of success or failure of the corrected head.
