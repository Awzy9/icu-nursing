# Final P1 targeted/structural audit — 24 November 2026

## Coverage reconciliation
Base PR #115 head edfa5490db41b4954f307d6895391babaa91796e. Prior reports recorded 140 review events but 133 distinct indexed entries: MD-18, MD-20, SK-13, SC-01, SC-14, SC-16, SC-17 appeared both in the first ten and a later batch. The actual remaining count was 33, all core topics. This audit inspects selected narrative sections (especially key findings and escalation) of all 33. Union of unique IDs now covers 166/166. This is **initial targeted/structural coverage, not exhaustive clinical verification**. No canonical content modifications, review attestations, revision hashes or regression tests are included in this commit. The earlier tally is superseded.

| Draft type | Unique covered |
|---|---:|
| topics | 40 |
| questions | 11 |
| skills | 25 |
| medications | 50 |
| cases | 20 |
| equipment | 8 |
| practice | 12 |

## Remaining topic findings
| ID | Topic | Check scope | Finding and proposed action |
|---|---|---|---|
| D09-T01 | SBAR | Structural | Example gives 10-minute review for SBP 84 with confusion; replace with immediate emergency call/assessment and parallel monitoring, not waiting for routine SBAR. |
| D09-T02 | Documentation | Structural | Retain factual charting and audit trail; clarify urgent patient care precedes documentation, wrong-patient chart correction preserves audit trail and requires privacy/safety escalation. |
| D02-T08 | Shock recognition | Structural | Historical 2014 thresholds clearly labelled; 2025 guideline comparison remains incomplete. Emphasize multi-domain perfusion, shock without hypotension, and immediate escalation for instability. |
| D02-T14 | Cardiac arrest nursing | RCUK 2025 post-ROSC targeted | Post-arrest MAP and oxygen target need explicit source/population, reliable oxygen measurement and comatose-patient fever prevention; review complete ERC ALS/BLS separately. Do not use neurological prognostication from early isolated signs. |
| D02-T15 | Defibrillation safety | Structural | Preserve short pause and visual all-clear; distinguish manual versus mechanical compression and unsynchronized shock versus synchronized cardioversion, verify exact ERC guidance and device policy. |
| D03-T10 | Delirium | SCCM 2025 targeted | Distinguish routine prevention from treatment uncertainty on antipsychotics; new acute changes require emergency assessment as indicated; record hypoactive features and unassessable arousal rather than negative screening. |
| D04-T02 | AKI | NICE NG148 targeted | Oliguria threshold recognition should trigger early action without waiting for diagnostic duration; avoid automatic fluid bolus. New KDIGO 2027 public-review summary dated Nov 19 remains draft, not final guidance. |
| D06-T07 | VAE/VAP prevention | Structural | Keep distinction between surveillance event and clinical diagnosis; oral care without routine CHG specifically for VAP prevention; evaluate newer evidence and contraindications for head elevation and early feeding. |
| D07-T06 | Enteral feeding | Structural | Existing instability/aspiration escalation useful; verify current nutrition guidance and individualized shock/feeding readiness. Explicitly coordinate feed interruption with insulin plan and never use unconfirmed tube. |
| D01-T12 | ETT care | Structural | Cuff range described as background, not universal target. Suspected displacement or loss of capnography needs immediate airway support and help, no blind advancement or cuff reinflation to solve displacement. |
| D03-T01 | GCS | Structural | Non-testable is not score 1; avoid composite total if component untestable. Record component changes and confounders; escalate neurological change even when total cannot be calculated. |
| D04-T03 | Fluid balance | Structural | Generic NICE fluid thresholds do not establish ICU resuscitation orders. Distinguish cumulative balance, hourly output and clinical perfusion; assess catheter patency without delaying help, no reflex fluid bolus. |
| D01-T19 | Respiratory deterioration | Structural | NEWS2 bands are setting-specific; ICU monitoring must not default to ward-frequency intervals. Call emergency help immediately for severe respiratory compromise irrespective of score. |
| D02-T04 | Arterial line | SSC 2026 targeted | Conditional invasive/non-invasive recommendation and higher-risk invasive indications align with indexed guidance. Avoid blanket preference for an arterial value if waveform/zero suspect. Add separately sourced levelling/zeroing/dynamic response and never inject drugs into monitoring circuit. |
| D03-T09 | Sedation monitoring | SCCM 2025 targeted | Conditional drug preference only where light sedation/delirium reduction prioritized. Add sedation interruption eligibility and contraindication checks, paralysis not measurable by behavioural scale, immediate response for respiratory or circulatory compromise. |
| D07-T01 | Head-to-toe assessment | Structural | Primary survey must interrupt routine exam when patient unstable; fictional focal deficit needs immediate local stroke/emergency pathway, last-known-well documentation and glucose assessment without delaying help. |
| D07-T03 | Pain assessment | SCCM 2018/2025 targeted | Self-report first; vitals cue further assessment only. Behavioural tools require observable behaviours; paralysis may invalidate scores. Add safety reassessment after analgesia and urgent escalation for adverse effects. |
| D09-T03 | Scope | Structural | Avoid US/UK legal rules as universal. Local credentials, orders and nurse-led protocols differ; maintain safe patient care, escalate unsafe tasks and obtain qualified cover, document. |
| D02-T09 | Septic shock | SSC 2026 targeted | Retain peripheral initiation rather than delay under protocol and 65 initial MAP context. Recheck strength of each fluid recommendation, individualized reassessment and avoidance of unnecessary ongoing fluid. Add source-specific age and population limits. |
| D02-T12 | Vasopressor monitoring | SSC 2026 targeted | Preserve peripheral access recommendation and insufficient evidence on universal dose/duration/location. Ensure extravasation plan and urgent alternative support; verify all agent-specific evidence and target exceptions before release. |
| D05-T16 | High-alert medications/pumps | Structural | Escalation wording risks waiting to resolve discrepancy in unstable patient; immediate patient assessment and help. Prevent accidental bolus and interruption; independent verification where indicated, not sole safeguard. |
| D08-T03 | Blood products | Lifeblood targeted | Stop suspected reaction; explicit no flushing implicated line and alternative IV access as needed, urgent ABC assessment, emergency response and transfusion service notification. No unilateral restart; reaction-specific management needs specialist guidance. |
| D01-T17 | SBT/liberation | AARC 2024 targeted | Four conditional recommendations align at abstract level; FiO2 nonincrease is not instruction to withhold rescue oxygen if intolerant. Separate SBT success from extubation readiness, terminate intolerance per protocol, verify newer extubation sources separately. |
| D02-T02 | ECG fundamentals | Structural | One-mm ST abnormality statement too general for diagnostic ischemia/STEMI criteria; qualify lead/sex/age and clinical context. Telemetry is not diagnostic ECG; immediate instability assessment and shockable arrest versus tachycardia with pulse distinction. |
| D04-T06 | Potassium disorders | Structural | Preserve unresolved UKKA summary/detailed ECG threshold conflict and distinct continuous ECG indications; no wait for numeric threshold with unstable patient. Verify exact current UKKA source, product-specific KCl/calcium and insulin monitoring. |
| D04-T08 | ABG interpretation | Structural | Fictional pH 7.21/PaCO2 62/HCO3 24 is not a clean isolated respiratory acidosis example; verify internal consistency and expected compensation before teaching. Avoid treating normal pH as normal acid-base; emergency airway support for hypoventilation. |
| D04-T09 | CRRT | KDIGO status targeted | KDIGO site now links 2027 public-review summary dated Nov 19, not final replacement. Keep 2012 recommendations explicitly dated; reconcile safe blood return, prescription vs protocol changes, delivered dose and citrate monitoring. |
| D05-T01 | Sedatives | SCCM 2025 targeted | Conditional preference aligned; synchronize medication-specific monitoring with MD records (propofol syndrome, withdrawal, opioid ventilation, dexmedetomidine adverse effects). Distinguish sedation from analgesia and paralysis. |
| D05-T03 | Vasopressor pharmacology | SSC/NICE targeted | Norepinephrine preference in septic shock only, no renal-dose dopamine for AKI; synchronize access safety, ischemia/arrhythmia warnings and drug-specific monitoring with MD drafts. |
| D01-T06 | Ventilation modes | Structural | Volume control wording 'tidal volume guaranteed' is too absolute: intended set volume may not reach patient with leak, pressure-limit interruption or other device constraints. Teach set versus exhaled volume and model-specific nomenclature. |
| D01-T09 | Ventilator alarms | Structural | Patient-first emergency response present; model-specific alarm silence, ambient state and delays must not be universal. Ensure immediate help and effective ventilation in parallel, no unsafe alarm override. |
| D03-T03 | ICP/CPP | BTF 4th ed targeted | ICP >22 and CPP 60–70 supported for severe TBI only. Prior-edition indications not current graded recommendations; do not delay emergency assessment for numeric thresholds. Verify device-specific EVD/ICP positioning and orders separately. |
| D08-T02 | Coagulation tests | Structural | Old overt-DIC score flagged; confirm 2025 revised criteria before teaching. Citrate fill/processing laboratory-specific, distinguish sample contamination from disease; no unreviewed anticoagulant titration or independent diagnosis. |

