# ICU Nursing — high-risk clinical evidence audit, next batch

**Date:** 2026-11-21  
**Review type:** AI-assisted, targeted source comparison and clinical safety correction, **not** independent licensed-clinician or pharmacist approval.  
**Previous batch:** [AI_REVIEW_START_2026-11-21.md](AI_REVIEW_START_2026-11-21.md), which addressed sepsis, shock, hyperkalaemia and real CRRT alarm learning.

## Work completed

| Learner content | Directly checked | Correction made | Status and limits |
|---|---|---|---|
| D01-T07 **Ventilator parameters / driving pressure** | AARC 2024 patient-ventilator assessment clinical practice guideline, full accessible HTML; driving pressure is `Pplat – total PEEP`. | Specified total measured PEEP (including auto-PEEP if present), not set PEEP or peak pressure; warned that valid inspiratory hold/passivity and measurements matter. | Targeted source check only. Patient-specific targets, plateau measurement on each model and nursing/RT role require human/RT review. |
| D04-T09 **CRRT / heparin-induced thrombocytopenia** | KDIGO 2012 established HIT statement, ASH 2018 HIT probability guidance (abstract, official guideline summary), FDA/DailyMed US heparin label on heparin flushes. | Replaced wording that could imply any platelet fall automatically requires HIT treatment, or that catheter-lock/flush heparin exposure is optional by local policy. Clinician assessment of probability is essential; where HIT is clinically likely/confirmed, all heparin sources matter. Explicitly scoped dosing/choice to the treating team. Added bibliography for the additional sources. | Still needs full ASH algorithm/4Ts assessment by hematologist/nephrology/pharmacist and local protocol. No dosing. KDIGO 2026 AKI update was **still a public-review draft**, not adopted as a final guideline (verified 2026-11-21). |
| SK-17 **CRRT circuit monitoring skill** | Exact item in the safety section about HIT. | Corrected to include assessment of probability and all heparin exposure sources. Kept `support: partial` and `clinically_reviewed: false`. | Training, alarm handling and source permissions remain unverified for individual machines. |
| EQ-06 **CRRT equipment** | Exact safety statement copied from SK-17. | Same targeted HIT correction, added open clinical probability / local protocol gap. | Machine/therapy programming not independently approved. |
| SK-22 **Infusion pump safety skill** | FDA Infusion Pump Risk Reduction Strategies for Clinicians; high-risk infusion backup plans, pump problem escalation, patient monitoring. | Replaced blanket `Stop and report discrepancies or unresolved alerts` checklist language with patient-first assessment and a **risk-specific** escalation and contingency plan. A suspected over-infusion must not be ignored; an essential infusion must not be reflexively interrupted without safe response and transition as local procedure requires. | No drug-specific rates, emergency substitutions, pump programming instructions or medication approval. Must be reviewed by clinical pharmacist and nurse educator. |

## Source details (direct checks)

1. AARC, *Patient-Ventilator Assessment* (2024), recommendation on driving pressure (conditional, low-certainty): https://journals.sagepub.com/doi/full/10.4187/respcare.12007 . Text checked 2026-11-21. Source specifies plateau minus **total** PEEP.
2. ASH, HIT clinical guideline (2018; reviewed by expert work group in 2022): https://www.hematology.org/resources/clinical-practice-guidelines/venous-thromboembolism-guidelines/heparin-induced-thrombocytopenia and PubMed summary https://pubmed.ncbi.nlm.nih.gov/30482768/ . The official guidance recommends pretest probability assessment (4Ts) and against empiric heparin cessation/alternative therapy for clearly low probability; this is **not** equivalent to saying all suspected HIT should be ignored.
3. Current US heparin manufacturer labeling, FDA/DailyMed (accessed 2026-11-21): https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=32e34077-aff1-4ec7-f9b0-b8e240768fb8 . With diagnosed or strongly suspected HIT/HITT, the labeling includes **heparin flushes** among heparin sources that should be discontinued. Does not establish an international protocol for drug selection.
4. FDA clinician infusion-pump risk-reduction strategies, https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians . Checked current official webpage 2026-11-21. It calls for prompt pump assessment, risk-dependent backup plans, monitoring, device sequestering when faulty and local policy. It explicitly notes that not all strategies suit every pump, patient or setting.
5. KDIGO AKI/AKD guideline development page, https://kdigo.org/guidelines/acute-kidney-injury/ . As of this review, the available 2026 document is a **public-review draft**, not a final recommendation replacing KDIGO 2012.

## Cross-content verification

- Previous edits to real learner-visible `content/working-crrt.json` are retained; this batch corrects the **distinct CRRT draft skill/equipment/topic** HIT statements rather than claiming the live interactive alarm module is an operational manual.
- Corresponding draft-index content hashes and draft-history snapshots are regenerated for affected entries. The sources' `read` labels and clinical-reviewed flags are **not upgraded**.
- New unit tests assert the exact corrected clinical caveats and the integrity of the generated metadata.
- Draft source/permission and region applicability must still be checked, especially device-specific manuals and non-US medicines.

## What remains before removing the warning

All affected topics still have **no independent clinician approval**. Outstanding tasks include full recommendation-by-recommendation reviews, every MCQ answer and distractor, complete pharmacotherapy/infusion safety and calculator UI tests, local SOP assessment, translated content, licensing and specialty sign-off. This batch makes specific safety improvements but does **not** certify the corpus for bedside use.

**Batch counts:** 2 topic documents, 2 CRRT equipment/skill entries and 1 pump skill entry changed; 0 newly clinically approved. All patient examples remain fictional and labeled as such.
