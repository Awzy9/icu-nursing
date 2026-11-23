# P1 Clinical Curriculum — Batch 09: Coagulation and Postoperative Haemorrhage (2026-11-23)

**Status:** AI-generated, fictional nursing curriculum drafts only. **Not clinically reviewed, not validated for practice, not merged or deployed.**

## Completed changes

1. **`D08-T02` coagulation tests:** Inserted an original bedside response section for **active bleeding while anticoagulated**, separating immediate assessment and authorised emergency escalation from a non-urgent laboratory interpretation exercise. Revised the Q3 correct response and explanation to avoid passive "wait for orders" messaging in an unstable patient. The response requires a clinician or explicitly authorised emergency pathway to direct heparin interruption/reversal, transfusion components and diagnostic testing. Suspected preanalytical specimen errors do not negate observed bleeding.
2. **`SC-09` postoperative bleeding:** Kept rapid clinical and surgical escalation at the first decision. Strengthened the final step to incorporate the hospital's emergency issue and identification safeguards, bleeding and tissue-perfusion monitoring, and reporting serial platelet/PT/aPTT/fibrinogen/D-dimer results **without nurse-independent DIC diagnosis, blood-component selection or anticoagulant reversal**. The fictional patient remains the same case; three-step graph maintained.
3. **`tests/unit/p1-coagulopathy-postoperative-batch-09.test.ts`:** Five checks for immediate bleeding escalation, DIC version labeling and competence limits, first-step shock escalation, authorised emergency-transfusion safeguards and unreviewed scenario validation.
4. **`src/content/draft-index.json` and `src/content/draft-history.json`:** Updated deterministic metadata/hashes for modified items.

## Sources and provenance — scope-limited

- **ISTH SSC 2025** Iba T et al. *Updated definition and scoring of disseminated intravascular coagulation in 2025*. J Thromb Haemost 2025;23(7):2356-2362, doi:10.1016/j.jtha.2025.03.038; PubMed indexed abstract reviewed previously and bibliography rechecked 2026-11-23. The full proprietary scoring table was **not read or reproduced**. Existing `S-ISTH-DIC-2025` registered **RED/cite-only**.
- **2026 summary review** Iba T et al. *Introducing the New Definition and Diagnostic Criteria of DIC Released by ISTH in 2025*. Semin Thromb Hemost. 2026;52(1):10-17, doi:10.1055/a-2675-6068. Abstract inspected 2026-11-23; **not an independent bedside nursing guideline**. Confirms the phase/phenotype and version difference; not used for score calculation or table copying. https://pubmed.ncbi.nlm.nih.gov/40829630/
- **ARUP Consult DIC**: last full literary review 2020, page last updated January 2025, relevant HTML sections on laboratory patterns, serial findings and alternative disease explanations inspected 2026-11-23, not a treatment protocol. Existing `S-ARUP-DIC` **RED/cite-only**; `SC-09` marks review as *partial*.
- **Canadian Blood Services, Clinical Guide to Transfusion** https://professionaleducation.blood.ca/en/transfusion/clinical-guide/blood-administration (patient-monitoring and emergency reaction discussion read 2026-11-23). Supports the principle of observing the patient and following institution-specific transfusion protocols; the draft contains independently written generic safeguards, not its procedure/checklist. Commercial reuse terms unverified. Not registered as a new primary source for the case because local procedure and professional review are still required.

## Unresolved wider first-release scope

The original 40-topic inventory includes coagulation, postoperative bleeding simulation and enteral feeding, but **does not include dedicated GI haemorrhage, hepatic failure, pancreatitis or trauma/coagulopathy teaching topics**. The gap should be assigned a separately reviewed expansion scope; it is not evidence that those domains were covered by this batch. No unreviewed new diagnostic/drug advice has been introduced to fill the missing modules.

## Release blockers

- Independent ICU nurse educator, intensivist, surgeon, haematologist/transfusion specialist and pharmacist review of all decision options, priority labels, transfusion safeguards and local scope of practice.
- Explicit site policy for emergency-release blood component identification, haemorrhage management and heparin interruption; no universal protocols or drug doses provided.
- Source rights review, especially ISTH 2025, ARUP and any hospital-specific material. Red/cite-only sources must not be copied into commercial teaching content.
- CI, database and learning checks on the **latest commit**; fixing automated checks is not a substitute for clinical endorsement.
- Maintain `DRAFT` and `clinically_reviewed: false`, plus the learner-facing publication gate. **Do not merge or deploy.**
