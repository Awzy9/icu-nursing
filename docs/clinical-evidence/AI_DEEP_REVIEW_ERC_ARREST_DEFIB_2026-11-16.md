# Targeted AI evidence audit — adult arrest and defibrillation (2025 ERC / RCUK)

**Review date:** 2026-11-16. **Scope:** all 12 MCQ stems, four options, keys and explanations in D02-T14 and D02-T15; selected clinical summary claims. **Evidence basis:** accessible 2025 Resuscitation Council UK BLS, ALS, and post-resuscitation HTML guidance, which expressly cites the corresponding ERC 2025 guidelines. These are not replacements for a complete comparison of the underlying ERC/ESICM full guideline texts, evidence tables, training and local policies. **Clinical approval: none; publication: none.**

Source URLs:
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/post-resuscitation-care-guidelines

## D02-T14: Cardiac arrest and immediate post-ROSC

| MCQ | Answer | Evidence check | Action |
|---|---|---|---|
| Q1 unresponsive with abnormal breathing | A | Supports urgent help and immediate CPR on the bed; if an established valid treatment limitation exists, local decisions govern. | No change. |
| Q2 compressions on bed | A | RCUK 2025: depth **5–6 cm**, rate **100–120/min**, recoil, minimal pauses; begin CPR on the bed rather than delaying to move patient to floor. Mattress compression affects hand travel; it is **not permission to exceed the chest compression depth target**. | **Clarified option and rationale** to avoid teaching unbounded extra depth. |
| Q3 calling on concern | D | RCUK ALS encourages responding on clinical concern and deterioration; scores do not replace judgement. | Retained. |
| Q4 falling MAP after ROSC | B | RCUK post-resuscitation care recommends preventing hypotension, aiming for MAP above approx **60–65 mmHg**, individualized by team. MAP 52 and falling is urgent. | Clarified patient-specific ordered target in rationale. |
| Q5 team neuroprognostication | B | RCUK post-ROSC recommends delayed multimodal assessment, confounder exclusion; nurse records and reports, does not make independent prognosis. | Clarified CPR mattress-mode instruction must not delay compressions. |
| Q6 sedatives confounding examination | D | RCUK explicitly describes confounding effect of sedation and neuromuscular blockade; records are relevant to neurological interpretation. | Retained. |

**Population caveat:** D02-T14's generic '30:2' refers to BLS before an advanced airway is in place, not ventilation once an advanced airway and continuous compressions are used. Additional algorithm/nursing-institution checks remain necessary.

## D02-T15: Defibrillation safety and team roles

| MCQ | Answer | Evidence check | Action |
|---|---|---|---|
| Q1 supplemental oxygen / fire precautions | B | ALS 2025: remove free-flow oxygen masks or cannulae away from chest (≥1 metre); leave a ventilator/SGA/ETT circuit connected with exhaust away from chest. Avoid interpretation that stopping all ventilation is appropriate. | Retained; safety and team coordination remain essential. |
| Q2 manual compressions, shock pause | D | Compress during defibrillator charging, pause for safety check, do not shock during manual compressions, resume immediately. | Retained. |
| Q3 implanted device | C | Pads should be more than **8 cm** from implanted device or alternative position. | Retained. |
| Q4 pads vs paddles | A | RCUK 2025 prefers adhesive pads where available. | Retained. |
| Q5 urgency before defibrillator | C | CPR and call for help first; prepare device promptly. | Retained. |
| Q6 authorized shock delivery | A | **Scope wording error:** draft implied selecting energy is always a physician-only decision. RCUK says trained rescuers competent in rhythm identification and safe manual defibrillator operation may perform it. Actual authority depends on institution and national scope. | **Corrected question stem and explanation** and clarified summary table. |

**Other targeted source checks:** RCUK also emphasizes correct lateral/apical pad placement in the mid-axillary line, minimum hands-off time (aim <5 seconds peri-shock), and single shocks followed by two minutes of compressions except a narrow monitored-witnessed scenario where stacked shocks can be considered. Those statements are not tested by all MCQs yet and need line-by-line reconciliation of the full narrative.

## Implemented repository changes

- D02-T14 and D02-T15 unpublished topic drafts edited in separate development-branch commits.
- Generated staff-only `src/content/draft-index.json` and `draft-history.json` updated for correct hashes and audit trail; no reviewer identities or clinical approval flags altered.
- Source copyright remains restricted: RCUK/ERC algorithms, tables, figures and extended protected wording have not been copied or embedded.

## Limitations and follow-up

- **12 questions audited against accessible 2025 RCUK guideline content at targeted claim level; this is not certification of the full topics or all international resuscitation guidance.**
- Q1 cardiac arrest is a theoretical simulated scenario, not a substitute for training, valid patient-specific ceilings of treatment or local resuscitation protocols.
- RCUK/European guidance does not itself determine Saudi nursing scope; verify with SCFHS/employer and authorized professionals prior to release.
- Before formal review: check underlying full ERC source wording, latest copyright/usage permissions, and local ALS training requirements; confirm any new source revisions since 2025.
- GitHub CI and isolated Supabase must be checked on final report commit before claiming tests passed; no production deployment or merge authorized.
