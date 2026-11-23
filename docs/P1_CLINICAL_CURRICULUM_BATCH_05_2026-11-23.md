# P1 Clinical Curriculum — Batch 05: Metabolic, Feeding and Postoperative Safety (2026-11-23)

**Draft branch:** `p1/clinical-content-batch-01-20261123`  
**Scope:** AI-assisted, fictional nursing education drafts, not clinical protocols or published content. No changes to the canonical 40-topic inventory or 20-scenario inventory.

## Reviewed and corrected

| Artifact | Finding | Draft improvement |
|---|---|---|
| `SC-10` Hypoglycemia | The scenario said IV insulin was **not running**, then instructed the nurse to stop IV insulin as the best response | Replaced the contradiction with ABC/urgent escalation, a review of medicines *actually* running or previously administered, safe swallowing checks and authorised hypoglycaemia protocols. Added monitoring and multidisciplinary review after a nutrition interruption, plus appropriate protection of basal insulin in type 1 diabetes. |
| `SC-09` Postoperative bleeding | At the first stage the best answer prioritized marking and reinforcing the dressing over summoning urgent help for a patient with deteriorating perfusion | Reordered the response to urgent patient assessment, emergency response/surgeon notification, and supported documentation of wound/drain loss **without delaying shock escalation**. Scheduled anticoagulants, reversal and resuscitation remain prescriber/protocol decisions. |
| `D07-T06` Enteral feeding | Did not discuss the risk when feeding is interrupted while insulin is active | Added section 7b on recognition of nutrition–insulin mismatch, assessment/communication, avoidance of feeding via an unverified tube, and cross-disciplinary glucose monitoring. No insulin doses, rates, dextrose prescriptions, feeding-setting instructions or treatment algorithms were added. |
| `tests/unit/p1-metabolic-surgical-safety.test.ts` | No targeted cross-topic protection against these scenario contradictions | New unit tests for prevention of a nonexistent insulin-stop action, swallow safety, urgent shock escalation, nutrition interruption, no false clinical-review claims and structural scenario validation. |

## Evidence trace and copyright gate

- Existing evidence: UK JBDS adult inpatient hypoglycaemia 2020 (partially read); existing US insulin product label; Open RN postoperative nursing assessment; AHRQ TeamSTEPPS; existing ESICM early enteral nutrition and NICE CG32 guidance.
- **New citation-only source**: ADA Professional Practice Committee for Diabetes. *16. Diabetes Care in the Hospital: Standards of Care in Diabetes—2026*. Diabetes Care 2026;49(Suppl 1):S339–S355, doi:10.2337/dc26-S016. https://pmc.ncbi.nlm.nih.gov/articles/PMC12690180/
- Relevant ADA sections were inspected for hypoglycaemia surveillance, feed interruption, ICU insulin practice and documentation. The source is explicitly **RED (cite-only)** because ADA copyright limits educational use to noncommercial conditions and requires permission for third-party posting/adaptation; no ADA text, tables or algorithms have been reproduced in this branch.
- A commercial-use rights review, an independent licensed evidence base, and independent ICU nursing, pharmacy/endocrine and surgical-ICU review are needed before any derived training material may be displayed publicly.

## Known remaining risks

1. These are **fictional decision graphs**, not bedside protocols; scoring has not been validated by independent clinicians.
2. No individual nurse may independently devise a glucose replacement, insulin alteration, transfusion or bleeding reversal regimen based on this content.
3. The unit's actual hypoglycaemia, insulin-fed-patient, postoperative haemorrhage and transfusion protocols must be reviewed.
4. The production working edition may use some unreviewed drafts indirectly. This PR must not be merged until a defensible publish/review gate and licence check exist.
5. A new CI run is required on the final commit. Green tests are **technical checks, not clinical approval**.

**Unfinished P1 next:** new GI/hepatic/endocrine curricula with permission-cleared evidence, postoperative/trauma/burn coverage, chest drains/pneumothorax, and independent review of the 20 scenario branches.
