# Batch 2 – internal evidence and content-quality review

Date: 2026-11-14 · Scope: the six drafts in `content/drafts/batch-02/` · Reviewer: the AI author itself (not independent, not clinical review).

All six drafts remain **AI-generated, DRAFT, NOT clinically reviewed**. Nothing was imported or published.

## 1. Method
1. **Claim trace.** 72 clinically meaningful claims were listed with their source, location (recommendation number, table or section), strength/certainty and each checked by an automated text match against the full text I downloaded (Europe PMC / NICE / AARC). Result: 72 of 72 matched (`batch-02-claim-trace.csv`). The match proves the cited wording exists in the source; it does **not** prove the paraphrase in the draft is perfect, so each row was also read by me against the draft sentence.
2. **Scope, safety, applicability and licence read-through** of every draft.
3. **MCQ audit** (automated checks + manual single-best-answer review).
4. **Conflict resolution** for the five issues the supervisor named (table below).
5. **Test run** (lint, typecheck, unit, content validation, database, E2E + axe).

Claims not in the trace are either (a) labelled in the draft as general practice not found in the sources read, or (b) local-protocol statements. Examples that remain **untraced by design**: hand hygiene before airway contact (D06-T07), tube-placement checks (D07-T06), nurse role statements.

## 2. Conflicts and how each was resolved or documented
| # | Issue | Evidence | Resolution in drafts | Status |
|---|---|---|---|---|
| 1 | **Cuff-pressure monitoring** (SHEA says frequent cuff monitoring is not recommended; common teaching checks cuffs regularly) | AARC Patient-Ventilator Assessment CPG 2024 (full text now read): *recommends assessing cuff pressure with a manometer* (strong, high certainty), *recommends against continuous cuff-pressure assessment to reduce VAP* (strong, high), says palpation is inaccurate, and states SHEA's recommendations agree. The trials compared every-8-hour with less frequent checks | D06-T07 now states both documents are consistent: intermittent manometer checks yes; continuous/frequent monitoring is not a VAP-prevention strategy; no interval or target range is given by either, so it is **local policy**. MCQ 6 rewritten | **Resolved** for principle; interval/target remain local |
| 2 | **Gastric residual volumes** | SHEA 2022: monitoring regurgitation/vomiting alone was as effective as also monitoring residual volumes *for VAP rates, ventilation duration and mortality* (one RCT). ESICM 2017: suggests delaying feeding when aspirate >500 mL/6 h (conditional, expert opinion) and treating a single large aspirate with prokinetics and reassessment | The two documents answer different questions; D07-T06 says so, labels the 500 mL/6 h figure as a conditional expert-opinion suggestion rather than a stop rule, and leaves measurement frequency and thresholds to unit policy | **Documented**; needs dietitian/CCP decision |
| 3 | **Lung-protective ventilation** (population) | ESICM 2023 recommendations are for **ARDS**. AARC 2024 recommends monitoring plateau pressure, tidal volume (4–8 mL/kg PBW), PEEP/auto-PEEP in **all ventilated patients** (strong, high certainty), and suggests assessing driving pressure (conditional, low certainty; table target ≤15 cmH₂O) | D01-T07 now separates the two scopes: ESICM = ARDS (low VT, proning, NMBA, ECMO); AARC = monitoring for everyone. The earlier statement that "no guideline gives a driving-pressure target" was **incorrect** and was corrected: ESICM gives none, AARC's table gives ≤15 at low certainty | **Corrected and resolved** |
| 4 | **Delirium care** (general-hospital vs ICU evidence) | NICE CG103 (general hospital, updated 2023) names CAM-ICU/ICDSC for critical care. SCCM PADIS 2018/2025 full text is behind a publisher block (the SCCM pages show only the abstract: 37 recommendations, 3 strong, 34 conditional) | D03-T10 states plainly that NICE is not ICU-specific, that PADIS recommendations were not read, and that PADIS may differ (drug use, screening frequency) | **Documented; blocked** |
| 5 | **Dated shock evidence** | ESICM consensus is from 2014. SSC 2021 (read in full) agrees on MAP 65 as a starting target (strong, moderate) for septic shock on vasopressors, supports capillary refill as an adjunct and lactate; SSC 2026 unread | D02-T08 labels the 2014 source as dated, adds the SSC 2021 cross-check for **septic** shock only, and does not imply the MAP target applies to every shock type | **Cross-checked; 2026 update unread** |

