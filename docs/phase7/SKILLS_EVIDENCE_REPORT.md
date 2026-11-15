# Phase 7: skills evidence, licensing and coverage report

All 25 skills of the original master list (Part 6 of the master prompt) have a **DRAFT** record in `content/drafts/skills/SK-NN-*.json`. None is clinically reviewed, none is published, none is imported into the database or any learner-facing surface, and none is an approved competency assessment. The scope is the master list, unchanged (the validator enforces the 25 titles).

## How to read the coverage
* **Fully supported (`sourced`)**: a statement traced to a source whose full text was read, with the graded recommendation or authoritative statement it paraphrases.
* **Partially supported (`partial`)**: traced to a partially read source, a non-graded or narrative statement, a dated or superseded edition, or a labelling/manufacturer document that is not a practice guideline.
* **Unsupported or locally determined (`local_protocol`)**: deliberately **not written**. The draft says "follow the manufacturer's instructions / your unit's approved procedure". No bedside step was invented to fill a gap (the validator rejects local statements that do not refer to policy). Real gaps are listed in each draft's `gaps`.
* **Materials requiring reproduction permission**: listed per draft in `permissions` and in the table below.

## Totals (from `content/drafts/skills/SKILL_SUMMARY.csv` and `EVIDENCE_MATRIX.csv`)
| Measure | Result |
|---|---|
| Skills drafted | **25 of 25** (as unreviewed drafts) |
| Skills with partial evidence | 20 |
| Skills with **no usable source read** (unsupported; checklist is local-protocol referrals only) | 5: SK-05 tracheostomy care, SK-13 chest drain monitoring, SK-16 safe patient mobilization, SK-17 CRRT circuit monitoring (only monitoring/safety implications sourced), SK-20 patient transport |
| Skills with fully supported evidence (publishable) | **0** (a clinical skill needs evidence_status = supported, cleared/original licensing, an independent reviewer and an approver; none has any) |
| Sections (194 across the 25 drafts) | 8 fully supported, 113 partially supported, 73 local-protocol referrals |
| Statements (239) | 43 sourced, 123 partial, 73 local-protocol |
| Checklist items (150) | 25 sourced, 87 partial, 38 local-protocol; 93 marked critical |

## Per skill
Columns: sections full/partial/local; checklist items sourced/partial/local; sources read full/partial/not read; number of declared gaps.

| ID | Skill | Evidence | Sections | Checklist | Sources | Gaps |
|---|---|---|---|---|---|---|
| SK-01 | Arterial line care | partial | 1/8/3 | 3/3/3 | 5/2/0 | 4 |
| SK-02 | Central venous catheter care | partial | 1/9/3 | 3/3/1 | 3/1/1 | 4 |
| SK-03 | Peripheral IV care | partial | 1/6/4 | 3/1/2 | 1/1/1 | 3 |
| SK-04 | Endotracheal tube care | partial | 1/7/4 | 2/4/1 | 3/2/0 | 3 |
| SK-05 | Tracheostomy care | unsupported | 0/0/1 | 0/0/3 | 0/0/2 | 2 |
| SK-06 | Artificial airway suctioning | partial | 0/7/4 | 3/4/1 | 2/0/0 | 3 |
| SK-07 | Ventilator safety checks | partial | 0/6/4 | 0/4/2 | 2/2/1 | 3 |
| SK-08 | Oxygen delivery devices | partial | 0/6/4 | 0/7/0 | 4/0/0 | 3 |
| SK-09 | Blood transfusion | partial | 0/6/5 | 0/7/1 | 0/4/1 | 3 |
| SK-10 | Enteral feeding | partial | 0/6/4 | 1/3/2 | 2/2/1 | 3 |
| SK-11 | Nasogastric tube care | partial | 0/4/3 | 0/4/1 | 0/2/1 | 2 |
| SK-12 | Urinary catheter care | partial | 3/4/3 | 6/1/1 | 1/0/0 | 3 |
| SK-13 | Chest drain monitoring | unsupported | 0/0/1 | 0/0/3 | 0/0/2 | 1 |
| SK-14 | Pressure injury prevention | partial | 0/7/2 | 0/6/0 | 0/2/0 | 3 |
| SK-15 | Patient repositioning | partial | 0/4/2 | 0/4/2 | 1/1/0 | 2 |
| SK-16 | Safe patient mobilization | unsupported | 0/0/1 | 0/0/3 | 0/2/0 | 2 |
| SK-17 | CRRT circuit monitoring | unsupported | 0/4/1 | 0/3/2 | 0/1/1 | 2 |
| SK-18 | ECG monitoring | partial | 0/4/3 | 0/5/2 | 0/1/2 | 2 |
| SK-19 | Defibrillator safety | partial | 0/3/5 | 0/4/2 | 1/0/1 | 3 |
| SK-20 | Intrahospital patient transport | unsupported | 0/0/1 | 0/0/3 | 0/0/1 | 1 |
| SK-21 | Infection prevention (standard precautions) | partial | 0/4/3 | 0/5/0 | 0/1/2 | 2 |
| SK-22 | Medication infusion pump safety | partial | 1/2/4 | 4/2/1 | 2/0/0 | 2 |
| SK-23 | Sedation assessment | partial | 0/4/3 | 0/5/1 | 0/1/0 | 2 |
| SK-24 | Neurological assessment | partial | 0/5/3 | 0/6/0 | 0/1/0 | 2 |
| SK-25 | Pain assessment | partial | 0/7/2 | 0/6/1 | 1/2/0 | 2 |

