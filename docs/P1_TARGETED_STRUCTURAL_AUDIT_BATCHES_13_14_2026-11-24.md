# P1 targeted/structural audit — batches 13–14 (24 November 2026)

Base PR #115 head c497adce8266a5b199594e755f6adf72bb6b82c9. Twenty distinct additional drafts inspected: 2 equipment, 11 question sets (66 stems/answer rationales; targeted option review), 7 core topics (selected narrative and assessment material, not exhaustive question review). Cumulative targeted/structural coverage 140/166 (26 remaining). Proposed corrections only; no canonical edits or regression tests in this commit.

## Batch 13 — 121–130

| ID | Draft | Check scope | Findings / proposed action |
|---|---|---|---|
| EQ-02 | Ventilator controls and waveforms | AARC 2024 targeted | All five parameter explanations missing. Source supports assessing exhaled tidal volume/PBW, plateau pressure, PEEP/auto-PEEP and FiO2; source waveform definitions separately. Preserve patient-first response; emergency help and ventilation should be concurrent, not delayed for alarm diagnosis. |
| EQ-03 | Arterial pressure systems | CDC targeted; waveform structural | All three explanations missing. CDC infection-prevention statements cannot establish zeroing/levelling or dynamic-response technique. Source these separately; teach escalation for impaired perfusion, loss of waveform or disconnection without waiting to troubleshoot an unstable patient. |
| XQ-01 | Urinary catheter questions | CDC targeted | Q1 correct explanation says prescriber decides despite approved nurse-led removal being permitted in distractor explanation and CDC implementation guidance. Align question and explanation with authorized local nurse-led pathways. Six questions inspected. |
| XQ-02 | Peripheral IV questions | CDC targeted | Q2 routine phlebitis removal is supported; distinguish suspected vesicant extravasation, for which immediate removal may prevent aspiration/antidote per local protocol. Q5 longer-duration access selection is not automatic; consider infusate, vessel health, patient risks. Six questions inspected. |
| XQ-03 | Central line questions | CDC targeted | Q6 blanket prescriber-only removal wording conflicts with credentialed protocol-authorized removal. Q2 should include antiseptic contact/drying per product and policy, without inventing universal time. Six questions inspected. |
| XQ-04 | Transfer questions | Structural | Q1 default stabilization is correct in its cited scope but time-critical transfer may require parallel resuscitation under senior team plan; qualify the stem and answer. Q3 medication reserve is source-specific, not universal. Check exact ICS 2026 recommendations before edits. Six questions inspected. |
| XQ-05 | Chest drain questions | BTS targeted | Q2 fluid-drain pause/clamp versus Q3 bubbling drain no routine clamp distinction is present. Q6 specify conventional underwater-seal system and approved manufacturer water level. BTS article lists a June 2026 correction; exact correction content not verified, flag for follow-up. Six questions inspected. |
| XQ-06 | Mobilization questions | Structural | Q5 numerical thresholds explicitly reflect 2014 consensus; label these as screening criteria rather than proof of safety, and distinguish clinical stability and team assessment. Six questions inspected. |
| XQ-07 | CRRT alarms questions | Structural | Q1 distractor feedback implying return/disconnection or blood-flow adjustment is too broad; align with Q3 device-specific safe-return conditions and prescription/authorization boundaries. Q6 distinguish suspected HIT and confirmed HIT. Six questions inspected. |
| XQ-08 | Vasoactive safety questions | Structural | Q1/Q2 correctly prioritize urgent escalation and continuity through safe access. Q4 should connect rapid ventricular response to immediate patient assessment rather than only identifying a label warning; check exact product labels. Six questions inspected. |

## Batch 14 — 131–140

