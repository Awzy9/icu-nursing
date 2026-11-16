# AI-assisted clinical scenario audit — high-risk batch 1

**Date:** 2026-11-16. **Scope:** Directly inspected fictional scenario decision graphs SC-01 (septic shock/vasopressor extravasation), SC-11 (severe hyperkalemia), SC-14 (transfusion reaction), SC-15 (CRRT circuit complication), and SC-19 (anaphylaxis). **Five scenario drafts inspected; two corrected.** Checked focused source statements only; **not** a full sentence-by-sentence review of these scenarios, and **not** professional clinical approval.

**All scenarios remain:** `DRAFT`, `clinically_reviewed: false`, never imported into learner content or published. No reviewer identity or review date assigned.

## Findings and edits

| Scenario | Evidence screening and findings | Action |
| --- | --- | --- |
| SC-01 — suspected sepsis, peripheral norepinephrine | The first branch prioritizes urgent assessment; subsequent branches emphasize infusion-site checks and protocol-led action for suspected extravasation. Distinguish *avoiding inadvertent interruption* from *promptly responding to extravasation*: these aren't contradictory. The current norepinephrine manufacturer's label and local extravasation treatment protocol are not fully reconciled. | **No draft change.** Full label version and local emergency protocol still needed. |
| SC-11 — severe hyperkalemia | At **K+ 6.8 mmol/L** with ECG changes, UKKA July 2026 Guidelines 14.1–14.2 support urgent 12-lead ECG, continuous cardiac monitoring and prompt clinical action. Previous option “repeat sample and tell doctor only if second high” earned **1 point**, which incorrectly rewarded a dangerous delay. Confirming pseudohyperkalemia can occur **in parallel**, not instead of timely escalation. | **Corrected:** unsafe option now **0 points**; correct branch asks for urgent help, 12-lead and continuous monitoring; consequences and evidence limitation updated. |
| SC-14 — suspected acute transfusion reaction | The correct branch stopped transfusion and called the team but did not explicitly instruct ABC/vital-sign assessment or avoiding line flushing. Australian Red Cross Lifeblood recommends immediate cessation, airway/breathing/circulation check, IV access (do **not** flush the implicated transfusion line), clerical/identity checks, and notification. Mild isolated reactions and severe reactions have differing post-assessment restart paths. | **Corrected first branch** with ABC, preserve IV access without flushing and product/set retention. Scores unchanged. A full reaction-severity branching algorithm remains to be authored and clinically reviewed. |
| SC-15 — CRRT access-pressure/circuit | The decision graph's instructions for machine troubleshooting, return of blood and termination of therapy are **device-specific**. The listed manufacturer/manual and unit protocol remain required sources. KDIGO 2012 principles alone **cannot establish** these technical bedside steps. | **Flagged, not edited** because no exact operator manual and model/version comparison was completed; unsafe to invent troubleshooting details. |
| SC-19 — anaphylaxis | Focused check: stopping a suspected trigger, urgent help, ABCDE, and intramuscular epinephrine per order/protocol aligns conceptually with resuscitation guidance. The scenario currently relies on UK guidance and an FDA label, not local Saudi protocol; observation and biphasic reactions are outside the evidence assessed. | **No change.** Full guideline and local pathway verification required. |

## Primary sources directly checked

- UK Kidney Association, updated July 2026, Guidelines 14.1/14.2: https://guidelines.ukkidney.org/hyperkalaemia/11-1-ii-hyperkalaemia-in-hospital/11-1-2-ii-hyperkalaemia-in-hospital-14-1-14-2/ — reviewed at official HTML recommendation level, supporting urgent ECG at **≥6.0** and continuous monitoring at **≥6.5**, ECG changes, or additional defined circumstances.
- Australian Red Cross Lifeblood, *Management of suspected reactions*: https://www.lifeblood.com.au/health-professionals/clinical-practice/adverse-events/management-of-suspected-reactions — official clinical guidance page directly read, supporting stop, ABC, preserve IV access, **do not flush existing line**, notify; severity-stratified management and restart only where authorized.
- Current norepinephrine-specific label and full manufacturer CRRT protocol **not** retrieved for this batch. Do not infer a completed label/device audit.

## Related medication review triage

Opened medication drafts **MD-01 norepinephrine** and **MD-06 propofol**. Both are `DRAFT` / pharmacist-review false / clinically-reviewed false; each has US manufacturer label source and jurisdiction disclaimers. Their adverse-effect narratives include more than one statement; neither qualifies as a remaining one-statement adverse-effect gap. **They were inspected for scenario linkage, not newly verified against full FDA label editions or Saudi SFDA guidance.** Full medication review is pending.

## Versioned changes

- SC-11 and SC-14 unpublished JSON drafts updated, including source limitations, then `src/content/draft-index.json` and `src/content/draft-history.json` regenerated to reflect new scenario hashes and additional limitation entries. Metadata synchronization commit: `4995cf2`.
- No answer/scoring changes except one dangerous-delay option in SC-11 (**1 → 0**).
- No publication, production deployment, PR merge, professional-review status, pharmacist-review status, payments or clinical sign-off.
- **CI must be verified on the final commit; status of older commits does not establish latest success.**

## Prioritized next batch

1. Complete an independent **label-version and adverse-effect audit** of medication drafts still containing one adverse-effect statement, verifying each against its *actual label ID and edition*. Do not invent or import unsupported adverse effects.
2. Review scenarios SC-02 cardiogenic shock, SC-03 respiratory deterioration, SC-04 ventilator alarm, SC-05 desaturation, SC-06 accidental extubation, comparing actions, consequence scoring and device/clinical sources. Record all unsupported operational instructions and manufacturer-gated pathways.
3. Perform full clinician review and local authorization of all scenario scoring and branch safety before learner release.
