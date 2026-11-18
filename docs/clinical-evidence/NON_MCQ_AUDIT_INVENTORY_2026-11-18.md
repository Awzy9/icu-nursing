# ICU Nursing non-MCQ audit inventory and findings

18 November 2026. This increment reconciles the clinical-audit branch with main at d19f2f9. It checks inventory coverage, generated catalog membership, dossier gaps, scenario references and guided path links. Clinical source checks in this increment are targeted to the findings listed below. A record’s inclusion in the inventory does not establish that every clinical statement in it was verified.

| Source records | Count |
| --- | ---: |
| Lessons | 40 |
| Medication monographs | 50 |
| Nursing skills | 25 |
| Branching scenarios | 20 |
| Equipment modules | 8 |
| Practice exercises | 12 |
| Total | 155 |

The interactive inventory includes 44 scored or keyed exercises across ECG, ABG, arterial waveform, CRRT, defibrillation, GCS, infusion calculation, NEWS2, transfusion and ventilator waveforms. This count includes items already examined in the MCQ audit. It also contains eight CRRT explorer components, six learning paths, the ventilator and haemodynamic simulators, and 25 skill checklists reused by the sequencing feature. All six paths resolve to real catalog entries. All 20 branching scenarios have valid next-step references.

## Findings addressed

| Record or feature | Finding and disposition |
| --- | --- |
| SK-22, EQ-04, PX-09 | Replaced generic instructions to stop for unresolved alerts with patient assessment, escalation and the drug-specific backup plan. FDA guidance specifically supports staying with a high-risk patient while a colleague obtains a replacement. |
| SK-17, EQ-06 | Promptly assess possible HIT using the local pathway. Clinically likely or confirmed HIT requires stopping all heparin exposures, including flushes and locks, under the authorized pathway. Circuit blood return depends on the specific failure, device instructions and local procedure. |
| MD-35 | Added the missing product-label warning about IV nitroglycerin with PDE5 inhibitors or riociguat. |
| NEWS2-02 | The keyed high-risk score of 7 is correct. The explanation now separates that emergency response from the response to a single-parameter score of 3 at a lower total. |
| Skill step ordering | The learner matches the lesson’s checklist order. The instruction now says that clinical actions can happen in parallel, depending on the patient and protocol. |
| Arterial waveform, CRRT alarm, GCS and transfusion labs | Carried across the previously reviewed lab corrections so the audit branch also teaches limits of the damping test, patient assessment before circuit troubleshooting, GCS stimulus criteria and immediate assessment of suspected transfusion reactions. |
| Equipment parameters | 26 explanations remain tagged as needing source support. These are explicit gaps in the source records. |

