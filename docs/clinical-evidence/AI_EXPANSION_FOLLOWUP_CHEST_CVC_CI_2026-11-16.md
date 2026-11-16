# Unpublished ICU MCQ expansion: source integrity and safety follow-up

Date: 2026-11-16. Project: `Awzy9/icu-nursing`, development branch `claude/vigilant-mendel-95k63h`. Scope: follow-up to `AI_EXPANSION_MCQS_TRIAGE_2026-11-16.md`. This is **targeted evidence checking** and repository quality correction, NOT professional signoff, comprehensive verification of 66 questions, or learner publication.

## New targeted clinical checks and edits

### XQ-05 — Chest-drain monitoring Q2

- Source: British Thoracic Society **2023** Clinical Statement on Pleural Procedures (HTML, section *Post insertion care* / *Intercostal drain insertion*), https://thorax.bmj.com/content/78/Suppl_3/s43 .
- Situation: **pleural effusion** drain with repetitive coughing and chest pain during fluid drainage. BTS explicitly recommends promptly clamping the effusion drain to prevent re-expansion pulmonary oedema (RPO).
- Old correct option described only reporting and loosely 'following' an instruction on clamping. Revised correct option explicitly calls for **prompt clamping under documented effusion-drain instructions, patient assessment and urgent pleural-team notification**. The explanation distinguishes this situation from a **bubbling chest drain for pneumothorax**, which BTS says should not be routinely clamped except under specialist supervision.
- The answer letter remains **D**. Full pleural drain management depends on the indication, local policy and expert assessment; this is not a universal instruction to clamp every bubbling drain.
- Both the authored Markdown and `content/drafts/mcq-expansion/build_mcqs.py` were modified; generated audit index/history subsequently synchronized.

### XQ-03 — Central-line care Q6 source attribution

- Source: SHEA/IDSA/APIC **2022** CLABSI update, https://pmc.ncbi.nlm.nih.gov/articles/PMC9096710/ , *Remove nonessential catheters*, **moderate-quality evidence**, recommending daily assessment and removal of unnecessary central venous access.
- Q6 already cited both CDC and `S-SHEA-CLABSI-2022` in its trace. However, the set's front-matter `sources` and visible reference list named only CDC, so its audit metadata understated source coverage. Both source ID and actual publication URL are now included in the Markdown and generator; no new clinical claim or answer-key change.
- The title remains based on the older CDC 2011 source, but the Q6 teaching is corroborated by more recent SHEA 2022 guidance. Clinical decisions and practitioner authorization remain local.

### Quality check, XQ-08 Q2 (vasopressor line occlusion)

- CI of earlier intermediate commits reported an `mcq-length` problem caused by the newly improved correct response being much longer than every distractor.
- Reworded that correct action to: **“Assess, summon help and restore the prescribed infusion via patent access per protocol.”** It retains urgent patient assessment, escalation and safe access while avoiding unnecessary verbiage. The explanation still warns against forcing an occluded line and stresses authorized protocol and drug-delivery safety.
- The existing answer letter **A** was retained. Rechecked answer-length distribution directly in current Markdown: XQ-03, XQ-05 and XQ-08 each have **3 of 6** correct options longest, within the repository’s maximum of 3. This is a **manual quality-rule check**, not a complete run of all tests.

## CI diagnosis

Earlier CI runs (example #197 and #203) failed on:
1. `tests/unit/mcq-expansion.test.ts`: `mcq-length` (initially XQ-07, subsequently XQ-08).
2. `tests/unit/admin-drafts.test.ts`: content-index mismatch on **intermediate commits**, where drafts were updated before their corresponding generated metadata. The project builder uses SHA256 of raw Markdown for expansion sets, and SHA256 of JSON serialization for scenarios.
   
The correction workflow updated `src/content/draft-index.json` and `src/content/draft-history.json` after each published-to-branch draft change, including the SHEA source addition and answer-length fix. **Do not claim green CI until the actual latest commit completes CI.** The CI failures are real; test assertions were not weakened.

## Review scope and status

- The preceding expansion triage opened all **11 sets / 66 questions** but deeply corrected only 5 specific questions. This follow-up substantively checked/edited **XQ-05 Q2**, fixed the **XQ-03 Q6** source attribution, and shortened the previously reviewed **XQ-08 Q2** correct option. These are *not* 66 individually source-certified MCQs.
- The past separate topic-question review counted **102/306** targeted item-level checks. A single question is never counted twice merely because it was edited again. The 66 expansion MCQs are included in the broader 306-question inventory but their first-pass triage cannot be equated with completed deep review.
- **No change** to `clinically_reviewed: false`, professional reviewer identities, clinical approved dates, unpublished draft state, production configuration, PR merge, or licensing authorizations.
- Outstanding next priority: full evidence comparison of remaining XQ-01/02/04/06/10 as well as question explanations and distractors in every expansion set; investigate older source versions and current regional protocols; CI and later controlled publication gating.
