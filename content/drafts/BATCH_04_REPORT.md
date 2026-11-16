# Phase 2 – Batch 4 report — DRAFTS ONLY

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h` · **AI-generated, DRAFT, NOT clinically reviewed, not imported, not published.**

Up to 10 topics were allowed. **2 were drafted.** The rest of the priority list lacked current, authoritative, accessible full text and was **not forced**.

## Drafts (2)
| Topic | Primary sources (status) | Licence | Main limitations |
|---|---|---|---|
| D01-T19 Respiratory deterioration and early-warning scores | RCP NEWS2 report 2017 (VERIFIED FULL TEXT, 77 pp); NICE NG253 (PARTIAL); AARC oxygen CPG 2022 (VERIFIED FULL TEXT); ERC ALS 2025 (VERIFIED FULL TEXT) | RCP: no copyright restriction, acknowledge RCP, do not modify charts; others cite-only | UK/NHS adult tool (not for under-16s or pregnancy; unreliable in spinal cord injury); ward-level design; BTS oxygen guideline NOT READ; bedside respiratory signs are standard practice, not graded in the sources |
| D02-T04 Arterial line monitoring and maintenance | CDC/HICPAC 2011 (VERIFIED FULL TEXT; dated); SSC 2021 (SUPERSEDED, full text read); ESICM 2014 consensus (VERIFIED, dated); ERC–ESICM 2025 post-resuscitation care (VERIFIED) | CDC cite-only; ESICM CC BY-NC; SSC cite-only; ERC commercial agreement | No source read covers zeroing, levelling, damping, sampling technique or alarm limits: flagged as manufacturer/local policy; 2011 transducer interval and Category II items are low-evidence |

## Candidates evaluated and not drafted
| Topic | Finding |
|---|---|
| D02-T02 ECG and rhythm recognition | ERC ALS has a peri-arrest arrhythmia section but no rhythm-recognition teaching; no accessible ECG education source with full text |
| D02-T12 / D05-T03 Vasopressor monitoring | Only SSC 2021 (superseded by an unread 2026 edition) and passing ERC statements; medication topic needing pharmacist review and current evidence |
| D05-T16 Medication and infusion-pump safety | ISMP high-alert list page returned only navigation text; no pump-safety guideline accessible |
| D04-T06 Potassium disorders | UK Kidney Association hyperkalaemia guideline not found (404); ERC/NICE give only fragments |
| D08-T03 Transfusion safety | SHOT UK haemovigilance 2024 chapters (key messages, IBCT, TACO, FAHR, HTR) are accessible but are surveillance reports (errors, key findings, next steps) rather than guideline-grade bedside procedure; BSH 2018 administration guideline NOT READ; NICE NG24 gives only thresholds and a two-sentence monitoring statement. A draft would present a surveillance report as a procedure, so it stays blocked/partial |
| D04-T08 ABG | AARC 2013 blood-gas CPG covers sampling, not interpretation (Batch 3 finding) |

## Source corrections and unsupported statements
- Source inventory audit: `SOURCE_AUDIT.md/.csv` and register column `source_status` (VERIFIED FULL TEXT / PARTIAL OR SUMMARY / NOT READ / SUPERSEDED); unit tests enforce it.
- Blood-pressure explanation corrected in D02-T14 (RCUK: SBP >100 **or** MAP >60–65 mmHg; ERC–ESICM: MAP >60–65 mmHg; alternative measures, individual targets set by the team).
- Of the six unsupported clinically relevant statements: one supported by NEWS2 (CO₂-retention rationale), four removed or rewritten (WHO moments, isolation extras, stop-suctioning rule, neurological red flags), one remains an acknowledged local-policy evidence gap (tube-placement checks). See `UNTRACED_STATEMENTS.md`.

## QA gate
Claim trace 194 of 194 matched (24 new for these two topics and the BP correction); MCQ validator passed for all 12 questions; internal read-through of scope, safety and population limits done. Gate result: **internal pass only; no clinical review**. Batch 5 not started.
