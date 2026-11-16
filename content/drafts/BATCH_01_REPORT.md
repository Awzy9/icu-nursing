# Phase 2 – Batch 1 report (revision 2) — DRAFTS ONLY

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h`

**Every item below is DRAFT, `origin: ai_generated`, NOT clinically reviewed, not published and not imported into any database.** No reviewer is appointed. Batch 2 has **not** been started; it waits for an internal content-quality review of Batch 1 and for genuine human clinical review.

## 1. Finished drafts (6 of 10)

| Topic | Primary sources actually read | Source quality / limits | Licensing |
|---|---|---|---|
| D06-T04 Standard & transmission-based precautions | CDC standard and transmission-based precautions pages (3 Apr 2024) | Summary pages only; no duration/discontinuation criteria; WHO/ECDC not read | CDC: no reuse terms found → cite-only |
| D06-T05 CLABSI prevention | SHEA/IDSA/APIC 2022 update (full text, open access); CDC/HICPAC 2011 guideline (full PDF); CDC 2017 CHG-dressing update (landing page only) | 2022 is the more recent graded document; US-centred; INS standards not accessible | SHEA CC BY; CDC cite-only |
| D06-T01 Sepsis recognition | NICE NG253 (chapters 1.1–1.2, 1.5–1.6); Surviving Sepsis Campaign 2021 (full text) | NICE treatment chapters not read; **SSC 2026 update exists but could not be read** | NICE cite-only; SSC 2021 PMC copy has pandemic-period terms → cite-only |
| D09-T01 SBAR/handover | AHRQ TeamSTEPPS SBAR page | A tool description, not outcome evidence; I-PASS not read | US gov't, terms not captured → cite-only |
| D09-T02 Nursing documentation | Open RN Nursing Fundamentals 2e §2.5 (first ~5,000 characters) | Educational, US-oriented; regulator standards not read | CC BY 4.0 (paraphrased) |
| D07-T04 Skin assessment & pressure-injury prevention (new) | International Guideline 4th ed. **Quick Reference Guide** (1 Sep 2026) | Abridged guide only; full chapters and stage definitions not read | © NPIAP/EPUAP/PPPIA; cite-only unless permission |

Full source-by-source access log: `content/drafts/batch-01-sources.csv`.

## 2. What changed from revision 1
- **Scope and content:** every draft now covers assessment, monitoring, red flags, scope-labelled interventions (independent nursing / collaborative / needs order or protocol / prescriber decision), escalation with SBAR, documentation, a practical bedside example, a fictional case, and an "Evidence, applicability and open questions" section.
- **MCQs:** 6 per topic (36 total), all rewritten: scenario-based, prioritisation/judgment/scope-focused, plausible distractors, correct-answer positions A 8 / B 9 / C 9 / D 10, correct option not systematically longest, and a written reason for **every** wrong option.
- **Automated checks (new):** answer-position imbalance per topic and across the batch; implausibly short distractors and distractors far shorter than the correct option; correct option longest too often; missing explanation per wrong option; nonsense-phrase list; plus the existing safety checks (DRAFT status, no review claims, no dosing patterns, required sections). 84 unit tests pass; the validator has self-tests proving each check fires.
- **CLABSI reviewed against newer guidance:** see §3.
- **Sepsis restructured:** core internationally applicable principles are separated from NICE/NEWS2-specific rules in one table (§9 of the draft).

## 3. CLABSI: dated or conflicting recommendations found
| Item | 2011 CDC (updated 2017) | 2022 SHEA/IDSA/APIC | Effect |
|---|---|---|---|
| Chlorhexidine-impregnated dressings | 2011 statements superseded by CDC in 2017 | Essential practice for patients over 2 months (high-quality evidence) | 2011 wording must not be taught |
| Daily CHG bathing in ICU | not an element in the sections read | Essential (high) | New vs 2011 |
| Administration set replacement | no more often than 96 h, at least every 7 days | intervals up to 7 days | Compatible; local policy decides |
| Insertion site | subclavian recommended in adults with caveats | subclavian preferred in ICU; ultrasound guidance | Prescriber/inserter decision |
| Staffing | adequate ICU nurse staffing (IB) | ratio and float-pool limits (high) | Escalation of unsafe staffing |
| Dressing intervals | transparent ≥ every 7 days; gauze 2 days | same intervals, with CHG-based site care | Consistent |

## 4. Sepsis: NICE-specific vs international
- **NICE/NEWS2-specific (UK):** NEWS2 bands (7+, 5–6, 1–4, 0), single-parameter-3 review trigger, recalculation intervals, adult 16+ not recently pregnant, acute-setting scope.
- **Core principles used internationally:** suspect sepsis without fever; listen to family/carers; structured observations; escalate on concern, not score alone; treat early-warning scores as prompts; SSC 2021 recommends against qSOFA alone, suggests lactate measurement, capillary refill as a perfusion adjunct, and antimicrobials within about one hour for possible septic shock or high likelihood of sepsis.
- **Gap:** the SSC **2026** update could not be read (publisher pages block automated access; open full text not found). Anything taken from SSC 2021 may have changed.

## 5. Blocked topics (4 of 10) — exact obstacles
| Topic | Intended source | What I tried | Obstacle |
|---|---|---|---|
| D01-T11 Airway suctioning | AARC CPG: Endotracheal Suctioning… (Respir Care 2022) | Publisher page; AARC site; Europe PMC search (title and keywords) | rc.rcjournal.com: Cloudflare 403; aarc.org CPG page 404; no open-access copy found. An open-access systematic review (Cureus 2023, PMC10460288) exists but is secondary evidence, not a guideline, so not used |
| D03-T09 Sedation monitoring (RASS) | SCCM PADIS guideline 2018 (2025 update) | LWW publisher page; SCCM page; Europe PMC/PMC ID lookup | LWW: Cloudflare 403; SCCM URL 404; PMID 30113379 not in PMC; RASS original validation paper (2002) is indexed but not open access |
| D09-T03 Nursing scope of practice | Open RN Fundamentals scope chapter; regulator/ICN documents | Guessed chapter URL; site search; ICN definitions page | Chapter URL unknown (page not found); the ICN definition page was read but is too general to support a topic alone; national regulator documents not accessed |
| D07-T01 Head-to-toe assessment | Open RN Nursing Skills assessment chapters | Site search and link extraction | Chapter URLs not retrievable by browser automation |
These four are not drafted. No blog or secondary substitute was used.

## 6. Unresolved clinical questions for reviewers
1. **IPC/NE:** Does the platform follow CDC 2011 (older) or SHEA 2022 for CLABSI? Teach CHG bathing and CHG dressings as standard? Antiseptic dry/scrub times (not in sources read).
2. **CCP/NE/BN:** Which early-warning score is the default for sepsis teaching; reconcile with SSC 2026; ICU escalation time targets.
3. **IPC:** duration/discontinuation criteria for isolation; eye-protection rules; regional respirator standards.
4. **NE/BN:** scope labels per jurisdiction; I-PASS or local handover format; documentation of verbal/telephone orders by country.
5. **NE/BN (tissue viability):** preferred risk scale; ICU repositioning during haemodynamic instability; whether to adopt the 4th-edition recommendations before the full text is reviewed; staging content (not drafted).
6. **Arabic reviewer:** terminology for all six topics before localisation.

## 7. Remaining licensing issues
- CDC, NICE, AHRQ, SSC, NPIAP/EPUAP/PPPIA: no usable reuse licence captured → paraphrase and cite only; no figures, tables or phrases reproduced.
- The International Pressure Injury Guideline 4th edition (2026) is newer than the register's 2019 row — register update and a permissions enquiry are needed.
- Open RN (CC BY 4.0): attribution and change notice required where text is adapted.
- SHEA 2022 (CC BY): attribution required if adapted.
- SCCM permission email remains an unsent draft.

Internal review record: `BATCH_01_INTERNAL_REVIEW.md`.

## 8. Quality gate before Batch 2
Internal content-quality review of Batch 1 (this report is the input), then genuine qualified human review. Nothing may be published or marked reviewed without it.
