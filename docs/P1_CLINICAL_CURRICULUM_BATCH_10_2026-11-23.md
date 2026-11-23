# P1 Clinical Curriculum — Batch 10: Hyperkalaemia ECG and Medication Links (2026-11-23)

**Scope:** Draft-only, AI-assisted fictional nursing training. **Not clinically reviewed; not a prescription, nurse-independent emergency treatment algorithm, or competent clinical sign-off.** All content stays in PR #113, unmerged and undeployed.

## Evidence verification

The official UK Kidney Association **July 2026** hyperkalaemia website was rechecked on **2026-11-23**:

- The **detailed** [hospital Guideline 14.1](https://guidelines.ukkidney.org/hyperkalaemia/11-1-ii-hyperkalaemia-in-hospital/11-1-2-ii-hyperkalaemia-in-hospital-14-1-14-2/) places the urgent 12-lead ECG recommendation at **serum K >= 6.0 mmol/L** (grade 1B).
- The official [hospital summary, also labelled 14.1](https://guidelines.ukkidney.org/hyperkalaemia/6-summary-of-clinical-practice-guideline-for-hyperkalaemia/6-2-section-ii-hospital/) prints **K >= 6.5 mmol/L** (grade 1B) for the 12-lead ECG. **This is a document-level discrepancy, not evidence of an intentional clinical change**; the publisher's intended correction has not been confirmed.
- **Guideline 14.2**, in both places, is a distinct **continuous rhythm-monitoring** recommendation covering severe potassium elevation, suggestive ECG changes and certain clinically unwell or rapidly rising moderate-range cases; it is **not equivalent to the threshold for the first 12-lead ECG**.
- A normal ECG cannot reliably exclude dangerous hyperkalaemia, and repeated sampling for pseudohyperkalaemia must not delay rescue assessment in an unstable patient.
- Source ID `S-UKKA-HK-2026` in the primary register remains **RED/cite-only**, with partial/targeted verification; no figure, dosage table, algorithm or proprietary text was copied.

## Implemented changes

| File | Safety improvement |
|---|---|
| `content/drafts/scenarios/SC-11-severe-hyperkalemia.json` | Makes **immediate patient and rhythm assessment plus urgent help** unambiguous, with repeat sampling in parallel. Correct answer distinguishes detailed 14.1, conflicting summary 14.1, and continuous monitoring 14.2. Adds product-specific calcium safety boundaries, pre-insulin glucose and post-treatment rebound monitoring. |
| `content/drafts/scenarios/SC-11-severe-hyperkalemia.json` (relationships) | Removed two clinically misleading medication links: **MD-14 heparin** and **MD-19 potassium chloride**. Replaced with **MD-15 insulin (intravenous)** and **MD-20 calcium gluconate**, including debrief link. Calcium gluconate's registered product label addresses hypocalcaemia and is not an independent hyperkalaemia emergency order. |
| `content/drafts/batch-07/D04-T06-potassium-disorders.md` | Added original `6c` teaching note with a fictional K 6.2 mmol/L example: a 12-lead ECG indication in detailed guideline does not mean continuous monitoring is automatically indicated for every otherwise stable patient. Calls for local medical/renal policy reconciliation and cautions against waiting when clinical signs deteriorate. |
| `tests/unit/p1-hyperkalemia-ecg-link-safety-batch-10.test.ts` | Five regression tests check source discrepancy, immediate response, safe medication relationships, follow-up monitoring and structural/draft validation. |
| `src/content/draft-index.json`, `src/content/draft-history.json` | Recomputed scenario/topic hashes, source licensing metadata and case gap count. No false source read-in-full flag. |

## Not within this review

- No 2026 UKKA dose or drug-administration tables have been imported, and no specific treatment product/amount, ECG machine setup, medication rate or dialysis prescription was authored.
- The source-owner discrepancy between its 14.1 summary and detailed text remains **open** for a qualified nephrology/critical-care reviewer.
- The simulation's answer points and branching choices remain **AI-authored**, not independently clinically validated.
- Additional **GI/hepatic, endocrine and trauma** teaching modules are outside the present original 40-topic inventory and should be separately scoped and reviewed.

## Before learner release

Independent nephrology, ICU nursing educator, intensivist and pharmacy review; local emergency potassium and ECG monitoring policy validation; confirmation of commercial source-reuse rights; source-owner clarification if available; full green technical CI; and actual learner-facing publication controls. **No merge, deployment or removal of draft warnings.**
