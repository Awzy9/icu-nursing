# P1 clinical curriculum depth — Batch 02 (2026-11-23)

**Branch / review:** `p1/clinical-content-batch-01-20261123` / draft PR #113.  
**Status:** Source-linked **drafts** only. No human clinical approval, no production publication, no patient-specific recommendations, no drug doses or device-setting instructions.

## Delivered in this batch

| Area | Draft | Improvement | Source limitations |
|---|---|---|---|
| Peripheral vasopressors | `D02-T12` | Distinguishes infiltration/extravasation warning signs from a general pump failure; directs prompt cessation *at the compromised site*, assessment, local-policy escalation, preserving catheter for approved evaluation, and **concurrent continuity of life-sustaining vasopressor support through clinician-directed alternate access** | UIC clinical-pharmacy educational review (Sept 2026); relevant first-response text read, not a formal local standing order. No antidote preparation, dosing or universal monitoring frequency |
| Hypokalaemia | `D04-T06` | Adds UK adult low-potassium severity categories, clinical recognition, magnesium and renal-function association, monitoring, high-alert potassium-concentrate safeguards | NHS SPS medication-safety advice (published Aug 2024); selected sections reviewed; not a critical-care nursing prescribing guideline or a potassium replacement order set |
| Extubation | `D01-T17` | Separates successful SBT from airway-protection and extubation decisions; introduces **selected high-risk cuff-leak review** and risk-stratified post-extubation HFNC/NIV planning; adds deterioration surveillance without fixed thresholds | AARC 2024 SBT main publication already registered; ATS/CHEST 2017 selected recommendation excerpt; ATS 2026 noninvasive respiratory support **PubMed abstract only**. Not a full-text ATS 2026 evidence appraisal |

**Sources registered in** `sources/source_register.csv` (2026-11-23):
- `S-UIC-EXTRA-2026`: https://dig.pharmacy.uic.edu/faqs/2026-2/september-2026-faqs/what-are-current-recommendations-for-treatment-of-drug-extravasation/
- `S-NHS-SPS-HYPO-2024`: https://sps.nhs.uk/articles/hypokalaemia/
- `S-ATS-NIRS-2026`: https://pubmed.ncbi.nlm.nih.gov/42371750/
- `S-ATS-CHEST-2017`: https://academic.oup.com/ajrccm/article/195/1/120/8498933

## Quality and safety boundaries

1. The new teaching is **not** an instruction to stop life-sustaining vasoactive therapy without a plan. A suspected extravasation requires stopping delivery through the compromised site while urgently securing alternate clinician-directed support, following the local emergency pathway.
2. The newly drafted material **does not provide** phentolamine dose, preparation or injection instructions, potassium replacement concentrations/rates/doses, nurse-independent ventilator-setting changes, cuff-leak technique, or an NIV/HFNC prescription.
3. **No clinical review state changed**: all three topic headers still contain `status: DRAFT`, `origin: ai_generated`, `clinically_reviewed: false`, and empty reviewer arrays.
4. Older disclaimers and limitations were reconciled after adding evidence, so the texts no longer incorrectly say these selected topics have no information on extravasation, hypokalaemia recognition, or extubation assessment.
5. Site-frequency, device eligibility, extravasation treatments, replacements, high-risk extubation criteria, post-extubation support orders and rescue thresholds require local protocol alignment and **independent multidisciplinary review**.
6. Web and mobile content in the working edition may import drafts. **Do not merge into production before explicit clinical publication gate / content-visibility reconciliation.** All source licence and commercial reuse checks are still open.

## Quality-control record

- Previous batch CI failure identified as missing canonical CRRT source registration and stale generated `src/content/draft-index.json` / `draft-history.json`. Source and index were corrected on the branch.
- Batch 02 topic content was followed by matching draft-index and history updates; CI must independently confirm the generated metadata and history are identical to the scripts' output.
- If any CI check fails, keep this PR in draft; no auto-merge and no TestFlight submission.

## Remaining P1 work (in priority order)

1. Reconcile the expanded vasopressor lesson with individual drug drafts and infusion-pump practice; clinician/pharmacist review.
2. Validate potassium monitoring and safety material against medication `MD-19`, `MD-20` and the high-alert teaching workflows; no dose/rate instructions.
3. Review the new extubation risk-language with respiratory therapy and intensivist reviewers, then reconcile the ventilation lesson and scenarios.
4. Complete missing adult ICU topic domains: GI/hepatic/endocrine and postoperative/trauma/burns, plus chest drains and pneumothorax.
5. Manual review of each MCQ, simulation branch, licensed clinical visual and evidence citation.
6. Implement defensible per-item review status in the actual working-edition publication path before deploying changes.

**Not clinically approved or published.**
