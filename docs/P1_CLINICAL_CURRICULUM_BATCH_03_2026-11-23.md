# P1 clinical curriculum — Batch 03: medication and scenario safety alignment (2026-11-23)

**Scope:** adult ICU nursing reference drafts; not clinical approval, not a prescription or a published simulation.  
**Branch:** `p1/clinical-content-batch-01-20261123`, draft PR #113.

## Completed

| Artifact | Problem identified | Change | Evidence / limitation |
|---|---|---|---|
| `MD-01-norepinephrine.json` | Generic "do not stop the infusion" warning conflicted with suspected extravasation management | Explicitly distinguishes avoiding unnecessary interruption of a functioning infusion from stopping drug delivery **through the injured catheter** while urgently maintaining support by clinician-directed alternative access. Adds site monitoring and escalation. | US FDA norepinephrine label (product-specific); UIC September 2026 clinical pharmacy review (selected text read). No antidote dose, site frequency or catheter manipulation taught. |
| `MD-02-epinephrine.json` | Route-specific teaching did not clearly distinguish IV extravasation from IM anaphylaxis treatment | Adds route-specific site assessment and IV extravasation escalation without applying IV catheter instructions to an intramuscular injection. | US FDA epinephrine label + UIC pharmacy review; local formulary/indication requirements apply. |
| `MD-19-potassium-chloride.json` | Expanded hypokalaemia lesson was not linked to medicine safety concepts | Adds checks of potassium trend, renal function, magnesium and urine output, high-alert product identification and explicit prohibition against IV push/flush of potassium concentrate. | US product-label safety information and NHS SPS 2024 UK specialist clinical pharmacy advice. No potassium replacement rate, concentration, dose, pharmacy compounding or monitoring interval supplied. |
| `SC-01-septic-shock.json` | Scenario required explicit consistency with norepinephrine medication guidance | Clarifies the distinction between maintaining a safe infusion through a functioning line and stopping infusion through a suspected extravasated cannula; emphasizes alternative-access support. | Previously registered SSC 2026 and product-label sources. Fictional case requires independent clinician item/branch review. |
| `tests/unit/p1-medication-scenario-safety.test.ts` | No targeted regression protection for this safety distinction | Adds regression assertions across drug drafts and the septic shock decision case; checks no drafts are marked clinically reviewed or pharmacist reviewed. | Automated assertions **do not** verify clinical correctness. |

## Evidence verified this batch

- UIC College of Pharmacy, *What are current recommendations for treatment of drug extravasation?*, September 2026. https://dig.pharmacy.uic.edu/faqs/2026-2/september-2026-faqs/what-are-current-recommendations-for-treatment-of-drug-extravasation/
- NHS Specialist Pharmacy Service, *Treating acute hypokalaemia in adults*. https://sps.nhs.uk/articles/hypokalaemia/
- 2026 Surviving Sepsis Campaign, peripheral vasopressor comments and limitation about site, dose, duration and route. https://www.survivingsepsis.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
- AARC 2024 SBT guidance, confirms passing a breathing trial does not establish extubation readiness when airway clearance or protection is inadequate. https://pmc.ncbi.nlm.nih.gov/articles/PMC11285503/

## Release gates (not met)

1. Draft content has no independent nursing educator, ICU pharmacist, or prescribing/RT specialist approval.
2. Regional practice differences, licences and product-specific labeling must be checked before any clinical publication.
3. The active working-edition content path and subscriber/mobile synchronization require a deliberate review gate before merge.
4. The CI must pass after the final content-index/history regeneration (not merely before the changes).
5. New screenshots, bedside medication-setting controls or patient-specific recommendations are out of scope.

**Next P1 clinical review:** compare the vasopressor and potassium lessons with medication `MD-30`/`MD-31`, calcium `MD-20`, pump `SK-22`, and simulated treatment consequences. Then prioritize still-missing GI/hepatic/endocrine, postoperative/trauma and chest-drain curriculum.