## 3. Other defects found and fixed
- D01-T07: the sentence "the guideline makes no recommendation on driving pressure" was wrong in scope (see #3); the register source (AARC PVA) is now actually read and cited.
- D06-T07: the table row implied that cuff checks were discouraged generally; reworded to "for VAP prevention" and to the AARC position.
- D07-T06: gastric-aspirate table row rewritten (different outcomes, not a true contradiction).
- D02-T08, D03-T10: limits sections made explicit about dated or missing evidence.
- Domain names in two drafts corrected earlier (D02-T08, D04-T02).

## 4. MCQ review (36 questions)
- Correct-answer positions: A 9, B 11, C 8, D 8 (within the 15–35% rule; no letter above 31%).
- Correct option is the longest in 13 of 36 (36%); no topic exceeds three of six.
- Shortest distractor 36 characters; every wrong option has its own explanation (108 explanations).
- All questions are scenario or judgment based (prioritisation, monitoring, escalation, scope, safety) and each has one defensible best answer after the fixes above.
- Residual weakness: MCQs were written and reviewed by the same system; no item has been validated by clinicians.

## 5. Nursing scope, safety and applicability
- Every draft carries a scope table separating independent nursing actions, protocol/order-dependent actions, and prescriber/RT/dietitian decisions; none instructs a nurse to change ventilator settings, start drugs or stop feeds beyond policy.
- Population-specific statements are marked (ARDS-only; septic shock only; adults only; UK-specific NICE pathways; US-centred SHEA).
- Local-protocol dependence is stated for cuff interval, aspirate thresholds, screening frequency, MAP targets and urine-output frequency.

## 6. Licensing
- CC BY-NC (ESICM ARDS, shock, enteral nutrition): cite and paraphrase only for a commercial platform; keep attribution.
- NICE (NG148, CG103): cite-only.
- AARC 2024 PDF: copyright Daedalus Enterprises; cite-only.
- SHEA 2022 (CC BY): reuse allowed with attribution.
- SSC 2021 PMC copy: temporary pandemic-period terms; cite-only.

## 7. Residual risks
1. Dated sources: shock (2014), enteral nutrition (2017), NICE AKI/delirium text mostly 2010–2013.
2. SSC 2026 and PADIS (2018, 2025 full text) not read; KDIGO 2026 is a draft.
3. AARC 2024 recommendations are respiratory-therapy guidance; the nurse's role in assessing parameters varies by country.
4. No clinical reviewer has seen any content.

## 8. Gate decision
Batch 2 passes the **internal** quality review with the conditions above. This is not clinical approval. Batch 3 has **not** been started and should stay on hold until the supervisor confirms the gate and the backlog decisions in `BACKLOG.md`.

## Addendum: internal QA of the three continuation drafts (D01-T03, D01-T11, D02-T15)

Same method: claim trace by text match (47 additional claims, all matched), scope/safety read-through, MCQ audit, licence check, and a pass over statements previously labelled "general practice" or "local protocol".

Findings and fixes:
1. **D01-T11:** the AARC suctioning guideline is internally inconsistent on catheter occlusion (abstract: <70% neonates and <50% children/adults; Table 1: <70% in infants, children and adults; text: restates the 2010 values and says the optimum is unknown) and on the appropriateness score for the 15 s limit (7 in the text, 9 in Table 1). The draft states the inconsistency and teaches no single ratio. No adult frequency study exists, so "as needed" for adults is marked as extrapolated. An unsupported statement about humidification/hydration was removed from the practice text and listed as untraced.
2. **D02-T15:** equipment-check items (patches, wet surfaces, metal contact, battery/cable checks) were not in the ERC text read; they are now labelled local protocol. Pad-position, 8 cm device distance, oxygen 1 m rule, pause timing, no shock during manual compressions and DSD statements trace to the ERC text. ERC commercial-use restriction recorded; content paraphrased, no figures/algorithms/tables; energy and drug doses omitted.
3. **D01-T03:** SpO₂ ranges are "committee support, evidence level C", not graded strong recommendations; the draft says so. Oximeter accuracy is sourced to NICE CG103, not AARC. Oxygen prescribing, CO₂-retention rationale and target-setting are labelled as not drawn from AARC.
4. All new MCQs passed the validator after length and distractor edits. Batch 2 positions: A 12, B 16, C 14, D 12 of 54.

Gate decision for the three drafts: pass the **internal** review; **not** clinically reviewed.

## Addendum 2: internal QA of D02-T14 (cardiac arrest)
47 claims traced (BLS, ALS, post-resuscitation care) – all matched. Fixes during QA: removed a nonsense distractor and short explanations; corrected "antiseptic" to "anti-seizure". Scope: drugs, energy, intubation drugs, targets and prognostication stay with the team; the draft states no nurse prognostication. Licence: ERC commercial use needs an agreement; draft paraphrases only. Blood-pressure aim: RCUK 2025 phrases it as SBP >100 or MAP >60–65, the ERC–ESICM text as MAP >60–65 – alternative measures, not conflicting (corrected after supervisory review).
