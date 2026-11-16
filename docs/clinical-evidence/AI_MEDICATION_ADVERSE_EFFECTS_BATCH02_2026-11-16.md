# Targeted medication draft expansion — 16 November 2026

Scope: MD-29 gentamicin, MD-36 furosemide and MD-44 enoxaparin. This is AI evidence work, not clinical or pharmacist approval. All three remain DRAFT, clinically_reviewed=false and pharmacist_reviewed=false.

## Source verification

Fetched the exact set IDs from the openFDA drug-label endpoint on 2026-11-16. Read each complete adverse_reactions field and compared set ID, version and effective time with the existing currency record and label register. All matched; no label-register edition changes were required.

| Draft | Set ID | Version | Effective date | Targeted additions |
|---|---|---|---|---|
| MD-29 | 977180b3-a222-4282-d485-4a3217674305 | 22 | 20260520 | Renal, auditory/vestibular and neurologic toxicity; respiratory/allergic reactions and electrolyte abnormalities |
| MD-36 | 2f547f7c-0322-465c-9764-43f955d98ab2 | 4 | 20261102 | Systemic hypersensitivity, auditory effects, orthostatic hypotension, severe skin and blood disorders |
| MD-44 | 9e2875df-0f0c-46ec-990f-69108f383f58 | 8 | 20261012 | Thrombocytopenia and common reactions; postmarketing thrombosis, skin necrosis, allergy and hyperkalaemia with reporting limitations |

Sources: https://api.fda.gov/drug/label.json?search=set_id:977180b3-a222-4282-d485-4a3217674305 ; https://api.fda.gov/drug/label.json?search=set_id:2f547f7c-0322-465c-9764-43f955d98ab2 ; https://api.fda.gov/drug/label.json?search=set_id:9e2875df-0f0c-46ec-990f-69108f383f58 . Furosemide also cross-checked at https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2f547f7c-0322-465c-9764-43f955d98ab2 .

The summaries paraphrase selected clinically important reactions rather than reproducing a complete label. No prescribing doses, rates or preparation instructions added. No incidence inferred for voluntary postmarketing reports. US manufacturer-label restrictions, local-protocol requirements and existing evidence-status flags are retained.

## Audit reconciliation

The committed audit still reported 35 single-statement adverse-effect gaps and included dopamine despite its prior expansion. The actual starting draft count was 34. This batch reduces it to 31 (19/50 medication drafts now have multiple adverse-effect statements). This structural count does not mean those 19 have complete clinical approval or complete evidence review.

Regenerated MEDICATION_SUMMARY.csv from all current drafts; its earlier counts were stale across previous expansions. Regenerated both evidence-gap outputs from the current 75 drafts.

## Validation

- Medication validator: 50 drafts, zero issues.
- Focused medication-draft and evidence-audit tests: 13 passed.
- The tsx CLI could not bind its IPC pipe in this runtime; running the same scripts with node --import tsx succeeded.

Remaining: 31 single-statement adverse-effect gaps; existing non-US-label, high-alert, skills and other evidence work. No merge or production deployment performed.
