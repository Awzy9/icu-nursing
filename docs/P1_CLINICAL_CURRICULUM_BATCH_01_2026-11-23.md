# P1 clinical curriculum depth — Batch 01 (2026-11-23)

**Repository:** `Awzy9/icu-nursing`  
**Scope:** adult ICU nursing education only; no patient-specific care, dose calculation, CRRT operating procedure, or clinical competency certification.  
**Status:** **draft source-linked improvements awaiting independent human clinical review and licence assessment**. This is not a publication, a change in the clinical-review database workflow, or a TestFlight/web release.

## What has been changed in this batch

| Area | Draft | Gap addressed | Evidence read for this change | Limitation / reviewer checkpoint |
|---|---|---|---|---|
| CRRT | `D04-T09` | Introduce TMP and filter-pressure-drop trends; reconcile prior statement that no circuit concept was available | LHSC Critical Care Trauma Centre, “Principles of CRRT”, relevant clotting/pressure paragraphs inspected 2026-11-23 | Local-centre educational source, not a cross-device CPG. No numerical limits, connection procedures, citrate or setting changes taught. Require nephrology + ICU nurse educator + CRRT specialist |
| CRRT bedside skill | `SK-17` | Add interpretation caveats, longitudinal observations and escalation without auto-diagnosing clotting | Same LHSC source, partial text | Unreviewed skill, no competency sign-off, no manufacturer procedure |
| Transfusion | `SK-09` | Add immediate suspected-reaction reassessment, product/patient identity recheck, separation of venous access from implicated blood tubing and preservation/escalation | ISBT “Adverse effects of transfusion”, clinical assessment and reporting sections inspected 2026-11-23 | No algorithm/figure copied; individual procedures and rare restart decisions require blood-bank / prescriber direction. Require transfusion specialist and nurse educator |
| Ventilation | `D01-T09` | After an alarm and stabilisation, clarify routine reassessment domains from AARC (tidal volume, pressures, airway and interface) | AARC 2024 patient-ventilator assessment guideline recommendations, previously registered as full-text read and independently checked this batch | NOT a manufacturer-neutral alarm algorithm; no settings, alarm thresholds or device-specific steps. Require RT + critical-care nurse educator |

Source IDs added to `content/drafts/skills/NEW_SOURCES.csv`: `S-ISBT-ATR-EDU` and `N-LHSC-CRRT-PRINCIPLES`. Both reuse permissions are **unverified** and their content is paraphrased, not reproduced; promote them into the canonical source register only after the source/license workflow is reconciled.

### Sources checked

1. International Society of Blood Transfusion, [Adverse effects of transfusion](https://www.isbtweb.org/resources/educational-modules-on-clinical-use-of-blood/adverse-effects-of-transfusion.html). Clinical assessment and reporting text, especially the response to suspected acute transfusion reaction, read 2026-11-23. Other sections and embedded figures not comprehensively assessed. Institutional transfusion and haemovigilance policy takes precedence.
2. London Health Sciences Centre, [Principles of CRRT](https://www.lhsc.on.ca/critical-care-trauma-centre/principles-of-crrt). Monitor-for-clotting, transmembrane-pressure and filter-pressure-drop sections read 2026-11-23. Other material includes **local protocols and device-specific therapy instructions**, none of which is imported.
3. Goodfellow et al. [AARC Clinical Practice Guideline: Patient-Ventilator Assessment](https://www.aarc.org/wp-content/uploads/2024/10/patient-ventilator-assessment-aarc-cpg.pdf). Respir Care 2024;69(8):1042–1054. Existing registered full-text evidence, recommendations revisited 2026-11-23; used only for patient-ventilator assessment, not alarm-specific troubleshooting.

## Remaining P1 content queue (next batches; not changed yet)

| Sequence | Priority | Topics / skill drafts | Why it remains open | Proposed acceptance check |
|---|---|---|---|---|
| 1 | Critical | `D02-T12` and medication drafts `MD-01`, `MD-02`, `MD-30`, `MD-31` | Peripheral vasopressor site surveillance and suspected extravasation response are not a complete nursing pathway; concentrations, duration and compatibility vary | Nurse educator + critical-care pharmacist + vascular-access clinician agree on monitoring and immediate escalation **without generic drug dosing** |
| 2 | Critical | `D04-T06`, `MD-19`, high-alert skill and pump module | Potassium/hypokalaemia content and concentrated-electrolyte safeguards need fuller jurisdiction-relevant sourcing | Source-traced recognition, safe handling, prescriber/pharmacist boundaries and adverse-event escalation; no unsafe universal replacement regime |
| 3 | High | `D01-T17`, `SK-04`, `SK-07` | Extubation readiness and post-extubation recognition are less complete than the SBT material | Distinguish SBT success from extubation suitability; respiratory therapist/intensivist review; source every nursing response |
| 4 | High | `SC-04`, `SC-15`, `EQ-02`, `EQ-06` | Ventilator/CRRT case and visual modules need to match clarified source limitations | Clinical case-by-case review of alarms, graphics, wording, answer rationales, scope and source trace |
| 5 | High | `D08-T03`, `SC-14` | Transfusion skill revisions need consistent reflection in case, topic and visual practice workflows | Compare reaction escalation across lesson, scenario, quiz and skill; specialist sign-off |
| 6 | High | Chest drain, pneumothorax, GI/hepatic/endocrine, surgical/trauma/burns topic roadmap | Important ICU curriculum breadth gaps; not completed by this batch | Curriculum committee identifies measurable outcomes and primary references before drafting |
| 7 | High | All 50 medication drafts and 306 MCQs | Previous audit found adverse-effect breadth and manual clinical review incomplete | Each critical assertion and option checked against a traceable current source, with a named reviewer and licence clearance |

## Safety, validation and release gates

- Leave `status: DRAFT`, `clinically_reviewed: false` and empty reviewers unchanged. A green validator or CI check is **not clinical approval**.
- Inspect `scripts/validate-drafts.ts` and `scripts/validate-skill-drafts.ts` outcomes on the final branch, then run the full repository checks. If checks fail, fix before merging.
- **Special release concern:** the currently configured *working edition* builds learner-facing material from the `content/drafts` tree; it cannot be assumed to enforce the stricter content publication workflow. **Do not merge these clinical changes into the production working edition until a deliberate publication decision is made with human review.** Merely hiding a draft banner does not grant a clinical review.
- Check every cited source's licence and country applicability, and require named multidisciplinary reviewer sign-off per `CLINICAL_GOVERNANCE.md`.
- Independently verify that no procedure illustrations, manufacturer screenshots, proprietary algorithms, concentration standards, dose tables or clinical competence claims were newly introduced.
- After clinical review, reconcile web/mobile consistency and clinical version tracking, then use a staged deployment and device smoke test before release.

**Batch assessment:** four targeted draft areas improved; **P1 is not complete**, and no draft has been clinically signed off as part of this work.
