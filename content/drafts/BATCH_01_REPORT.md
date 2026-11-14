# Phase 2 – Batch 1 report (DRAFTS ONLY)

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h`

**Status of all content: DRAFT, `origin: ai_generated`, NOT clinically reviewed, NOT published, not imported into any database.** No reviewer is appointed; nothing here claims review or approval. The platform will refuse publication without genuine human approvals.

## Scope: 5 of the planned 10 topics

Only topics whose primary source I could actually read were drafted. Quality over quantity.

| Topic | Primary source read | Version/date | Licence/copyright | Notes |
|---|---|---|---|---|
| D06-T04 Standard & transmission-based precautions | CDC standard precautions and transmission-based precautions pages | both dated 3 Apr 2024 | No reuse terms found → cite-only (RED) | PPE sequence page returned 404; not used |
| D06-T05 CLABSI prevention | CDC/HICPAC Intravascular Catheter-Related Infection guideline PDF (full text read) | 2011, last update Oct 2017; page dated 12 Apr 2024 | cite-only | **Dated**: reviewer must check newer SHEA/IDSA/APIC guidance; CHG-dressing recommendation was updated by CDC and is not drafted |
| D06-T01 Sepsis recognition | NICE NG253 chapters 1.1–1.2 and 1.5–1.6 read | published 19 Nov 2025; page updated 23 Sep 2026 | NICE restricts commercial reuse → cite-only | UK guidance; international thresholds to be reviewed. Surviving Sepsis 2026 **not read**, not used |
| D09-T01 SBAR/handover | AHRQ TeamSTEPPS SBAR tool page | accessed 2026-11-14 | US gov't; terms not captured → cite-only | Example is fictional |
| D09-T02 Documentation | Open RN Fundamentals 2e §2.5 | accessed 2026-11-14 | CC BY 4.0; paraphrased, attribution kept | US-oriented legal norms |

## Not drafted (blocked, 5 topics)

Reasons: AHRQ/AARC/PMC/AHA pages blocked automated reading (403/Cloudflare); Open RN scope-of-practice and assessment chapter URLs could not be located; PADIS, SSC 2026, NPIAP not read. Candidates for the next batch once a person can fetch them or I find readable copies: D09-T03 scope of practice, D07-T01 head-to-toe, D01-T11 airway suctioning, D03-T09 RASS, D07-T04 pressure injury.

## Design rules applied
Nursing-specific; each topic has a scope table (independent nursing / needs order or protocol / prescriber decision); no doses, concentrations or rates; local-protocol notes; internationally framed with UK/US caveats; five original MCQs per topic; original wording.

## Questions for reviewers
- IPC: current CLABSI bundle (dressing intervals, CHG dressings) vs the 2017-dated guideline.
- CCP/IPC/NE: is NICE NG253/NEWS2 appropriate as the international baseline for D06-T01?
- NE/BN: are nursing-vs-prescriber labels right for your jurisdiction?

## Checks
`npm run validate:drafts` and `tests/unit/drafts.test.ts` enforce: DRAFT status, `clinically_reviewed: false`, empty reviewers, review banner, required sections, scope labels, ≥5 MCQs, references with access dates, no dose/rate patterns, no "reviewed by" claims.
