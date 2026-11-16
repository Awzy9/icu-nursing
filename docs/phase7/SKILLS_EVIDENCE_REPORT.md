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
| Skills with partial evidence | 24 |
| Skills with **no usable source read** (unsupported; checklist is local-protocol referrals only) | 1: SK-05 tracheostomy care (see Phase 8 recovery below) |
| Skills with fully supported evidence (publishable) | **0** (a clinical skill needs evidence_status = supported, cleared/original licensing, an independent reviewer and an approver; none has any) |
| Sections (228 across the 25 drafts) | 8 fully supported, 139 partially supported, 81 local-protocol referrals |
| Statements (288) | 61 sourced, 146 partial, 81 local-protocol |
| Checklist items (167) | 37 sourced, 98 partial, 32 local-protocol; 107 marked critical |

## Per skill
Columns: sections full/partial/local; checklist items sourced/partial/local; sources read full/partial/not read; number of declared gaps.

| ID | Skill | Evidence | Sections | Checklist | Sources | Gaps |
|---|---|---|---|---|---|---|
| SK-01 | Arterial line care | partial | 1/8/3 | 3/3/3 | 5/2/0 | 4 |
| SK-02 | Central venous catheter care | partial | 1/9/3 | 3/3/1 | 3/1/1 | 4 |
| SK-03 | Peripheral IV care | partial | 1/6/4 | 3/1/2 | 1/1/1 | 3 |
| SK-04 | Endotracheal tube care | partial | 1/7/4 | 2/4/1 | 3/2/0 | 3 |
| SK-05 | Tracheostomy care | unsupported | 0/1/1 | 0/0/3 | 1/0/4 | 3 |
| SK-06 | Artificial airway suctioning | partial | 0/7/4 | 3/4/1 | 2/0/0 | 3 |
| SK-07 | Ventilator safety checks | partial | 0/6/4 | 0/4/2 | 2/2/1 | 3 |
| SK-08 | Oxygen delivery devices | partial | 0/6/4 | 0/7/0 | 4/0/0 | 3 |
| SK-09 | Blood transfusion | partial | 0/6/5 | 0/7/1 | 0/4/1 | 3 |
| SK-10 | Enteral feeding | partial | 0/6/4 | 1/3/2 | 2/2/1 | 3 |
| SK-11 | Nasogastric tube care | partial | 0/4/3 | 0/4/1 | 0/2/1 | 2 |
| SK-12 | Urinary catheter care | partial | 3/4/3 | 6/1/1 | 1/0/0 | 3 |
| SK-13 | Chest drain monitoring | partial | 0/8/3 | 0/7/0 | 1/0/2 | 4 |
| SK-14 | Pressure injury prevention | partial | 0/7/2 | 0/6/0 | 0/2/0 | 3 |
| SK-15 | Patient repositioning | partial | 0/4/2 | 0/4/2 | 1/1/0 | 2 |
| SK-16 | Safe patient mobilization | partial | 0/7/2 | 4/2/2 | 1/2/0 | 4 |
| SK-17 | CRRT circuit monitoring | partial | 0/5/4 | 0/5/2 | 1/1/2 | 4 |
| SK-18 | ECG monitoring | partial | 0/4/3 | 0/5/2 | 0/1/2 | 2 |
| SK-19 | Defibrillator safety | partial | 0/3/5 | 0/4/2 | 1/0/1 | 3 |
| SK-20 | Intrahospital patient transport | partial | 0/9/3 | 8/0/1 | 1/0/0 | 4 |
| SK-21 | Infection prevention (standard precautions) | partial | 0/4/3 | 0/5/0 | 0/1/2 | 2 |
| SK-22 | Medication infusion pump safety | partial | 1/2/4 | 4/2/1 | 2/0/0 | 2 |
| SK-23 | Sedation assessment | partial | 0/4/3 | 0/5/1 | 0/1/0 | 2 |
| SK-24 | Neurological assessment | partial | 0/5/3 | 0/6/0 | 0/1/0 | 2 |
| SK-25 | Pain assessment | partial | 0/7/2 | 0/6/1 | 1/2/0 | 2 |

