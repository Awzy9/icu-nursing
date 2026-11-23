# P1 Clinical Curriculum — Batch 07 (2026-11-23)

**Branch:** `p1/clinical-content-batch-01-20261123`  
**Status:** AI-assisted fictional teaching drafts, **not clinically reviewed**, not a validated emergency response protocol and not published. All 20 original scenario identities and step counts remain unchanged.

## What was fixed

| Scenario | Prior safety concern | Revision |
|---|---|---|
| `SC-16` Acute hypotension | Correct first response gathered measurements, while urgent emergency help was not called until the third step although patient was drowsy with a new low pressure | Requires **immediate clinical escalation at step 1**, in parallel with bedside ABC/perfusion assessment, repeat/signal checks and medication-line review. Step 2 now communicates capillary refill/skin/urine loss trends without assuming hypovolaemia is the only cause. Step 3 re-escalates if help has not arrived. No empiric fluid or vasopressor order introduced. |
| `SC-18` Aspiration event | Initial response mentioned stopping feed and seeking help, but underemphasised urgent respiratory support and implied a diagnosis from a single symptom | Requires urgent respiratory-team assistance and patient-first airway/oxygenation checks. Distinguishes possible tube displacement, uncertain placement, and a clinical aspiration diagnosis. Tube stays unused until approved reassessment; no suction, PPV, bronchoscopy or antibiotic regimen invented. |
| `SC-19` Anaphylaxis | Step 2 taught injection site after step 1 yet could look like an additional wait for a new prescription before first-line therapy | Clarifies that first-line **IM adrenaline is time-critical under an institution's authorised emergency pathway** and the later site check cannot delay treatment. Does not endorse unsupervised dosing, IV use, or an alternative to emergency clinician/ALS support. |
| `tests/unit/p1-emergency-sequencing-batch-07.test.ts` | No specific guard for correct emergency-call sequencing | Adds five tests for step-1 shock escalation, team-led resuscitation, aspiration differential, no anaphylaxis treatment delay, scenario-validator consistency and draft-only flags. |
| `src/content/draft-index.json` and `draft-history.json` | Draft content hashes/metadata become stale with every edit | Registered the new source reference for SC-16, updated deterministic hashes and recorded history for three cases. |

## Evidence and limitations

1. **European Society of Intensive Care Medicine:** *ESICM guidelines on circulatory shock and hemodynamic monitoring 2025*, Intensive Care Medicine 51:1971–2012, doi:10.1007/s00134-025-08137-z. Society [publication announcement](https://www.esicm.org/esicm-guideline-circulatory-shock-haemodynamic-monitoring/) and [PubMed](https://pubmed.ncbi.nlm.nih.gov/41236566/) assessed on 2026-11-23. Supports serial clinical perfusion assessment and broader diagnostic assessment in adult shock; **the full recommendation tables were not reviewed**. Existing source ID `S-ESICM-SHOCK-2025`, registered RED citation-only, was added to SC-16.
2. **Existing Open RN Nursing Fundamentals** `S-OPENRN-FUND-CH15-6` discusses shock recognition and changes in mental status/skin/urine output; the nursing response sequence is an original case author interpretation pending credentialed review.
3. **Existing NEWS2** `S-RCP-NEWS2` and **AHRQ TeamSTEPPS** `S-AHRQ-TS` provide escalation and handover context.
4. **Existing NICE CG32 / NHS NGT safety alert** `S-NICE-CG32`, `S-NHSE-NGT-2016`; **SHEA VAP 2022** `S-SHEA-VAP-2022` supports tube-placement and enteral infection-risk recognition but **does not constitute an ICU aspiration treatment algorithm**.
5. **Resuscitation Council UK:** [Anaphylaxis healthcare-provider guideline, May 2021](https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions). The website confirms this remains its most recent *healthcare-provider anaphylaxis guideline* as of 2026-11-23. The separate [2025 first-aid guidance](https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines) provides context but does not substitute for an in-hospital emergency pathway. The existing source `N-RCUK-ANAPH-2021` is RED reproduction-restricted; no RCUK algorithms, charts or dosing tables copied.
6. Medication labels referenced are route/product-specific; no doses or rates were copied.

## Required before learner release

- Urgent clinical review by ICU nurse educators, intensivists, airway/RT educators, emergency-trained pharmacists and relevant local clinical governance teams; evaluate every branch and scoring rule.
- Confirm emergency protocols, professional scope and whether local standing orders permit nurse-authorised IM adrenaline. These drafts do not grant authority.
- Clear all source reuse restrictions, especially ESICM 2025 and RCUK 2021 copyrighted material.
- Maintain explicit draft/publish gating: the existing working-edition content exposure concern remains; **passing automated tests is not clinical review**.
- Do not merge/deploy this PR on the basis of these draft-only improvements.
