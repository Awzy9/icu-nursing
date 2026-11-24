# P1 source requirement triage — 24 November 2026

Staff-only planning; not clinical approval, local policy validation or source rights clearance.

## Current register snapshot

Read generated draft-index blob 568df5ed4fa6b48fc652b213a028014f4f9dc6b9. 166 distinct drafts, 118 declared required-source items, 87 drafts with at least one independent source-gap signal, 161 with at least one rights-review signal. These are overlapping categories, not counts of unsupported claims. All remain unreviewed.

| Type | Drafts | Required-source items | Source-gap drafts | Rights-review drafts |
|---|---:|---:|---:|---:|
| Topics | 40 | 31 | 23 | 40 |
| Questions | 11 | 0 | 7 | 11 |
| Skills | 25 | 0 | 12 | 25 |
| Medications | 50 | 0 | 5 | 50 |
| Cases | 20 | 44 | 20 | 20 |
| Equipment | 8 | 24 | 8 | 8 |
| Practice | 12 | 19 | 12 | 7 |

Prior reported requirement count 127; current snapshot 118. No items closed by this report. Cases and equipment account for 68 of 118 items. Zero declared requirements is not equivalent to complete evidence.

## First priority: selected scenario requirements

| Draft | Open items | Next evidence/owner action |
|---|---:|---|
| SC-01 septic shock | 4 | External UK policy comparator identified below; actual local sepsis/vasopressor and extravasation procedures, full SSC evidence tables, independent pharmacist and critical-care review remain open. |
| SC-02 cardiogenic shock | 2 | Cardiologist/ICU educator to check full contemporary guidance, escalation and local vasoactive and mechanical support policies. |
| SC-03 respiratory deterioration | 2 | Respiratory clinician to appraise oxygen guidance and condition-specific pathways; obtain local outreach and escalation rules. |
| SC-04 ventilator alarm | 1 | Obtain installed ventilator model/version IFU, emergency alarm policy and device competency sign-off. |
| SC-05 oxygen desaturation | 2 | Obtain local airway/oxygen/suction and chest-drain emergency pathways. |
| SC-06 accidental extubation | 1 | Local emergency airway and prevention policy plus independent appraisal of cited sources. |
| SC-09 postoperative bleeding | 3 | Major-haemorrhage guideline appraisal, rights clearance, actual institution blood policy and emergency release/coagulopathy pathways. |
| SC-11 severe hyperkalaemia | 3 | UKKA threshold discrepancy requires source-owner/renal reviewer clarification; obtain unit protocol and confirm reuse terms. |

## SC-01 external comparator — targeted evidence check

* [NICE NG253, managing suspected sepsis, recommendations 1.8.11–1.8.13](https://www.nice.org.uk/guidance/ng253/chapter/Managing-suspected-sepsis): the recommendation-level HTML places route selection with the responsible senior/critical-care clinician and requires local policy for peripheral administration and visible access. Supports the existing scenario's escalation/monitoring scope, not a universal dosing or catheter rule. NICE commercial reuse restrictions remain.
* [Frimley Health NHS Foundation Trust, Peripheral Noradrenaline](https://guidelines.fhft.nhs.uk/Intensive_Care-Cardiovascular-Peripheral_Noradrenaline), version 1.0, issued 3 September 2024, review due July 2027: selected HTML scope, access and monitoring sections checked. This is an institution-specific pathway for critical-care-led adult care and supervised transfers. It supports the rationale for a second access plan and close site assessment. It is a comparator, not permission to use that hospital's medication or extravasation instructions elsewhere. No dose or procedure copied; rights unverified.
* [AACN nursing commentary on peripheral vasopressors](https://www.aacn.org/blog/peripheral-vasopressor-administration): selected evidence discussion examined as secondary context, not a guideline or validated bundle. It highlights limited certainty and the need for institution-specific access, extravasation and escalation pathways. Copyright not cleared.
* [2026 systematic review of peripheral vasopressor protocols](https://pubmed.ncbi.nlm.nih.gov/42143789/): indexed abstract reports no statistically significant reduction in extravasation with protocols; does not establish that protocols are unnecessary or that peripheral treatment is risk-free. Full text, methods, heterogeneity and rights not appraised.

Disposition: candidate UK comparator located for SC-01 required-source item 2. Keep item open until source registration and scope/rights review, and do not substitute this for a local SOP. No change to canonical clinical drafts or review dates in this report. No production settings or approval flags changed.

## CI repair

Commit 81c83aed7c24dd749435eeb174ce3f2ebfbe15dc removes brittle fixed counts from the staff-filter regression, preserving exact positive and negative membership checks against source metadata, fixture semantics and SC-11 sentinel checks. Prior CI had one failure: 88 expected source-gap entries vs 87 observed. Fresh CI required.
