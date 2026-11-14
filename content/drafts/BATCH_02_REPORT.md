# Phase 2 – Batch 2 report — DRAFTS ONLY

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h`

**All six drafts are DRAFT, `origin: ai_generated`, NOT clinically reviewed, not published and not imported.** No reviewer is appointed. Batch 2 was started after the owner stated that Batch 1 passed the internal gate; **no human clinical review of any batch has happened.**

## 1. Selection rule
Only topics whose primary source could be read in full (open-access full text or an accessible official page) were drafted. Topics whose registered source was blocked were skipped rather than written from memory. Result: 6 of the intended 10.

## 2. Drafts (6)
| Topic | Sources actually read | Source quality / date | Licence | Main limitation |
|---|---|---|---|---|
| D06-T07 Preventing VAP and VAE (adults) | SHEA/IDSA/APIC 2022 update (full text) | Graded multi-society guideline, 2022 | CC BY | Non-ventilator pneumonia and paediatric sections not covered; contains "frequent cuff-pressure monitoring not recommended for VAP prevention" which conflicts with common cuff-pressure teaching — flagged |
| D01-T07 Ventilator parameters and lung-protective ventilation | ESICM ARDS guideline 2023 (full text) | Society guideline, 2023 | CC BY-NC | ARDS only; the AARC patient-ventilator guideline (register source) was inaccessible; no driving-pressure target exists in the guideline |
| D02-T08 Recognising circulatory shock | ESICM consensus on shock and haemodynamic monitoring 2014 (full text); SSC 2021 for one statement | Expert consensus, **dated 2014** | CC BY-NC; SSC cite-only | No vasopressor/fluid content; SSC 2026 unread |
| D04-T02 Acute kidney injury | NICE NG148 recommendations (sections 1.1–1.5) | National guideline (UK), mostly 2013-era text, updated 2024 | NICE cite-only | KDIGO 2026 is a draft and is not used as final; KDIGO 2012 not read |
| D03-T10 Delirium | NICE CG103 recommendations (full chapter) | National guideline (UK), updated 2023, not ICU-specific | NICE cite-only | **PADIS 2018/2025 (the ICU source) inaccessible**, so ICU drug and bundle evidence is absent |
| D07-T06 Enteral feeding | ESICM early enteral nutrition guideline 2017 (full text); SHEA 2022 for positioning | Society guideline, 2017, mostly conditional recommendations | CC BY-NC; CC BY | ASPEN/SCCM and ESPEN inaccessible; sources disagree on gastric residual monitoring — flagged |

Source-by-source log: `content/drafts/batch-02-sources.csv`.

## 3. Quality controls applied
- Same structure as Batch 1 (13 required sections, scope labels, SBAR, bedside example, case, evidence/limits section), six MCQs per topic (36 total) with an explanation for every wrong option.
- Validator extended: ventilator tidal volume per predicted body weight and urine-output thresholds are allowed; drug-style dose and rate patterns are still blocked. Answer-position balance is checked per topic and across each batch; correct option not the longest in more than half the questions; distractor plausibility checks.
- Consistency tests: topic ID, domain name and source IDs must match the curriculum and register (they caught two wrong domain names, fixed).
- 104 unit tests pass; lint and types clean.

## 4. Blocked topics and exact obstacles (this batch)
| Topic | Intended source | Obstacle |
|---|---|---|
| D02-T14/T15 Cardiac arrest, defibrillation safety | ERC Guidelines 2025 (and 2021) | Publisher pages Cloudflare 403; Europe PMC shows subscription required; Resus Council UK page "access denied" |
| D01-T03 Oxygen therapy | BTS oxygen guideline 2017 | Thorax Cloudflare 403; BTS site 404; not in PMC |
| D09-T03 Scope of practice; D07-T01 Head-to-toe | Open RN chapters | NCBI Bookshelf reCAPTCHA; chapter URLs unknown (carried from Batch 1) |
| D01-T11 Suctioning; D03-T09 RASS | AARC CPG; PADIS | Still blocked (Batch 1) |
| D01-T12, D08-T03 and others | various | Not attempted this round |

## 5. Unresolved clinical questions for reviewers
1. **IPC/RT/NE:** cuff-pressure checks — SHEA 2022 says frequent cuff monitoring is not recommended *for VAP prevention*; what should the platform teach (see D01-T12)?
2. **RT/CCP:** plateau pressure limit as "current practice" and absence of a driving-pressure target; nurse role in prone positioning.
3. **CCP/NE:** is a 2014 shock consensus acceptable as a primary source; replace with a newer review?
4. **NEPH/NE:** urine-output measurement frequency; KDIGO 2026 final awaited.
5. **NEURO/PH/NE:** ICU-specific delirium bundle content (PADIS); screening frequency; drug content in a nursing topic.
6. **Dietitian/CCP/NE:** gastric aspirate monitoring (ESICM uses it; SHEA says no impact on VAP); tube-placement verification; post-pyloric access roles.
7. **Arabic reviewer:** terminology for all topics.

## 6. Licensing issues
- CC BY-NC sources (ESICM ARDS, shock consensus, enteral nutrition) cannot be reused in a commercial product beyond citation and original paraphrase.
- NICE documents: cite-only.
- SSC 2021 PMC copy: temporary pandemic-period terms.
- SHEA 2022 (CC BY): attribution if adapted.

## 7. Status and next steps
Batch 2 is a draft set awaiting the internal quality review (same method as Batch 1: claim-to-source trace, scope check, MCQ review) and, after that, genuine qualified human review. Nothing is publishable. Blocked topics need a person to open the sources or supply readable copies.
