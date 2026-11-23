# P1 clinical curriculum — Batch 04 (2026-11-23)

**Purpose:** Align high-risk ICU medication references, infusion-pump nursing safety training, and emergency scenarios with evidence already in the project.  
**State:** Draft-only, AI-assisted, **not clinically approved**. No medications, dosages, concentrations, infusion settings or new patient-facing instructions have been released.

## Changes

| Draft | Problem found | Improvement and scope |
|---|---|---|
| `MD-20-calcium-gluconate.json` | A medicine label describing calcium use for symptomatic hypocalcaemia could be mistaken for proof of a universal calcium regimen for severe hyperkalaemia | Adds an explicit distinction: emergency hyperkalaemia treatment uses the UKKA-based potassium lesson and local clinician order, not automatic extrapolation of this individual US-labelled calcium product. Reinforces **stop administration through an injured IV site** and urgent expert escalation, without stopping unrelated essential infusions. The ceftriaxone, cardiac glycoside, calcinosis and ECG safeguards are preserved. |
| `SK-22-infusion-pump-safety.json` | A safe-looking pump display could distract from injured vascular access, and the pump-failure guidance could be misunderstood as a universal stop rule | Adds separate pathways for **suspected pump hardware/programming fault** versus **suspected extravasation through a functioning pump**. Both require patient assessment and urgent support; an affected IV site should not be used to continue delivery and essential treatment continuity must be clinician-directed. No unapproved device manipulation or replacement programming. |
| `SC-14-transfusion-reaction.json` | The scenario did not explicitly trace the initial response to ISBT's reviewed source and omitted a patient/product identity recheck | Updates the correct action and feedback: stop suspected reaction, assess, notify blood bank, confirm identities, preserve implicated set/component and maintain access without flushing blood left in the original set into the patient. Severe and mild-reaction workups / restart decisions remain clinician/blood-bank decisions. |
| `SC-15-crrt-circuit-complication.json` | Correct choices implied that learners independently check circuit flow/clear alarms or return blood | Rephrased to prioritize patient assessment, prompt escalation to an **authorised CRRT operator** and the prescriber, documentation of downtime, and device-specific local blood-return/treatment-termination procedures. Independent circuit manipulation or blood return is not taught. |
| `tests/unit/p1-high-risk-consistency.test.ts` | Cross-domain safeguards were not directly covered by a batch-specific regression test | Adds checks for clinical scope and unreviewed status, current validation rules, calcium warnings, blood bank reaction escalation, pump/access differences and the CRRT specialist boundary. |
| `src/content/draft-index.json`, `draft-history.json` | Repository requires deterministic generated metadata for every edited draft | Content hashes and history entries updated for `MD-20`, `SK-22`, `SC-14` and `SC-15`; verify against CI before acceptance. |

## References checked

1. FDA, [Infusion Pump Risk Reduction Strategies for Clinicians](https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians). General pump verification, risk monitoring, failed-device escalation, and contingency planning. Not device-specific.
2. US National Library of Medicine / DailyMed, [Calcium Gluconate injection](https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=13d7cfc9-ff7a-437e-8c21-d9709ac07d48), revised May 2026. Used only for cross-check of hazards against the **existing** source `L-CALCIUM` (a distinct product label). These product labels are **not interchangeable**. No new label-based dosing or formulation instructions added.
3. [International Society of Blood Transfusion (ISBT), Adverse effects of transfusion](https://www.isbtweb.org/resources/educational-modules-on-clinical-use-of-blood/adverse-effects-of-transfusion.html). Public educational discussion of suspected reaction recognition, assessment and reporting. `S-ISBT-ATR-EDU` is registered in `content/drafts/skills/NEW_SOURCES.csv` and has unverified reuse terms.
4. Alberta Health Services, [CRRT Alarm Management Care Pathway, January 2025](https://www.albertahealthservices.ca/assets/about/scn/ahs-scn-cc-dialyzingwisely-crrt-alarm-management-care-pathway-resource.pdf). **Device- and organisation-specific**, may not be copied into a universal CRRT operating policy. Previously registered as `N-AHS-CRRT-ALARM-2025`.

## Required before publication

- The PR must have successful lint, typecheck, unit, draft, database, mobile and E2E checks for the **final** commit.
- A practising critical-care nurse educator, critical-care pharmacist, intensivist, transfusion specialist and CRRT trained practitioner must check the relevant branches, clinical claims, intended competency level and local protocol assumptions.
- Source and figure commercial reuse permissions remain unverified; no source diagrams, drug tables or machine instructions were reproduced.
- The `content/drafts` to `working` exposure path must be governed by per-item independent approval rather than simply removing the draft banner.
- No PR merge, clinical approval stamp or production deployment is authorised by this batch.

**Remaining P1:** comprehensive scenarios and expanded GI/hepatic/endocrine, postoperative/trauma, chest-drain and pneumothorax curricula.
