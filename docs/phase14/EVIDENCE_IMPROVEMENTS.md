# Phase 14 - medication and skills evidence review

Method: `scripts/audit-evidence.ts` (offline, deterministic, re-runnable) scores all 50 medication and 25 skill drafts and writes `EVIDENCE_GAP_AUDIT.md` and `evidence_gaps.csv`. All 50 FDA labels were re-fetched from openFDA on 2026-11-15 and compared with the register.

## Findings (before changes)
* **Escalation**: 50 of 50 medication drafts have escalation triggers derived from the label only; no nursing-practice source exists for them. Still open: needs a nursing-practice source or the unit's protocol.
* **Monitoring**: 44 of 50 medication monitoring sections had no statement sourced from the label.
* **Adverse effects**: 50 of 50 hold a single statement.
* **High-alert status**: 41 of 50 are "not determined from a source read" (deliberate: the ISMP list is licensed for internal non-commercial use and is not reproduced; each draft says the institution's list governs).
* **Currency**: all labels unchanged since they were read; 5 are older than 2026 (insulin, piperacillin-tazobactam, esmolol, nitroglycerin, flumazenil).
* **Jurisdiction**: every medication draft rests on a single US manufacturer label; no EMA, MHRA or SFDA text was read. The jurisdiction notes are preserved.
* **Skills**: 10 of 25 have a core section that is local-protocol only or missing; 12 cite a source that was not read; most cite sources with a RED or unverified licence class.

## Improvements made
* 27 monitoring statements added to 24 medication drafts, each paraphrased from the label's own warnings text (labels read in full) and each marked `sourced`; they contain no dose, rate or protocol (checked by the library's no-dosing rule and a unit test). Monitoring sections that now hold a sourced statement are `partial` rather than `local_protocol`.
* `label_currency_check` recorded on all 50 medication drafts (set id, version, effective date compared with the register) and enforced by a unit test.
* Skills: neurological assessment (SK-24) gains sourced statements on the Glasgow Coma Scale, pupil evaluation and the earliest sign of raised pressure; oxygen delivery (SK-08) gains respiratory monitoring and reassessment from Open RN Fundamentals 8.3; infection prevention (SK-21) gains the CDC definition of hand hygiene and the alcohol-rub fire-safety point (partial, landing page only). New sources registered with licence classes.
* Statements the sources do not support were not added: no dosing, rates, thresholds, treatment protocols or invented procedures.

## Still open (needs a source or the owner)
Nursing-practice sources for escalation; other regulators' labels (EMA, MHRA, SFDA); the AACN, WHO and ISMP full texts; manufacturer instructions for every device skill; more than one adverse-effect statement per medication.
