# Critical care nursing P1 — Batch 13 (23 November 2026)

**Location:** draft PR #113 / `p1/clinical-content-batch-01-20261123`
**State:** proposal-only, unpublished, AI-authored, no independent clinical approval, no merger to main.

## Changes
- New `content/proposals/p1-13/ACLF_ENCEPHALOPATHY_MULTIORGAN_ESCALATION.md`: version-specific 30 October 2026 ACLF terminology, acute encephalopathy vs presumed HE, sequential neurological/respiratory/renal/circulatory/infection/bleeding surveillance, distinction between ALF urgent referral and ACLF considered referral. Three unvalidated branching case stages and reviewer-only questions.
- New `content/proposals/p1-13/TRAUMA_SHOCK_TRANSFUSION_NEUROTRAUMA.md`: possible severe TBI exception to general haemorrhage permissive-hypotension ideas; ionised calcium and temperature trend monitoring, transfusion identity and adverse-reaction escalation, source-control coordination and handover. Three unvalidated case stages and reviewer-only questions.
- Added cross-reference and source-version correction to existing `content/proposals/p1-11/ACUTE_LIVER_FAILURE_NURSING.md` and `content/proposals/p1-11/TRAUMA_HAEMORRHAGE_NURSING.md`.
- `tests/unit/p1-expansion-batch-13.test.ts` checks draft metadata, publication exclusion, source notes, prohibition of unsupervised medication/BP/fluids, and consistency with parent drafts.

## Verified sources and key bounds
1. **2026 global ACLF multisociety consensus**, online 30 October 2026, direct selected primary-source sections read: https://doi.org/10.1007/s12072-026-11169-2 . A companion Hepatology publication was identified by abstract: https://doi.org/10.1097/HEP.0000000000001891 . Source presents neurological nomenclature and careful consideration of alternative causes of altered mental state; do not treat source as a standalone nursing medication protocol.
2. **AASLD–AST adult liver transplant evaluation (2026)**, clinical referral recommendations read directly: https://pmc.ncbi.nlm.nih.gov/articles/PMC13070310/ . ALF cases are recommended for *urgent* referral; ACLF should be *considered* for referral. Do not equate statements, turn them into a nurse-independent referral decision, or claim transplant candidacy.
3. **AASLD ALF explanatory article**, primary society source: https://www.aasld.org/liver-fellow-network/core-series/back-basics/defining-and-managing-acute-liver-failure .
4. **European management of major bleeding/coagulopathy after trauma, sixth edition (2023)**, full text accessible and targeted recommendation/rationale for severe TBI as a haemodynamic exception, hypothermia and ionised-calcium monitoring verified: https://pmc.ncbi.nlm.nih.gov/articles/PMC9977110/ . These lessons intentionally reproduce no thresholds, therapy doses, device procedures, product ratios or copied figures/tables.
5. **2025 German in-hospital polytrauma coagulopathy update**, abstract-only context, not used for treatment details: https://doi.org/10.1007/s00068-025-02919-2 .

**Copyright:** Citation is not a reuse licence; full commercial and local-adaptation clearance pending for all third-party material. Drafts are originally written educational concepts and explicitly avoid reproducing guideline algorithms, forms, figures and doses.

## QA and known blockers
- Tests must be run via CI for final commit. New content remains outside `content/drafts`, so existing generated 40-topic working catalog, `src/content/draft-index.json` and `src/content/draft-history.json` are intentionally unchanged.
- Existing `CONTENT_EDITION=working` can expose the original draft material; this is an unresolved **learner-facing release-eligibility blocker** separate from exclusion of proposals. These new files intentionally do not resolve or amplify it.
- Require qualified ICU nursing, hepatology/transplant, neurocritical, trauma, pharmacy, transfusion and renal reviewers as appropriate; cross-check jurisdiction-specific protocols.
- **No merge, deployment, removal of disclaimers, or claim of clinical review.**