## Fresh targeted external source checks
Only rows expressly marked targeted were compared with indexed recommendation text or public recommendation pages in this turn; structural rows require separate external checks. No full evidence tables or complete claim-level review claimed.

- NICE NG148: https://www.nice.org.uk/guidance/ng148/chapter/Recommendations
- SCCM 2018 PADIS: https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-prevention-and-management-of-pa ; 2025 focused update: https://www.sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline
- AARC 2024 SBT: https://pubmed.ncbi.nlm.nih.gov/38443142/
- RCUK 2025 post-resuscitation: https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/post-resuscitation-care-guidelines
- SSC 2026: https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
- KDIGO status: https://kdigo.org/guidelines/acute-kidney-injury/ ; November 19 summary https://kdigo.org/guidelines/acute-kidney-injury/kdigo-2027-aki-akd-guideline-public-review-draft-summary-of-recommendations-and-practice-points/
- BTF severe TBI: https://braintrauma.org/coma/guidelines/severe-tbi
- Lifeblood reaction response: https://www.lifeblood.com.au/health-professionals/clinical-practice/adverse-events/management-of-suspected-reactions

## Implementation queue (proposed, not completed)
1. Safety-critical: immediate escalation vs delayed assessment, airway/ventilation and paralysis, vasoactive continuity and extravasation, medication toxicity, transfusion reactions, CRRT safe return, potassium/glucose safety. Reconcile related narrative, checklist, scenario and MCQ scoring.
2. Correct explicit educational inaccuracies and ambiguous examples (ventilator delivered volume, ST diagnostic criteria, ABG example, scope-of-practice and transfer distractors); obtain exact primary sources.
3. Fill equipment parameter gaps only using appropriate evidence and device-specific documentation; do not invent settings or procedures. Resolve guideline conflicts, dated sources and current draft status.
4. Recompute canonical draft index/history after edits, add regression tests and run workflows. Verify all remaining source gaps and commercial rights, obtain independent human clinical/pharmacist approval and separate release authorization. Do not change flags or publish to production merely because the initial audit is complete.

