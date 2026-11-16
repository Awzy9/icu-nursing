# AI-assisted targeted review: endotracheal tube care and ventilator parameters

**Date:** 2026-11-16. **Scope:** All 12 MCQ stems/options/answers/explanations across D01-T12 and D01-T07 inspected; selected recommendations checked against accessible guideline text. This is **targeted educational evidence verification**, not comprehensive narrative review or professional clinical approval.

## Primary sources directly checked

- AARC 2024 patient–ventilator assessment CPG, main text and recommendation statements: https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/ (AARC Respir Care 2024, DOI 10.4187/respcare.12007). Graded: plateau pressure, delivered VT/PBW, PEEP/auto-PEEP, airway skin assessment, cuff pressure via manometer **strong, high certainty**; driving pressure, FiO₂, airway securement/placement assessment **conditional** with varying low/very-low certainty; continuous cuff-pressure assessment **not recommended as a VAP-prevention intervention**, not a general prohibition on cuff monitoring.
- ESICM 2023 ARDS guideline, original open-access publication: https://pmc.ncbi.nlm.nih.gov/articles/PMC10354163/ . Adult ARDS population; low-VT strategy, prone positioning, recruitment maneuver harms and non-routine NMBA recommendations checked. CC BY-NC 4.0; commercial reuse of protected content requires separate permission.
- International 2026 device-related pressure injury full online chapter: https://internationalguideline.com/drpi . Its DRPI4 ETT-securement guidance is **conditional / very-low certainty** and explicitly excludes standard fixation devices during prone positioning.

## D01-T12: six ETT-care MCQs

| Q | Answer | Evidence review | Outcome |
|---|---|---|---|
| Q1 manometer pressure assessment | B | AARC explicitly recommends cuff pressure assessment using a manometer (strong/high). No universal interval is given. | Key unchanged; local schedule emphasized. |
| Q2 sudden ETT depth movement + lower exhaled VT | D | Urgent airway team assessment is a reasonable safety inference; **not** a direct graded AARC emergency protocol. | Clarified trained/locally authorized airway team and warned against independent tube repositioning. |
| Q3 SHEA VAP claim vs AARC cuff pressure | C | Distinction is supported: continuous cuff monitoring is **not an evidence-based routine VAP prevention measure**; intermittent cuff pressure assessment still has other safety purposes. | No key change. |
| Q4 device-associated mouth/skin injury | A | AARC strongly supports airway-adjacent skin assessment; international 2026 device guidance supports skin/securement checks and offloading. ETT manipulation needs stability precautions. | Retained; safe device-care details require local training. |
| Q5 lost capnography + desaturation | D | High-acuity airway concern, clinically reasonable; airway emergency responses require trained team and local algorithm, not provided by AARC CPG alone. | Retained. |
| Q6 tube reposition/exchange scope | B | Original text overly implied universal physician/RT exclusivity. Institutional protocols define who is trained and authorized. | Rewrote scope question and explanation to specify qualified airway personnel, not a profession-specific universal ban. |

## D01-T07: six ventilator-parameter/ARDS MCQs

| Q | Answer | Evidence review | Outcome |
|---|---|---|---|
| Q1 falling exhaled VT and rising peak pressure | C | Patient/circuit assessment and escalation appropriately prioritized over unapproved ventilator changes. Differential includes airway obstruction, compliance changes, circuit issues. | No key change; etiology not established from these data alone. |
| Q2 PBW versus actual weight | B | Lung-protective tidal volumes calculated from predicted body weight, derived from height and sex, rather than patient's measured mass. AARC and ESICM support. | Retained. |
| Q3 rising plateau pressure | D | AARC strongly recommends assessment; settings changed under local professional scope/protocol. | Retained. |
| Q4 prone positioning in ARDS | A | ESICM 2023 strongly recommends prolonged prone sessions for adult ARDS with persistent moderate–severe hypoxemia after stabilization (e.g. PaO2/FiO2 <150). | Retained; do not extrapolate to all ventilated patients. |
| Q5 possible ETT displacement during proning | B | Urgent call, maintain airway, use trained team rather than solo supination is sound safety inference; not directly a graded ESICM nursing intervention. | Retained. |
| Q6 rising peak pressure, lower VT and desaturation | C | Clear acute deterioration requiring urgent assessment and escalation. | Retained. |

## Important discrepancy and scope caveat

The **ATS 2024 ARDS update** conditionally suggests neuromuscular blockers in *early severe ARDS*, whereas ESICM 2023 strongly recommends against **routine continuous NMBA infusion** for *non-COVID moderate-to-severe ARDS*. These statements use different populations/treatment frames and should not be described simplistically as universal agreement or disagreement. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC10870893/ . Detailed reconciliation of this difference was not completed this batch and is **pending** for D01-T07 before formal clinical approval.

## Repository changes

- D01-T12: targeted revisions to MCQ Q2 and Q6 safety/scope explanations, committed `82c823e`; staff-only index and history updated at `cae796e`.
- D01-T07: inspected, no question text changed; no unsupported changes added.
- No clinician approval flags, review dates, paid features, learner publication, production deployment, or PR merge changed.
- Full guideline appendices/supplementary analyses and device-specific ventilator protocols were **not** comprehensively reviewed, and the 12 targeted item checks should not be reported as complete clinical validation.
- CI and isolated Supabase on newest commit must be independently verified before claiming code green.

**Total targeted recent MCQ checks across batches:** 54 questions (6 potassium, 6 septic shock, 6 sepsis recognition, 12 cardiac arrest/defib, 12 pressure/alarms, 12 ETT/vent parameters). **0 clinically approved.**