Sources: [FDA clinician infusion-pump safety](https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians), [ASH HIT recommendations](https://pmc.ncbi.nlm.nih.gov/articles/PMC6258919/), [PrisMax manual](https://usrenalacute.baxter.com/sites/g/files/ebysai3231/files/2020-12/Prismax%20Operator%27s%20Manual.pdf), [product-specific IV nitroglycerin label](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3f2c9570-a544-1982-e063-6294a90a3067) and [RCP NEWS2 charts](https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/).

## Limits

The repo still contains unverified narrative claims, device-specific instructions that require local manuals, product-specific medication restrictions, and gaps requiring primary sources or clinical review. The remaining work is claim-level verification across the inventory below and reconciliation with the actual deployed website and any database-only content. No approval or deployment is implied by this inventory. See the [respiratory audit](NON_MCQ_AUDIT_RESPIRATORY_2026-11-18.md) for the five detailed lesson checks completed on this branch.

## Record inventory

Each entry resolved in the generated working catalog. The last column shows the first relevant existing evidence or scope limitation where available. Refer to the record for the complete caveats.

### Lessons

| Record | Existing scope or evidence limitation |
| --- | --- |
| [D01-T03](../../content/drafts/batch-02/D01-T03-oxygen-therapy.md) | See lesson evidence and applicability section. |
| [D01-T06](../../content/drafts/batch-08/D01-T06-mechanical-ventilation-fundamentals-modes.md) | See lesson evidence and applicability section. |
| [D01-T07](../../content/drafts/batch-02/D01-T07-ventilator-parameters.md) | See lesson evidence and applicability section. |
| [D01-T09](../../content/drafts/batch-08/D01-T09-ventilator-alarms-nursing-response.md) | See lesson evidence and applicability section. |
| [D01-T11](../../content/drafts/batch-02/D01-T11-airway-suctioning.md) | See lesson evidence and applicability section. |
| [D01-T12](../../content/drafts/batch-03/D01-T12-ett-care-cuff-pressure.md) | See lesson evidence and applicability section. |
| [D01-T17](../../content/drafts/batch-07/D01-T17-weaning-sbt-extubation-readiness.md) | See lesson evidence and applicability section. |
| [D01-T19](../../content/drafts/batch-04/D01-T19-respiratory-deterioration.md) | See lesson evidence and applicability section. |
| [D02-T02](../../content/drafts/batch-07/D02-T02-ecg-fundamentals-rhythm-recognition.md) | See lesson evidence and applicability section. |
| [D02-T04](../../content/drafts/batch-04/D02-T04-arterial-line.md) | See lesson evidence and applicability section. |
| [D02-T08](../../content/drafts/batch-02/D02-T08-shock-recognition.md) | See lesson evidence and applicability section. |
| [D02-T09](../../content/drafts/batch-06/D02-T09-septic-shock-nursing-care.md) | See lesson evidence and applicability section. |
| [D02-T12](../../content/drafts/batch-06/D02-T12-vasopressor-inotrope-monitoring.md) | See lesson evidence and applicability section. |
| [D02-T14](../../content/drafts/batch-02/D02-T14-cardiac-arrest-nursing.md) | See lesson evidence and applicability section. |
| [D02-T15](../../content/drafts/batch-02/D02-T15-defibrillation-safety.md) | See lesson evidence and applicability section. |
| [D03-T01](../../content/drafts/batch-03/D03-T01-glasgow-coma-scale.md) | See lesson evidence and applicability section. |
| [D03-T03](../../content/drafts/batch-08/D03-T03-icp-cpp-monitoring-severe-tbi.md) | See lesson evidence and applicability section. |
| [D03-T09](../../content/drafts/batch-05/D03-T09-sedation-monitoring.md) | See lesson evidence and applicability section. |
| [D03-T10](../../content/drafts/batch-02/D03-T10-delirium.md) | See lesson evidence and applicability section. |
| [D04-T02](../../content/drafts/batch-02/D04-T02-aki.md) | See lesson evidence and applicability section. |
| [D04-T03](../../content/drafts/batch-03/D04-T03-urine-output-fluid-balance.md) | See lesson evidence and applicability section. |
| [D04-T06](../../content/drafts/batch-07/D04-T06-potassium-disorders.md) | See lesson evidence and applicability section. |
| [D04-T08](../../content/drafts/batch-07/D04-T08-acid-base-abg-interpretation.md) | See lesson evidence and applicability section. |
| [D04-T09](../../content/drafts/batch-07/D04-T09-crrt-principles-partial.md) | See lesson evidence and applicability section. |
| [D05-T01](../../content/drafts/batch-07/D05-T01-sedatives-partial.md) | See lesson evidence and applicability section. |
| [D05-T03](../../content/drafts/batch-07/D05-T03-vasopressor-pharmacology-partial.md) | See lesson evidence and applicability section. |
| [D05-T16](../../content/drafts/batch-06/D05-T16-high-alert-medication-pump-safety.md) | See lesson evidence and applicability section. |
| [D06-T01](../../content/drafts/batch-01/D06-T01-sepsis.md) | See lesson evidence and applicability section. |
| [D06-T04](../../content/drafts/batch-01/D06-T04-precautions.md) | See lesson evidence and applicability section. |
| [D06-T05](../../content/drafts/batch-01/D06-T05-clabsi.md) | See lesson evidence and applicability section. |
| [D06-T07](../../content/drafts/batch-02/D06-T07-vae-prevention.md) | See lesson evidence and applicability section. |
| [D07-T01](../../content/drafts/batch-05/D07-T01-head-to-toe-assessment.md) | See lesson evidence and applicability section. |
| [D07-T03](../../content/drafts/batch-05/D07-T03-pain-assessment.md) | See lesson evidence and applicability section. |
| [D07-T04](../../content/drafts/batch-01/D07-T04-pressure-injury.md) | See lesson evidence and applicability section. |
| [D07-T06](../../content/drafts/batch-02/D07-T06-enteral-feeding.md) | See lesson evidence and applicability section. |
| [D08-T02](../../content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md) | See lesson evidence and applicability section. |
| [D08-T03](../../content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md) | See lesson evidence and applicability section. |
| [D09-T01](../../content/drafts/batch-01/D09-T01-sbar.md) | See lesson evidence and applicability section. |
| [D09-T02](../../content/drafts/batch-01/D09-T02-documentation.md) | See lesson evidence and applicability section. |
| [D09-T03](../../content/drafts/batch-05/D09-T03-scope-of-practice.md) | See lesson evidence and applicability section. |

### Medication monographs

| Record | Existing scope or evidence limitation |
| --- | --- |
| [MD-01](../../content/drafts/medications/MD-01-norepinephrine.json) | Dosing, concentration, line and compatibility information are deliberately not included. |
| [MD-02](../../content/drafts/medications/MD-02-epinephrine.json) | Dosing and preparation for anaphylaxis versus septic shock: deliberately not included. |
| [MD-03](../../content/drafts/medications/MD-03-vasopressin.json) | Dosing, rate and preparation: deliberately not included. |
| [MD-04](../../content/drafts/medications/MD-04-dobutamine.json) | Dosing, correction of hypovolaemia and preparation: deliberately not included. |
| [MD-05](../../content/drafts/medications/MD-05-milrinone.json) | Dosing, renal adjustment and preparation: deliberately not included. |
| [MD-06](../../content/drafts/medications/MD-06-propofol.json) | Dosing, rate, lipid load, triglyceride monitoring and preparation: deliberately not included. |
| [MD-07](../../content/drafts/medications/MD-07-midazolam.json) | Dosing, rate, neonatal and paediatric specifics and preparation: deliberately not included. |
| [MD-08](../../content/drafts/medications/MD-08-dexmedetomidine.json) | Dosing, rate, maximum duration and preparation: deliberately not included. |
| [MD-09](../../content/drafts/medications/MD-09-fentanyl.json) | Dosing, rate, conversion and preparation: deliberately not included. |
| [MD-10](../../content/drafts/medications/MD-10-morphine.json) | Dosing, rate, renal and hepatic adjustment and preparation: deliberately not included. |
| [MD-11](../../content/drafts/medications/MD-11-ketamine.json) | Dosing, route-specific details and preparation: deliberately not included. |
| [MD-12](../../content/drafts/medications/MD-12-rocuronium.json) | Dosing, rapid-sequence specifics and preparation: deliberately not included. |
| [MD-13](../../content/drafts/medications/MD-13-cisatracurium.json) | Dosing, infusion management and preparation: deliberately not included. |
| [MD-14](../../content/drafts/medications/MD-14-heparin.json) | Dosing, concentration, flushes and compatibility: deliberately not included. |
| [MD-15](../../content/drafts/medications/MD-15-insulin.json) | Dosing, glycaemic targets, premixed bag strength and preparation: deliberately not included. |
| [MD-16](../../content/drafts/medications/MD-16-amiodarone.json) | Dosing, preparation, filter and line requirements: deliberately not included. |
| [MD-17](../../content/drafts/medications/MD-17-adenosine.json) | Dosing, rapid-push technique and preparation: deliberately not included. |
| [MD-18](../../content/drafts/medications/MD-18-magnesium-sulfate.json) | Dosing, strengths, preparation and pre-eclampsia regimens: deliberately not included. |
| [MD-19](../../content/drafts/medications/MD-19-potassium-chloride.json) | Dosing, concentrations, maximum rates and preparation: deliberately not included. |
| [MD-20](../../content/drafts/medications/MD-20-calcium-gluconate.json) | Dosing, concentrations, preparation and line compatibility: deliberately not included. |
| [MD-21](../../content/drafts/medications/MD-21-sodium-bicarbonate.json) | Cardiac arrest and acidosis guideline text (ERC/AHA) was not used; the role of bicarbonate in arrest is a prescriber decision. |
| [MD-22](../../content/drafts/medications/MD-22-piperacillin-tazobactam.json) | Susceptibility, renal adjustment and treatment duration: not included. |
| [MD-23](../../content/drafts/medications/MD-23-meropenem.json) | Renal adjustment and infection-specific information: not included. |
| [MD-24](../../content/drafts/medications/MD-24-vancomycin.json) | Level monitoring targets and ototoxicity detail: not included. |
| [MD-25](../../content/drafts/medications/MD-25-ceftriaxone.json) | The label read is a distributor-listed ceftriaxone for injection product. |
| [MD-26](../../content/drafts/medications/MD-26-cefazolin.json) | The label read is a premixed dextrose presentation; vial presentations differ. |
| [MD-27](../../content/drafts/medications/MD-27-azithromycin.json) | Atypical-pathogen and other indication detail: not included. |
| [MD-28](../../content/drafts/medications/MD-28-linezolid.json) | Dietary and other interaction detail: not included. |
| [MD-29](../../content/drafts/medications/MD-29-gentamicin.json) | Level targets, dosing interval and neuromuscular-blockade interactions: not included. |
| [MD-30](../../content/drafts/medications/MD-30-phenylephrine.json) | The label read covers hypotension during anaesthesia; critical-care vasopressor use and guidelines were not read. |
| [MD-31](../../content/drafts/medications/MD-31-dopamine.json) | Dose-dependent effects described in the label: deliberately not included. |
| [MD-32](../../content/drafts/medications/MD-32-nicardipine.json) | Blood-pressure targets and transition to oral therapy: not included. |
| [MD-33](../../content/drafts/medications/MD-33-labetalol.json) | Contraindications (for example heart block, asthma) were not summarised from the fields read. |
| [MD-34](../../content/drafts/medications/MD-34-esmolol.json) | Other labelled indications and the label read is from a distributor listing. |
| [MD-35](../../content/drafts/medications/MD-35-nitroglycerin.json) | Selected interactions are covered. Check current product labeling and pharmacy guidance for the full contraindication list and drug-specific timing. |
| [MD-36](../../content/drafts/medications/MD-36-furosemide.json) | Electrolyte supplementation decisions are for the prescriber and were not summarised beyond the label's statement. |
| [MD-37](../../content/drafts/medications/MD-37-lorazepam.json) | Dosing, benzyl alcohol and propylene glycol content, and paediatric detail: not included. |
| [MD-38](../../content/drafts/medications/MD-38-haloperidol.json) | Delirium and agitation use in intensive care is outside the label read; PADIS and delirium guideline text were not read for this entry. |
| [MD-39](../../content/drafts/medications/MD-39-hydromorphone.json) | Dosing, conversion between opioids and potency warnings: deliberately not included. |
| [MD-40](../../content/drafts/medications/MD-40-naloxone.json) | Dosing and duration of action relative to the opioid: deliberately not included. |
| [MD-41](../../content/drafts/medications/MD-41-flumazenil.json) | The label read is a distributor listing. |
| [MD-42](../../content/drafts/medications/MD-42-atropine.json) | Use in bradycardia and cardiac arrest (guideline-based) was not read; this entry covers label content only. |
| [MD-43](../../content/drafts/medications/MD-43-succinylcholine.json) | Dosing, storage conditions and paediatric detail: not included. |
| [MD-44](../../content/drafts/medications/MD-44-enoxaparin.json) | Renal impairment, reversal and anti-Xa monitoring: not included. |
| [MD-45](../../content/drafts/medications/MD-45-alteplase.json) | Eligibility, timing, dosing and blood-pressure criteria for each indication: deliberately not included. |
| [MD-46](../../content/drafts/medications/MD-46-tranexamic-acid.json) | Trauma, obstetric and surgical bleeding uses are outside the label read; guideline text for these uses was not read. |
| [MD-47](../../content/drafts/medications/MD-47-levetiracetam.json) | Dosing, renal adjustment and status epilepticus use: not included; seizure guideline text was not read. |
| [MD-48](../../content/drafts/medications/MD-48-mannitol.json) | Intracranial pressure targets and neurocritical care guideline text were not read; this entry covers label content only. |
| [MD-49](../../content/drafts/medications/MD-49-pantoprazole.json) | Stress-ulcer prophylaxis in intensive care is not a labelled indication in the label read; critical-care guideline text was not read. |
| [MD-50](../../content/drafts/medications/MD-50-hydrocortisone.json) | Septic shock, adrenal insufficiency and other ICU uses are not described in the label fields read; guideline text was not read. |

### Nursing skills

| Record | Existing scope or evidence limitation |
| --- | --- |
| [SK-01](../../content/drafts/skills/SK-01-arterial-line-care.json) | Zeroing, levelling, dynamic-response testing and damping: no source read; needs manufacturer IFU and a licensed procedural source. |
| [SK-02](../../content/drafts/skills/SK-02-central-venous-catheter-care.json) | Dressing and set-change intervals: sources disagree or are dated; the unit policy governs. |
| [SK-03](../../content/drafts/skills/SK-03-peripheral-iv-care.json) | Insertion technique, flushing, securement and extravasation first response: no authoritative text accessed. |
| [SK-04](../../content/drafts/skills/SK-04-endotracheal-tube-care.json) | Cuff target range and interval: unit decision; AARC range is narrative, not graded. |
| [SK-05](../../content/drafts/skills/SK-05-tracheostomy-care.json) | The guideline is one NHS board's document, past its review date (November 2024); numerical values (cleaning interval, cuff range, suction duration and vacuum) are marked partial and unit policy governs. |
| [SK-06](../../content/drafts/skills/SK-06-suctioning.json) | Adult as-needed frequency: no adult study found. |
| [SK-07](../../content/drafts/skills/SK-07-ventilator-safety-checks.json) | Alarm lists and causes, modes and weaning: out of this skill's sourced scope. |
| [SK-08](../../content/drafts/skills/SK-08-oxygen-delivery-devices.json) | Device-specific flow and FiO2 tables: not reproduced; manufacturer sources needed. |
| [SK-09](../../content/drafts/skills/SK-09-blood-transfusion.json) | First-line actions after a reaction: BSH guideline not accessed. |
| [SK-10](../../content/drafts/skills/SK-10-enteral-feeding.json) | Energy and protein targets, parenteral nutrition, refeeding, medicine administration via tubes: not covered. |
| [SK-11](../../content/drafts/skills/SK-11-nasogastric-tube-care.json) | Insertion, securement, flushing and unblocking: no accessible source. |
| [SK-12](../../content/drafts/skills/SK-12-urinary-catheter-care.json) | Insertion step sequence: not in the sections read. |
| [SK-13](../../content/drafts/skills/SK-13-chest-drain-monitoring.json) | Interpretation of bubbling and swinging, troubleshooting and drain removal: not in the practice points read. |
| [SK-14](../../content/drafts/skills/SK-14-pressure-injury-prevention.json) | Staging definitions and wound treatment: not in the Quick Reference Guide's prevention recommendations read; the full CPG chapters were not read. |
| [SK-15](../../content/drafts/skills/SK-15-patient-repositioning.json) | Prone positioning procedure: not covered by the sources read. |
| [SK-16](../../content/drafts/skills/SK-16-safe-patient-mobilization.json) | The detailed criteria tables (Figures 2-5) are images and were not read; the cardiovascular, neurological and other thresholds are therefore not drafted. |
| [SK-17](../../content/drafts/skills/SK-17-crrt-circuit-monitoring.json) | The alarm pathway is specific to one device family (PrisMax) and one health service; it is not a cross-manufacturer standard. |
| [SK-18](../../content/drafts/skills/SK-18-ecg-monitoring.json) | Rhythm interpretation, 12-lead ischaemia interpretation, paced rhythms and alarm management: not covered here. |
| [SK-19](../../content/drafts/skills/SK-19-defibrillator-safety.json) | Energy settings, drug therapy, post-arrest care, cardioversion and children: not covered. |
| [SK-20](../../content/drafts/skills/SK-20-patient-transport.json) | The guidance is UK (NHS) and covers inter-hospital transfer too; the ICU nurse's role on a given unit may differ. |
| [SK-21](../../content/drafts/skills/SK-21-infection-prevention.json) | The CDC/HICPAC isolation guideline's disease-specific precaution list (Appendix A - which organism needs which category) and its MDRO-specific chapter were not read; only section III.B's general category descriptions were. |
| [SK-22](../../content/drafts/skills/SK-22-infusion-pump-safety.json) | Drug-specific high-alert strategies, concentration standardisation and smart-pump configuration: not covered. |
| [SK-23](../../content/drafts/skills/SK-23-sedation-assessment.json) | RASS/SAS definitions, dosing, neuromuscular blockade: not covered. |
| [SK-24](../../content/drafts/skills/SK-24-neurological-assessment.json) | Interpretation bands, ICP/CPP management and brain-injury guidelines: not covered. |
| [SK-25](../../content/drafts/skills/SK-25-pain-assessment.json) | CPOT and BPS descriptors and thresholds, analgesic dosing, regional analgesia: not covered. |

### Scenarios

| Record | Existing scope or evidence limitation |
| --- | --- |
| [SC-01](../../content/drafts/scenarios/SC-01-septic-shock.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-02](../../content/drafts/scenarios/SC-02-cardiogenic-shock.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-03](../../content/drafts/scenarios/SC-03-acute-respiratory-deterioration.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-04](../../content/drafts/scenarios/SC-04-ventilator-alarm.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-05](../../content/drafts/scenarios/SC-05-sudden-oxygen-desaturation.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-06](../../content/drafts/scenarios/SC-06-accidental-extubation.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-07](../../content/drafts/scenarios/SC-07-raised-intracranial-pressure.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-08](../../content/drafts/scenarios/SC-08-acute-seizure.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-09](../../content/drafts/scenarios/SC-09-postoperative-bleeding.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-10](../../content/drafts/scenarios/SC-10-hypoglycemia.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-11](../../content/drafts/scenarios/SC-11-severe-hyperkalemia.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-12](../../content/drafts/scenarios/SC-12-acute-arrhythmia.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-13](../../content/drafts/scenarios/SC-13-cardiac-arrest.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-14](../../content/drafts/scenarios/SC-14-transfusion-reaction.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-15](../../content/drafts/scenarios/SC-15-crrt-circuit-complication.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-16](../../content/drafts/scenarios/SC-16-acute-hypotension.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-17](../../content/drafts/scenarios/SC-17-delirium-and-agitation.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-18](../../content/drafts/scenarios/SC-18-aspiration-event.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-19](../../content/drafts/scenarios/SC-19-anaphylaxis.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |
| [SC-20](../../content/drafts/scenarios/SC-20-acute-neurological-deterioration.json) | The branching content, consequences and scoring are the author's reading of the cited sources and have had no clinical review. |

### Equipment

| Record | Existing scope or evidence limitation |
| --- | --- |
| [EQ-01](../../content/drafts/equipment/EQ-01-monitors-alarms.json) | 2 parameter explanations still marked as needing evidence. |
| [EQ-02](../../content/drafts/equipment/EQ-02-ventilator-waveforms.json) | 5 parameter explanations still marked as needing evidence. |
| [EQ-03](../../content/drafts/equipment/EQ-03-arterial-pressure.json) | 3 parameter explanations still marked as needing evidence. |
| [EQ-04](../../content/drafts/equipment/EQ-04-infusion-pumps.json) | 3 parameter explanations still marked as needing evidence. |
| [EQ-05](../../content/drafts/equipment/EQ-05-defibrillators.json) | 3 parameter explanations still marked as needing evidence. |
| [EQ-06](../../content/drafts/equipment/EQ-06-crrt-systems.json) | 4 parameter explanations still marked as needing evidence. |
| [EQ-07](../../content/drafts/equipment/EQ-07-enteral-feeding-pumps.json) | 3 parameter explanations still marked as needing evidence. |
| [EQ-08](../../content/drafts/equipment/EQ-08-pressure-relieving-equipment.json) | 3 parameter explanations still marked as needing evidence. |

### Practice

| Record | Existing scope or evidence limitation |
| --- | --- |
| [PX-01](../../content/drafts/practice/PX-01-sbar-call-about-a-patient-who-is-getting-worse.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-02](../../content/drafts/practice/PX-02-sbar-call-to-raise-a-concern-about-a-prescribed.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-03](../../content/drafts/practice/PX-03-find-the-weaknesses-in-a-bedside-note.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-04](../../content/drafts/practice/PX-04-correcting-a-charting-error.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-05](../../content/drafts/practice/PX-05-a-rising-early-warning-score-that-has-not-reache.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-06](../../content/drafts/practice/PX-06-which-habits-weaken-monitoring-and-escalation.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-07](../../content/drafts/practice/PX-07-what-counts-as-hand-hygiene.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-08](../../content/drafts/practice/PX-08-storing-alcohol-based-hand-rub-safely.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-09](../../content/drafts/practice/PX-09-checking-an-infusion-pump-before-and-after-a-cha.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-10](../../content/drafts/practice/PX-10-a-monitor-alarm-sounds--patient-first.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-11](../../content/drafts/practice/PX-11-self-assessment--keeping-a-clear-and-safe-record.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |
| [PX-12](../../content/drafts/practice/PX-12-self-assessment-map-of-the-25-first-release-skil.json) | The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review. |

## Equipment parameter follow-up

The 26 previously missing descriptions now have explanations linked to source guidance or a named example device. All 28 parameter descriptions are present in the generated working edition.

| Module | Parameters covered | Evidence |
| --- | --- | --- |
| EQ-01 Monitors and alarms | ECG-derived heart rate and alarm priority | [Philips IntelliVue MX400–550 instructions, release T.0](https://www.documents.philips.com/assets/Instruction%20for%20Use/20260424/83cba6c0fe91400ea93ab436008655e7.pdf?feed=ifu_docs_feed) |
| EQ-02 Ventilator controls and waveforms | Pressure, flow, volume, respiratory frequency and alarm limits | [AARC assessment guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/), [HAMILTON-C1 software 3.0.x manual](https://www.hamilton-medical.com/dam/jcr%3A79e1c664-24e6-4dc7-8113-941781843520/HAMILTON-C1-ops-manual-SW3.0.x-en-10101866.00.pdf) |
| EQ-03 Arterial pressure | Displayed pressure, waveform, zeroing and levelling | [Saugel et al., arterial pressure measurement](https://pmc.ncbi.nlm.nih.gov/articles/PMC7183114/) |
| EQ-04 Infusion pumps | Programmed rate, displayed volume and pressure/air alarms | [FDA infusion-pump guidance](https://www.fda.gov/medical-devices/infusion-pumps/infusion-pump-risk-reduction-strategies-clinicians), [Alaris v12.1 manual](https://www.bd.com/content/dam/bd-assets/na/medication-management-solutions/documents/user-guide/Alaris_System_User_Manual_Approved.pdf) |
| EQ-05 Defibrillators | ECG signal, selected energy and charge state | [ERC 2025 ALS](https://www.erc.edu/media/vedoa2ga/gl2025-05-als-e.pdf), [ZOLL R Series guide](https://www.aedsuperstore.com/pdf/zoll-r-series-defibrillator-manual.pdf) |
| EQ-06 CRRT | Pressures, blood flow, delivered therapy and alarms | [Alberta Health Services alarm pathway](https://www.albertahealthservices.ca/assets/about/scn/ahs-scn-cc-dialyzingwisely-crrt-alarm-management-care-pathway-resource.pdf), [KDIGO AKI guideline](https://kdigo.org/guidelines/acute-kidney-injury/) |
| EQ-07 Enteral pumps | Set rate, recorded volume and occlusion alarm | [Kangaroo 224 operating manual](https://d17eythm3w95tp.cloudfront.net/media/123415/01k9a81fyhfg9avvf9dv359vmg.pdf) |
| EQ-08 Pressure-relieving equipment | Mode, inflation state and alarms | [Hillrom P290 mattress instructions](https://www.hillrom.co.uk/content/dam/hillrom-aem/emea/en/marketing/products/p290-mattress/documents/213960EN.pdf) |

These notes explain what the displays and settings represent. Operating steps, model-specific alarm thresholds, unit policies and independent clinical sign-off remain outside this check.

## Medication safety follow-up

This pass checked four medication monographs against prescribing information and emergency recognition guidance. It updated the authored records and their generator inputs.

| Record | Finding and correction | Evidence |
| --- | --- | --- |
| MD-28 Linezolid | Moved interaction review before administration and made the weekly CBC plan explicit. | [ZYVOX prescribing information](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/21132s049lbl.pdf) |
| MD-40 Naloxone | Made immediate airway and ventilation support explicit and retained monitoring for recurrent respiratory depression. | [Naloxone injection prescribing information](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=bd65e3fe-cd7a-4855-8f55-8cc3a0921ccc) |
| MD-41 Flumazenil | Distinguished contraindications from seizure risk factors, including serious cyclic antidepressant overdose and benzodiazepine use to control a life-threatening condition. | [Flumazenil prescribing information](https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=74d007e9-9604-0941-e053-2a91aa0a29c4) |
| MD-43 Succinylcholine | Added the contraindication after the acute phase of specified injuries and clarified that suspected malignant hyperthermia needs urgent escalation before a high temperature develops. | [Succinylcholine prescribing information](https://dailymed.nlm.nih.gov/dailymed/downloadpdffile.cfm?setId=cb5b3361-9099-4a12-b545-f1e50b0781dd), [European Malignant Hyperthermia Group](https://www.emhg.org/recommendations-1/2024/11/4/recognising-and-managing-a-malignant-hyperthermia-crisis-v2024) |

This targeted check does not establish comprehensive review of the 50-monograph set or local product applicability.