## Unique ID manifest
- topics: D06-T01, D06-T04, D06-T05, D07-T04, D09-T01, D09-T02, D01-T03, D01-T07, D01-T11, D02-T08, D02-T14, D02-T15, D03-T10, D04-T02, D06-T07, D07-T06, D01-T12, D03-T01, D04-T03, D01-T19, D02-T04, D03-T09, D07-T01, D07-T03, D09-T03, D02-T09, D02-T12, D05-T16, D08-T03, D01-T17, D02-T02, D04-T06, D04-T08, D04-T09, D05-T01, D05-T03, D01-T06, D01-T09, D03-T03, D08-T02
- questions: XQ-01, XQ-02, XQ-03, XQ-04, XQ-05, XQ-06, XQ-07, XQ-08, XQ-09, XQ-10, XQ-11
- skills: SK-01, SK-02, SK-03, SK-04, SK-05, SK-06, SK-07, SK-08, SK-09, SK-10, SK-11, SK-12, SK-13, SK-14, SK-15, SK-16, SK-17, SK-18, SK-19, SK-20, SK-21, SK-22, SK-23, SK-24, SK-25
- medications: MD-01, MD-02, MD-03, MD-04, MD-05, MD-06, MD-07, MD-08, MD-09, MD-10, MD-11, MD-12, MD-13, MD-14, MD-15, MD-16, MD-17, MD-18, MD-19, MD-20, MD-21, MD-22, MD-23, MD-24, MD-25, MD-26, MD-27, MD-28, MD-29, MD-30, MD-31, MD-32, MD-33, MD-34, MD-35, MD-36, MD-37, MD-38, MD-39, MD-40, MD-41, MD-42, MD-43, MD-44, MD-45, MD-46, MD-47, MD-48, MD-49, MD-50
- cases: SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, SC-07, SC-08, SC-09, SC-10, SC-11, SC-12, SC-13, SC-14, SC-15, SC-16, SC-17, SC-18, SC-19, SC-20
- equipment: EQ-01, EQ-02, EQ-03, EQ-04, EQ-05, EQ-06, EQ-07, EQ-08
- practice: PX-01, PX-02, PX-03, PX-04, PX-05, PX-06, PX-07, PX-08, PX-09, PX-10, PX-11, PX-12
