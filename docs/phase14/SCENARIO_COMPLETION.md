# Phase 14 - clinical simulation drafts: 20 of 20

All 20 master scenarios are now structured decision graphs (3 steps each, changing observations, 3 options per step with points, scope-of-practice labels, feedback, consequences and a source trace on every option, plus a structured debrief). Every one remains an **unpublished DRAFT, not clinically reviewed, fictional patient, never imported**; the case engine still only knows synthetic fixtures (`tests/unit/scenario-roundtrip.test.ts` proves a clinical draft cannot be converted into the seed).

New this phase: SC-02 Cardiogenic shock, SC-05 Sudden oxygen desaturation, SC-07 Raised intracranial pressure, SC-09 Postoperative bleeding, SC-12 Acute arrhythmia, SC-16 Acute hypotension (`content/drafts/scenarios/build_scenarios_e.py`).

## Evidence used (read this phase, in Chromium, whole page)
| Scenario | Main sources | Licence class |
|---|---|---|
| SC-02 | ESICM 2014 consensus, dobutamine and milrinone FDA labels (read earlier); OpenStax Med-Surg 35.2 as a cross-check only | Labels public; ESICM CC BY-NC; **OpenStax CC BY-NC-SA, cross-check only** |
| SC-05 | Open RN Nursing Fundamentals 8.3; AARC oxygen and suctioning CPGs; NEWS2 | GREEN / licensed (cite) |
| SC-07 | Open RN Health Alterations 9.9 (ICP manifestations and interventions boxes); mannitol FDA label | GREEN |
| SC-09 | Open RN Health Alterations 2.5 (Table 2.5c hemorrhage); heparin and enoxaparin labels; OpenStax 27.3 cross-check only | GREEN; **OpenStax cross-check only** |
| SC-12 | Open RN Nursing Advanced Skills 7.4 (re-read in full); amiodarone and adenosine labels; ERC 2025 | GREEN |
| SC-16 | Open RN Nursing Fundamentals 15.6; ESICM 2014; phenylephrine label; NEWS2 | GREEN |

## Honest limits (also recorded in each draft's `gaps`)
- Most Open RN content is entry-level and US-oriented; none of it is an ICU guideline. Support is therefore `partial` for most options; `sourced` is used only where the statement is in a source read in full.
- No source usable commercially was found for cardiogenic-shock recognition at nursing level. The OpenStax chapter is CC BY-NC-SA and forbids generative-AI ingestion without permission; it was read through a summarising reader, is used only to cross-check, nothing is copied, and the register marks it RED. **Before any release the SC-02 and SC-09 statements citing it must be re-supported or permission obtained.**
- No doses, rates, energies, numeric thresholds, ICP/CPP values, blood-loss volumes or treatment protocols are written (the validator rejects dose patterns and asserted normal bands). Head-of-bed angle, oxygen targets, fluids, vasopressor changes, cardioversion and defibrillation are all left to the order, the protocol and trained staff, and the options teach exactly that boundary.
- The cardioversion and defibrillation section of Open RN Advanced Skills could not be reached (404) and is not used.
- The earlier gap in SC-16 stays: nothing read supports comparing an arterial with a cuff reading, so that step is absent.

## Checks
`validateScenarioDraft` passes all 20; the set check requires 1..20 once; round-trip tests show every graph converts only in memory with a non-fixture code and is never seeded.