## Evidence recovery (Phase 8, Step 1)
Attempted for the five previously unsupported skills, using only the owner's listed locations and normal fetches. **No access control was bypassed.**
| Skill | Result | What was read | Remaining gap |
|---|---|---|---|
| SK-05 Tracheostomy care | **Still unsupported** | NCBI Bookshelf NBK596713 returned a browser-verification (reCAPTCHA) page; Open RN and NSW ACI pages returned HTTP 403. Only ICS 2026 recommendation 60 (tracheostomy spares for transfer) is usable, as a partial statement | all care and emergency content; needs a person to retrieve the Open RN chapter or an approved copy of the AARC/ACI/NTSP material |
| SK-13 Chest drain monitoring | **Unsupported to partial** | NBK594490 blocked as above. Recovered from the BTS Clinical Statement on pleural procedures (Thorax 2023; practice points on insertion, bottle/underwater-seal set-up and suction, full text): system below insertion site, upright, water seal, ANTT, daily checks and observation chart, no clamping of a bubbling drain without specialist supervision, controlled drainage and re-expansion pulmonary oedema, suction avoidance and prescription | troubleshooting, bubbling interpretation, removal, ICU surgical/trauma drains; licence line "No commercial re-use" |
| SK-16 Safe mobilization | **Unsupported to partial** | Hodgson 2014 consensus (CC BY 4.0, full text; Figures 2-5 are images and were not read): airway/oxygen checks before each episode, FiO2 below 0.6, SpO2 above 90%, respiratory rate below 30, consult the experienced team at several limits, vasoactive drugs not an absolute contraindication and no agreed dose threshold | cardiovascular/neurological/other thresholds (in the unread figures); dated; ICU Liberation material needs permission |
| SK-17 CRRT circuit monitoring | **Unsupported to partial** | Alberta Health Services Dialyzing Wisely CRRT alarm pathway (Jan 2025, read in full; PrisMax-specific; "according to local practice"): check the patient first, do not use override to clear alarms, access/return/flow/bag alarm checks, return blood and document when alarms cannot be managed. Baxter's Prismaflex manual URL now redirects to the Vantive site and was not read; no manufacturer manual was obtained | machine operation, priming, citrate, cross-manufacturer standard; licence of the AHS file unstated |
| SK-20 Patient transport | **Unsupported to partial (best recovered)** | ICS Guidance on the Transfer of the Critically Ill Adult, 5th edition (22 April 2026): numbered recommendations 1-88 and Appendix 7 intra-hospital checklist read in full text: stabilise before transfer, intubate for airway/ventilatory/neuro compromise, access and infusion supply, harness and stowage, monitoring standards and cable umbilicus, risk assessment and two escorts for higher risk, training, checklists, documentation and multidisciplinary handover | chapter 23 (emergencies/deterioration), appendices on equipment/medication/oxygen; UK scope; copyright Intensive Care Society |

No skill was raised to `evidence_status = supported`. 24 of 25 drafts are partial; one (tracheostomy) remains unsupported. New sources are in `content/drafts/skills/NEW_SOURCES.csv` (read or not read, with licence class): `N-ICS-TRANSFER-2026`, `N-BTS-PCS-2023`, `N-HODGSON-2014`, `N-AHS-CRRT-ALARM-2025`, and the unread `N-NCBI-OPENRN-TRACH`, `N-NCBI-OPENRN-CHEST`, `N-OPENRN-ADV-PDF`, `N-ACI-TRACH`, `N-BAXTER-PRISMAFLEX`.

### Licensing checks for the new sources
| Source | Licence found | Consequence |
|---|---|---|
| ICS transfer guidance 2026 | copyright Intensive Care Society; no reuse statement on the file | paraphrase only; permission needed to reproduce (no enquiry sent) |
| BTS clinical statement 2023 | "No commercial re-use" | paraphrase and cite only; cannot be adapted into commercial content |
| Hodgson 2014 | CC BY 4.0 (and CC0 for the data) | reuse with attribution is allowed |
| AHS Dialyzing Wisely pathway | none on the file | verify before reproducing |
| Open RN chapters / Advanced Skills | CC BY 4.0 per collection, but not retrievable by automated tools | owner/person with a browser must retrieve them |

## Evidence sources actually read
* **Re-read in this phase (full text):** CDC/HICPAC 2011 intravascular catheter guideline (peripheral, central, dressing and hand-hygiene recommendations; PDF text-extracted; page footer "Last update: October 2017") and CDC/HICPAC 2009 CAUTI guideline recommendation sections I-III (PDF footer "Last update: June 6, 2019"). The CAUTI guideline was added as `N-CDC-CAUTI-2009` in `content/drafts/skills/NEW_SOURCES.csv`.
* **Carried from Phases 2-3 (statements traced in the topic drafts under `content/drafts/batch-*`):** AARC suctioning, oxygen and patient-ventilator CPGs, SHEA CLABSI and VAP 2022, ESICM shock/EEN/ARDS, ERC 2025 ALS/BLS/post-resuscitation, ISMP high-alert list, FDA infusion-pump page, NICE CG32/NG24 (partial), NHS NG-tube alert (partial), Open RN ECG chapter and transfusion checklist (partial), SCCM PADIS (statements), RCP NEWS2, GCS aid, CPOT review, KDIGO 2012 (summary of statements), NPIAP/EPUAP/PPPIA 2026 (abridged).
* **Could not be read (research tool blocked or paywalled):** Open RN Nursing Skills and Advanced Skills publisher pages (HTTP 403), AARC tracheostomy CPG, INS Infusion Therapy Standards (copyright), AHA 2025, BSH acute transfusion reactions, ASPEN, AACN alerts, BTS pleural guideline, ICS transfer guidance.

## Missing references that would unlock further skills (priority order)
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