| ID | Draft | Check scope | Findings / proposed action |
|---|---|---|---|
| XQ-09 | Sedative/opioid questions | Structural | Q5 extend close monitoring to ventilation and level of consciousness; Q6 correctly prioritizes airway emergency. Verify formulation-specific vial handling in Q3 and avoid generalizing across products. Six questions inspected. |
| XQ-10 | NG position questions | Structural | Q2/Q3 withhold feed until confirmation; extend explicitly to medications and flushes when position unconfirmed. Q6 distinguish insertion training from competency for radiographic confirmation. Six questions inspected. |
| XQ-11 | Scope and escalation questions | Structural | Q3 clarify authorized protocol titration versus independently altering CRRT prescription; Q6 immediate assessment and escalation supported as clinical inference, not by CDC infection guidance. Six questions inspected. |
| D06-T01 | Sepsis recognition | SSC 2026 targeted | Existing 2026 timing distinction and cultures wording broadly aligned at recommendation level. Emphasize immediate bedside emergency response for deterioration irrespective of score; separate sepsis recognition from diagnosis and team-led treatment, check exact strength for each timing category. |
| D06-T04 | Standard and transmission precautions | Structural | Core route/task distinctions present. Recheck pathogen-specific exceptions, respirator fit testing, splash risk and exposure response; do not treat CDC summary as complete international isolation standard. |
| D06-T05 | CLABSI prevention | CDC targeted | Correctly recognizes 2017 CHG-dressing update supersedes two older statements. Confirm indication, patient age, product approval and suitability; avoid universal dressing advice, and align line removal scope with authorized protocol. |
| D07-T04 | Pressure injury prevention | Structural | Individualized turning and shock-related incremental repositioning present. Fictional case of cool heel with weak pulses should explicitly prioritize urgent assessment for impaired perfusion, not only wound prevention; verify 2026 guideline chapter and vascular guidance. |
| D01-T03 | Adult oxygen therapy | Structural | Existing probe bias and rising oxygen need advice useful. Verify targets by population and setting; make immediate emergency response for severe hypoxia/ventilatory failure explicit irrespective of numerical score or apparent probe fault. |
| D01-T07 | Ventilator parameters | AARC 2024 targeted | PBW, plateau and total PEEP distinction present. AARC recommends assessment of plateau, tidal volume/PBW and PEEP/auto-PEEP; driving pressure assessment conditional. Distinguish monitoring from treatment targets, do not apply ARDS strategy universally; review ESICM statements separately. |
| D01-T11 | Artificial airway suctioning | AARC 2022 abstract targeted | Abstract supports preoxygenation, shallow-first, limited duration, generally avoiding saline, sterile open suction; pediatric/neonatal as-needed frequency evidence distinguished. Retain declared catheter-size discrepancy pending full-text reconciliation; do not set universal preoxygenation increment. |

## External evidence inspected in this turn
- CDC CAUTI summary: https://www.cdc.gov/infection-control/hcp/cauti/summary-of-recommendations.html (nurse-directed removal protocols).
- CDC catheter infection summary and prevention strategies: https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infections/summary-recommendations.html and https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infection/prevention-strategies.html ; 2017 update https://www.cdc.gov/infection-control/hcp/c-i-dressings/summary-recommendations.html .
- BTS clinical statement: https://thorax.bmj.com/content/78/Suppl_3/s43 (selected indexed practice statements; linked June 2026 correction needs separate retrieval).
- AARC patient-ventilator assessment 2024: https://pubmed.ncbi.nlm.nih.gov/39048148/ (abstract recommendations).
- AARC suctioning 2022: https://pubmed.ncbi.nlm.nih.gov/35078900/ (abstract only).
- SSC 2026 adult recommendations: https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026 (selected indexed recommendation-level statements only).
These limited checks do not establish full guideline currency, comprehensive claim-level verification, source rights or clinical approval. Other rows are structural reviews of repository text, not external evidence verification.

## Next steps
Implement and test proposed corrections from batches 9–14, retain all clinical/pharmacist review and rights flags, and complete remaining 26 draft audits. No merge or publication.
