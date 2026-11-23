# P1 clinical curriculum — Batch 06: Chest drain and pleural emergency recognition

**Date:** 2026-11-23  
**Status:** AI-assisted educational drafts only. **Not independently clinically reviewed or published.** PR #113 must stay draft.

## Scope of this batch

1. `SK-13-chest-drain-monitoring.json`: changed from introductory equipment observations to an expanded, patient-centred recognition and escalation guide.
   - Recognise that hypoxia, respiratory distress, circulatory compromise and chest asymmetry take priority over interpreting the underwater-seal chambers.
   - Explicitly distinguish fluid drainage for pleural effusion from a bubbling pneumothorax drain. Clamping instructions for controlled effusion drainage **must not** be generalised to an ongoing air-leak/pneumothorax drain. Routine or transport clamping is unsafe; any exception requires specialist instruction.
   - Explain why new continuous bubbling, sudden cessation, and absent swinging have multiple possible explanations; no finding alone reliably diagnoses a patent, displaced or blocked drain. Water-seal, digital and dry-seal systems differ.
   - Add documentation of fluid/blood drainage trends, tubing or chest drain displacement concerns, and urgent response for suspected tension physiology; **do not wait for imaging before requesting emergency assessment** in clinical deterioration.
   - Keep catheter reinsertion, suction alteration, clamp-to-localise procedures, removal and setup within the unit/manufacturer procedure and competent operator's authorisation; no bedside procedural algorithm or settings included.
2. `SC-05-sudden-oxygen-desaturation.json`: altered the fictional initial assessment to include chest expansion and circulatory clues; identifies pleural causes as a possible differential, not as a diagnosis from a single monitor observation. Adds SK-13 cross-reference and debrief point, while keeping the case's original secretion-focused scenario and 3-step decision graph.
3. `content/drafts/skills/NEW_SOURCES.csv`: the `N-NCBI-OPENRN-CHEST` source previously marked not read was directly accessible as HTML. Reclassified **partial** after inspecting the drainage-system and nursing assessment/troubleshooting sections; unrelated chapters, figures and source licensing exceptions remain unreviewed.
4. `src/content/draft-index.json`, `src/content/draft-history.json`: refreshed metadata, source bands and SHA256 hashes for both modified clinical drafts.
5. `tests/unit/p1-chest-drain-pleural-safety.test.ts`: regression checks for patient-first assessment, effusion/pneumothorax differences, non-diagnostic swinging, expert-only device actions, correctly traced sources, structural validity and false clinical sign-off.

## Evidence inspected

- **British Thoracic Society.** Clinical Statement on Pleural Procedures (2023), public web description and statement extracts; previously partially/full recorded in source register as `N-BTS-PCS-2023`. https://www.brit-thoracic.org.uk/clinical-resources/clinical-statements/pleural-procedures/  — copyrighted, explicitly restricted from commercial reuse in the existing source log. **Citation-only.** The original document has a correction dated June 2026 that needs independent cross-check before sign-off.
- **Open RN Nursing Advanced Skills, Chapter 6.** https://www.ncbi.nlm.nih.gov/sites/books/NBK594490/ — sections on traditional water-seal systems, chest assessment, drain observations, complications and emergency warning signs inspected directly on 2026-11-23. Text attributed to the Open RN book's CC BY 4.0 licence conditionally; tables and third-party figures were not reused or clearance-assessed.
- **NSW Agency for Clinical Innovation.** Adult pleural drain troubleshooting pages. https://aci.health.nsw.gov.au/networks/respiratory/resources/pleural-drains-in-adults/section-3-management/trouble-shooting — used to cross-check that complex drain responses are organisation- and device-specific; **not** listed as a fully read practice source and not used for step-by-step procedures.
- A newer 2026 BTS quality standard exists but has not had its full clinical recommendations and licensing inspected. No claim that BTS 2023 is globally superseded or equivalent is made.

## Clinical limits

- A critical-care nurse educator, pleural or thoracic specialist, respiratory therapist and trained device operator must review this material. Confirm separate pathways for trauma, postoperative drain systems, severe pleural effusion and mechanical ventilation.
- The 2023 BTS clinical statement is **not licence-cleared for commercial reproduction**; this batch independently phrases recognition and governance ideas, with copyright and publication review still outstanding.
- This is not guidance for patient-specific clamping, suction adjustment, needle decompression, blood-return or drain removal. No device thresholds or procedural sequences were added.
- Even if CI passes, the technical checks do not confer clinical competence or permit publication. Keep all `clinically_reviewed` fields false and the PR unmerged.

**Next:** review trauma/haemothorax and acute pulmonary deterioration against independently accessible guidance, and expand GI/hepatic/endocrine curriculum after evidence and licence screening.
