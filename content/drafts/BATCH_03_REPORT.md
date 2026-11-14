# Phase 2 – Batch 3 report — DRAFTS ONLY

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h` · **AI-generated, DRAFT, NOT clinically reviewed, not imported, not published.**

Batch 3 was approved with up to 10 new unique topics. **3 were drafted**, because only topics with accessible, authoritative full-text sources were drafted (quality before quantity). The cardiac-arrest topic D02-T14 was completed in Batch 2.

## Drafts (3)
| Topic | Sources read | Licence | Main limitation |
|---|---|---|---|
| D01-T12 ETT care, securement, cuff pressure | AARC Patient-Ventilator Assessment CPG 2024 (full); SHEA 2022; ERC 2025 ALS (capnography); EPUAP/NPIAP QRG 2026 | AARC cite-only; ERC commercial agreement; SHEA CC BY | Cuff range 20–30 cmH₂O is narrative, not graded; no consensus on interval; placement/securement recommendation very low certainty |
| D04-T03 Urine output and fluid balance | NICE CG174 (2013, updated 2017) and NG148 (updated 2024) | NICE cite-only | UK general-hospital guidance; CG174 scope exclusions unread; dated; ICU applicability to confirm |
| D03-T01 Glasgow Coma Scale | Official GCS Assessment Aid PDF and three glasgowcomascale.org pages | © Sir Graham Teasdale 2015; permission needed to reproduce | Not a graded guideline; no severity bands or prognosis; Lancet papers unread |

Candidate topics evaluated and **not** drafted: D04-T08 ABG interpretation (AARC blood gas CPG 2013 is accessible but covers sampling and indications, not acid–base interpretation); D08-T03 blood transfusion (NICE NG24 chapters read give thresholds and a two-line monitoring recommendation only; bedside checking and reaction management sources such as BSH 2018 are inaccessible); D02-T09 septic shock nursing care (SSC 2021 is superseded by an unread 2026 edition); D01-T17 weaning, D03-T03 ICP/CPP, D05-T16 pump safety, D07-T03 pain (no accessible current source); D03-T09, D09-T03, D07-T01 (blocked, see backlog).

## Batch 2 continuation completed in this round
D02-T14 Cardiac arrest in the ICU: recognition, response and immediate post-ROSC nursing care, drafted from the full ERC 2025 BLS, ALS and Post-Resuscitation Care PDFs. Documented conflict: the RCUK algorithm poster states SBP >100 mmHg after ROSC, the ERC text states MAP >60–65 mmHg.

## QA gate (same as Batches 1–2)
- Claim trace: 170 claims (Batch 2: 119 + new 51 for D02-T14, D01-T12, D04-T03, D03-T01 across `batch-02-claim-trace.csv`), all matched to the source text (the file covers Batch 2 and Batch 3 topics).
- Untraced statements: `UNTRACED_STATEMENTS.md` – 18 items, with resolution status; 6 clinically relevant items remain unsupported and are flagged.
- MCQs: 6 per topic (18), validator-checked for position balance, length bias, plausibility and explanations for every wrong option.
- Corrections found in this round: the earlier D06-T07 statement that neither guideline mentions a cuff range was wrong (AARC narrates 20–30 cmH₂O); fixed. D07-T04 skin-tone claim removed.

## Gate decision
Batch 3 drafts pass the **internal** QA gate only. No further batch should start until the supervisor confirms.
