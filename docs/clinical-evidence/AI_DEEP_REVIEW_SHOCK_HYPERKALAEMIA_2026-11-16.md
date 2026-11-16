# AI-assisted targeted deep review — Shock monitoring and adult hyperkalaemia

**Date:** 2026-11-16  
**Coverage:** Four published-to-GitHub-but-*unpublished-to-learners* draft corrections, six D04-T06 MCQs checked against specified UKKA 2026 recommendations, and a 2025 ESICM monitoring evidence update across related topics.  
**Verification scope:** Primary-source **official recommendation summaries, PubMed abstract and explicit 2014–2025 comparison**; NOT all evidence tables or all statements from the full ESICM guideline. This is not medical/clinical sign-off.

## Source findings and applied corrections

### ESICM shock guideline: 2014 consensus superseded by updated 2025 guidance

Official society and indexed abstract:  
- https://www.esicm.org/esicm-guideline-circulatory-shock-haemodynamic-monitoring/  
- https://pubmed.ncbi.nlm.nih.gov/41236566/ (2025;51:1971–2012; doi:10.1007/s00134-025-08137-z)

**Verified at recommendation-summary/abstract level:** serial perfusion assessment includes capillary refill; skin temperature and mottling supplement. In persistent shock after initial resuscitation, assess fluid responsiveness *before additional fluid*; dynamic indicators are preferred to static preload markers where applicable. Monitor cardiac output and/or stroke volume in nonresponders, use an arterial catheter in shock unresponsive to initial therapy and/or requiring vasopressors, and consider echocardiography as first-line imaging to classify shock. **ESICM does not grant nurses independent prescribing/titration authority**; the draft's scope labels stay unchanged.

**File corrections applied on development branch:**
- `D02-T08` updated earlier with `S-ESICM-SHOCK-2025` and limited-source-read caveats.
- `D02-T04` arterial line: differentiated ESICM 2025 general-shock catheter-monitoring statements from separate SSC 2026 sepsis-specific invasive-monitoring recommendations.
- `D02-T09` septic shock: added general shock serial-perfusion/dynamic fluid-responsiveness context while retaining SSC 2026 as the source for sepsis treatment.
- `D02-T12` vasoactive therapy: distinguished monitoring support from drug selection, administration access, and titration protocols.

**Unresolved:** complete 2025 ESICM guideline's 50 statements and graded evidence not exhaustively reviewed; 2014 remains cited for historical context; source-register entry `S-ESICM-SHOCK-2025` explicitly records a partial read. The three newly edited files' original `independently_written_note` descriptions of past source reading were left intact, but their updated §20 and bibliography clarify the newer evidence's partial-review scope. More complete citation reconciliation is needed before external clinical sign-off.

### UK Kidney Association July 2026 — conflicting hospital ECG thresholds

Official detailed guideline:  
https://guidelines.ukkidney.org/hyperkalaemia/11-1-ii-hyperkalaemia-in-hospital/11-1-2-ii-hyperkalaemia-in-hospital-14-1-14-2/  

Official hospital summary:  
https://guidelines.ukkidney.org/hyperkalaemia/6-summary-of-clinical-practice-guideline-for-hyperkalaemia/6-2-section-ii-hospital/

The detailed Guideline 14.1 calls for urgent **12-lead ECG when potassium is ≥6.0 mmol/L (1B)**, while the site's summary page states **≥6.5 mmol/L** for the same guideline number. Detailed Guideline 14.2 separately calls for continuous monitoring at ≥6.5 mmol/L, with hyperkalaemic ECG changes, or at 6.0–6.4 mmol/L where the patient is clinically unwell or potassium may rise rapidly (1C). This is an **internal discrepancy in the source**, not evidence that the two actions are interchangeable. We updated D04-T06 §20 to state both, and corrected the MCQ Q1 explanation from 'above 5.5' to the inclusive UKKA classification starting at **5.5**.

## D04-T06: six MCQs specifically reviewed against UKKA recommendation/rationale

| Question | Key | Audit result | Qualification |
|---|---|---|---|
| Q1, potassium 6.2 severity band | C | **Supported** — UKKA calls 6.0–6.4 moderate. | Explanation corrected: ≥5.5 is inclusive. |
| Q2, delayed sample, high potassium and normal ECG | A | **Supported at principle level** — avoid dismissing possible hyperkalaemia; urgent escalation and sample repeat are appropriate. | Exact laboratory pseudohyperkalaemia workflow, sample types and local escalation timing require local SOP. |
| Q3, monitoring after insulin/glucose for severe hyperkalaemia | D | **Supported conceptually** — serial glucose and potassium monitoring are indicated. | Timing details quoted in the explanation require line-by-line reconciliation with UKKA monitoring section before full MCQ evidence certification. |
| Q4, bradycardia and widening QRS in severe hyperkalaemia | B | **Supported** — hyperkalaemia ECG abnormalities with unstable rhythm warrant urgent escalation. | Treatment remains prescriber/protocol-led. |
| Q5, a normal ECG does not exclude hyperkalaemia | C | **Supported** by UKKA clinical rationale; ECG sensitivity is limited. | No ECG pattern alone is a definitive exclusion test. |
| Q6, drug selection/doses versus nursing monitoring | A | **Supported as a scope-of-practice teaching distinction**. | Exact role delegation varies by jurisdiction/employer; not a substitute for Saudi or local professional rules. |

**Audit level:** All six stems, four options, answer keys and provided rationales were *read* and checked for obvious mismatch with the cited UKKA detailed ECG recommendations and broad clinical rationale; where not independently cross-verified (Q3 exact timing), stated as pending. **Not marked comprehensively evidence-verified.**

## Reproducibility and safety

- No clinical reviewer status, approval date, pharmacist-review status, publication flags, learner-fixture content or clinician identity changed.
- Four content files were updated on the development branch, then the generated metadata-only `src/content/draft-index.json` and `draft-history.json` were regenerated and committed. The prior failure was a stale generated-index hash after D02-T08; no test was weakened to bypass it.
- **CI status:** GitHub Actions run results must be checked on the **final** content+metadata commit, not inferred from intermediate red builds. At the time of this note, the most recent CI workflows had begun but were not independently confirmed green.
- This effort has **not** performed a full professional review of all clinical topics. Prior first-pass screening covers 40/40 topic drafts, but this is not equal to 40 clinical approvals or full source verifications.

## Next substantive clinical checks

1. Full recommendation-level reconciliation of all six **septic shock** MCQs against SSC 2026 official statements, grades and exact scope.
2. Verify Q3's potassium/glucose monitoring timing against the current UKKA hospital monitoring section, then tighten wording if necessary.
3. Compare all four shock-related drafts with the complete ESICM 2025 guidance, including graded statements on invasive monitoring and context-specific MAP targets; do not infer universal targets.
4. Recheck pressure-injury draft against full 2026 guideline chapters and record the true partial/full read status.
5. Preserve unpublished/clinically-unapproved gates throughout.
