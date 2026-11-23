# P1 clinical curriculum — Batch 11 (23 November 2026)
**PR #113, existing draft branch `p1/clinical-content-batch-01-20261123`. No clinical approval, merge, publication or deployment.**

## Delivery
Added three distinct **pre-import, unpublished** clinical teaching proposals outside the original 40-topic and original 20-scenario inventory:
- `content/proposals/p1-11/GI_HAEMORRHAGE_NURSING.md`: patient-first GI bleed recognition, anti-delay escalation, peptic-ulcer versus variceal scope, emergency transfusion identification, post-haemostasis surveillance and the new regional 2026 SUP prevention/deprescribing context.
- `content/proposals/p1-11/ACUTE_LIVER_FAILURE_NURSING.md`: ALF vs ACLF, neuro-aspiration/glucose/renal surveillance, differential encephalopathy assessment, serial organ trend handover and early transplant-centre referral.
- `content/proposals/p1-11/TRAUMA_HAEMORRHAGE_NURSING.md`: traumatic shock and coagulopathy red flags, safe emergency blood-process coordination, temperature/metabolic trends, and the TBI exception to permissive hypotension.
Each contains three original knowledge checks and one multi-phase fictional case specification, **not validated scoring or clinical treatment algorithms**.

## Newer evidence checked
- ESGE peptic ulcer bleeding guideline **2026** (PubMed selected recommendations and later erratum listed): https://pubmed.ncbi.nlm.nih.gov/42127996/ . Full 2026 guideline and correction context remain pending specialist comparison.
- Saudi Critical Care Society, Scandinavian and Kuwaiti joint **2026** stress-ulcer prophylaxis guidance, selected web sections: https://doi.org/10.1111/aas.70201 .
- AASLD–AST adult liver transplant assessment **2026**, selected ALF referral guidance: https://pmc.ncbi.nlm.nih.gov/articles/PMC13070310/ .
- Multisociety **2026** ACLF consensus, selected neurological and multiorgan sections: https://doi.org/10.1007/s12072-026-11169-2 .
- Pan-European major trauma bleeding/coagulopathy sixth edition **2023** (targeted web sections): https://doi.org/10.1186/s13054-023-04327-7 .
- German in-hospital polytrauma coagulation systematic review/guideline update **2025** (abstract and selected sections): https://doi.org/10.1007/s00068-025-02919-2 .

All statements were independently paraphrased for nursing recognition/escalation; no treatment dose, diagnostic scoring table, graphics, protected algorithm, or institution-independent product protocol imported. Source reuse permissions are **unverified** for commercial teaching; evidence coverage is **partial**. A citation is not a licence.

## Technical and safety gate
- `tests/unit/p1-expansion-batch-11.test.ts` enforces proposal status and asserts that `buildWorkingContent()` does not import them into the learner-facing working edition.
- The source scanner currently enumerates `content/drafts/batch-*` and the established draft subdirectories, not `content/proposals`; this placement is **deliberate** because the working edition can surface original draft content. Do **not** move proposals into `content/drafts` without an explicit reviewed-and-published gate.
- Existing generated index/history are intentionally untouched; the proposals are **not** indexed as approved/reviewed content.
- Follow-on work before publication: validate separate variceal and lower GI pathways; inspect ESGE 2026 erratum/full guideline; local Saudi/international adaptation; hepatology/trauma/blood-bank/ICU nurse educator review; source rights; technical CI; verify true runtime publication gate.
- Nothing here states the proposals are ready for learners.
