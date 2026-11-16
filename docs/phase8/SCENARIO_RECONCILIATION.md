# Phase 8, Step 4: scenario list reconciliation and simulation engine extension

## The authoritative list stays the original master list (20 scenarios)
`docs/phase7/NEXT_MODULES_SPECS.md` proposed a different scenario list. It is **not** adopted. The target remains the original master project's Part 8 list; the specification list is treated as proposals to be merged only where it fills a gap.

| # | Master scenario (authoritative) | Matching item in the specification list | Decision |
|---|---|---|---|
| 1 | Septic shock | Septic shock | kept |
| 2 | Cardiogenic shock | none | kept (missing from the specification) |
| 3 | Acute respiratory deterioration | Hypoxaemic respiratory failure | kept; specification wording is narrower |
| 4 | Ventilator alarm | Ventilator alarm | kept |
| 5 | Sudden oxygen desaturation | none | kept |
| 6 | Accidental extubation | Unplanned extubation | kept (same event) |
| 7 | Raised intracranial pressure | Raised ICP | kept |
| 8 | Acute seizure | none | kept |
| 9 | Postoperative bleeding | Bleeding anticoagulated patient | kept; specification adds anticoagulation as a variant to consider |
| 10 | Hypoglycaemia | none (DKA is a different event) | kept |
| 11 | Severe hyperkalaemia | Hyperkalaemia | kept |
| 12 | Acute arrhythmia | none | kept |
| 13 | Cardiac arrest | Cardiac arrest | kept |
| 14 | Transfusion reaction | Transfusion reaction | kept |
| 15 | CRRT circuit complication | CRRT access problem | kept |
| 16 | Acute hypotension | none | kept |
| 17 | Delirium and agitation | Delirium and agitation | kept |
| 18 | Aspiration event | none | kept |
| 19 | Anaphylaxis | none | kept |
| 20 | Acute neurological deterioration | none | kept |

**Specification items with no master counterpart (not scheduled; candidates only if the owner chooses to replace or extend):** post-arrest care, diabetic ketoacidosis, line infection, pump programming error, pressure injury, pain and sedation mismatch, SBAR escalation, family communication, safe transfer. Several are better served by other modules: pump programming error, pressure injury, SBAR escalation and safe transfer already have skills or topics; post-arrest care is covered by the cardiac-arrest topic. **No scenario was removed, added or reordered in the plan.** Any change needs the owner's decision.

## What was built on the existing engine (migration 0014, no new engine)
* **Changing observations.** Each decision step may carry up to eight named readings (`key`, localized label, number or text value, unit, optional `low`/`high` band). The learner sees the readings of the *current* step, with the change since the previous decision ("up from", "down from", "unchanged") and the position against the authored band, in words. Because the case is a branching graph, the readings of a step are authored per path state, so the patient visibly changes as decisions play out. Readings of later steps are never sent early (database-tested).
* **Decision consequences.** Each option can carry a consequence, stored in the scoring-key table that learners cannot read; it is revealed only for committed decisions (for every option of that step, with the chosen one labelled "What happened after your choice").
* **Structured debrief.** A case can carry authored learning points and links (skill, topic, medication). After completion, `cs_get` adds the debrief with the learning points, links, a computed count of the learner's decisions by scope-of-practice label, and the decisions scoring below the reference. It never exists for an in-progress attempt.
* **Security.** The content gate, publish guard and freeze triggers are unchanged except that the debrief is frozen with a published case; the same learner-closed tables; the new columns are validated by constraints; `cs_get` remains the only reader; migration 0014 is applied to `icu-nursing-dev` and has a manual rollback.
* **Fixtures.** The three existing synthetic, nonclinical cases (a ferry office, a library reading room and a loan desk) were extended with fictional readings, consequences and debriefs, including links to the synthetic skills. **No clinical scenario was written or published.**
* **Interface.** An observations table (keyboard-focusable region, words rather than colour), consequences in the feedback, and a debrief panel; English and Arabic (right-to-left verified, English fallback marked for unauthored text).
* **Not built (deliberately):** timed scenarios, a visual authoring tool and the 17 remaining master scenarios; none can exist as published content without clinical authors and review.