## Evidence sources actually read
* **Re-read in this phase (full text):** CDC/HICPAC 2011 intravascular catheter guideline (peripheral, central, dressing and hand-hygiene recommendations; PDF text-extracted; page footer "Last update: October 2017") and CDC/HICPAC 2009 CAUTI guideline recommendation sections I-III (PDF footer "Last update: June 6, 2019"). The CAUTI guideline was added as `N-CDC-CAUTI-2009` in `content/drafts/skills/NEW_SOURCES.csv`.
* **Carried from Phases 2-3 (statements traced in the topic drafts under `content/drafts/batch-*`):** AARC suctioning, oxygen and patient-ventilator CPGs, SHEA CLABSI and VAP 2022, ESICM shock/EEN/ARDS, ERC 2025 ALS/BLS/post-resuscitation, ISMP high-alert list, FDA infusion-pump page, NICE CG32/NG24 (partial), NHS NG-tube alert (partial), Open RN ECG chapter and transfusion checklist (partial), SCCM PADIS (statements), RCP NEWS2, GCS aid, CPOT review, KDIGO 2012 (summary of statements), NPIAP/EPUAP/PPPIA 2026 (abridged).
* **Could not be read (research tool blocked or paywalled):** Open RN Nursing Skills and Advanced Skills publisher pages (HTTP 403), AARC tracheostomy CPG, INS Infusion Therapy Standards (copyright), AHA 2025, BSH acute transfusion reactions, ASPEN, AACN alerts, BTS pleural guideline, ICS transfer guidance.

## Missing references that would unlock the unsupported skills (priority order)
1. **Open RN Nursing Skills 2e and Advanced Skills (CC BY 4.0, reuse with attribution):** a permissive source for tracheostomy care, chest drain monitoring, peripheral IV, NG tubes and transfusion procedure steps. It needs a browser session or the NCBI Bookshelf copy; image licences differ ("except where otherwise noted").
2. AARC tracheostomy CPG (cite-only; permission to reproduce).
3. INS Standards of Practice for peripheral/central line technique (permission required).
4. BTS pleural guidance or equivalent for chest drains; ICS transfer guidance for transport; a mobility safety-criteria source that is not the permission-restricted ICU Liberation bundle.
5. Manufacturer instructions (arterial transducers, ventilators, CRRT machines, defibrillators, pumps) under reproduction licences.

## Licensing and permission register (per material)
| Material | Status | Consequence |
|---|---|---|
| CDC/HICPAC guidelines (2009, 2011) | US federal publications; the PDFs carry no reuse statement | verify with CDC Web Policies before reproducing text; paraphrase and cite until then |
| Open RN (Nursing Skills, Advanced Skills, Fundamentals) | CC BY 4.0, "except where otherwise noted" | reuse with attribution and a change notice; check every image |
| AARC CPGs | cite-only (RED) | permission to reproduce; paraphrase and cite |
| ERC 2025 guidelines | commercial use needs an agreement | paraphrase only |
| AHA 2025, SCCM PADIS / ICU Liberation, AACN alerts and competence framework, NPIAP/EPUAP/PPPIA, INS, ISMP list, GCS aid, CAM-ICU | RED | permission required before any reproduction |
| AABB Circular of Information | RED | permission required; FDA-recognised version is YELLOW |
| Manufacturer manuals (Hamilton, Draeger) | RED | reproduction permission; device-specific statements only |
| NICE, NHS England, KDIGO, WHO | YELLOW/RED | verify licence for commercial adaptation |

## Security and safety properties of the drafts
* `evidence_status` may only be `partial` or `unsupported`; `license_status` cannot be `cleared` or `original`; reviewers must be empty; every draft carries the banner "NOT clinically reviewed ... not an approved competency assessment".
* The validator (`npm run validate:skills`, also run by the unit tests in CI) rejects: any claim of review, approval, validation or competence; a `sourced` statement without a full-text source; a `full` section containing partial statements; dose or rate patterns; local-protocol statements that invent a step; an unknown or unlisted source; a missing master skill.
* No source file under `src/` may reference `content/drafts/skills` (unit-tested), and the seed generator only emits `demo_synthetic` rows, so the drafts cannot reach the learner surfaces.
