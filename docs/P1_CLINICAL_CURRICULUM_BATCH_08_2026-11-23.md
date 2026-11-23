# P1 Clinical Curriculum — Batch 08: Delirium, Sedation and Nutrition Evidence Version (2026-11-23)

**Branch:** `p1/clinical-content-batch-01-20261123` — **draft-only**, **AI-assisted**, **not clinically reviewed**, not merged or deployed. No new medication doses, infusion rates, antipsychotic selection algorithms, sedation targets or delirium scale items are taught.

## Clinical review and changes

| Artifact | Finding | Change |
|---|---|---|
| `SC-17-delirium-and-agitation.json` | A new restless, less responsive ICU patient was immediately treated as possible delirium without explicitly prioritizing threats to airway, breathing, pain or other acute neurological/physiological causes. The correct drug feedback could make haloperidol look like an expected next step after de-escalation. | Patient-first assessment for acute deterioration, appropriate trained screening as arousal allows, and explicit distinction between SCCM's **2025 absence of recommendation for or against antipsychotics** and individualized physician/pharmacist decisions. Improved non-drug management, hypoactive delirium and family participation. |
| `SK-23-sedation-assessment.json` | Sedation arousal scores were not clearly distinguished from a validated delirium screen; incomplete screening could be mistaken for a negative result. | Adds a warning that sedation scales do not diagnose delirium; documents inability to screen when the tool cannot be used; adds escalation of a new response change rather than automatic sedative escalation, and a critical checklist guard. |
| `D03-T10-delirium.md` | NICE and PADIS principles present but lacked a bedside distinction between physiological danger, tool eligibility and antipsychotic evidence. | New `7b` original safety synthesis: assess danger first, no false negative screen, check local tool competency, and explicitly state SCCM 2025 medication uncertainty; no copyrighted CAM-ICU/ICDSC items. |
| `D07-T06-enteral-feeding.md` | Evidence-gap text incorrectly implied that ESPEN nutrition guidelines were not accessible at all, and could be confused by a 2026 Spanish-language bibliographic entry. | Corrects the **source-status statement only**: an ESPEN English practical/partially revised guideline exists (2023), while the 2026 Spanish publication describes a practical/shortened edition based on earlier guidance. Neither full text nor dose/target recommendations has been checked for this draft, so the clinical advice does **not** receive a false 2026 review stamp. |
| `tests/unit/p1-delirium-sedation-nutrition-batch-08.test.ts` | Needed regression protection for source-version attribution, safe nursing escalation and hallucinated delirium-screen negativity. | Five focused tests plus existing draft validators. |
| Draft index/history | GitHub CI requires content-index hashes, source licence markers and history consistent with every edit. | All four modified drafts registered and hashed; no false clinical review. |

## Source evidence and rights

- **Society of Critical Care Medicine**: [2025 PADIS focused update](https://sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline) (official recommendation webpage verified 2026-11-23; the full evidence tables and validated scale manuals have **not** been reviewed). SCCM issued **no recommendation for or against antipsychotics over usual care** for adult ICU delirium; a conditional recommendation for enhanced mobilization/rehabilitation does not prescribe one mandatory nursing mobility schedule. Existing `S-SCCM-PADIS` source carries **RED/unverified commercial reuse**.
- **NICE CG103** (2023 update): UK general hospital/long-term-care guidance, with specific critical-care screening references, is not an interchangeable ICU drug protocol; site rights are not cleared for commercial reuse.
- **ESPEN**: [2023 English practical ICU nutrition guideline](https://pubmed.ncbi.nlm.nih.gov/37517372/), *Clinical Nutrition* 42:1671–1689, doi:10.1016/j.clnu.2023.07.011. [September 2026 Spanish-language publication](https://pubmed.ncbi.nlm.nih.gov/42549877/), *Nutrición Hospitalaria* 43:1127–1151, doi:10.20960/nh.06943. **Bibliographic version check only** — nothing translated, reproduced or implemented from their clinical tables.

## Remaining before publication

1. Clinician/nurse educator, ICU pharmacist, delirium/neurocritical specialist, physiotherapy and nutrition/dietetics review as applicable, including every correct/incorrect simulation branch and learning consequences.
2. Verify local tool training/licence (CAM-ICU, ICDSC, RASS etc), sedation and restraint protocols, and that a delirium or arousal tool is not presented as a standalone diagnosis.
3. Review the complete relevant ESPEN recommendations with a dietitian and clear publisher rights before claiming a nutrition content update.
4. Verify **the final GitHub CI, isolated Supabase and learning-experience runs** on the last commit, even though previous batches had green runs.
5. Resolve the existing concern about unreviewed content in the learner-facing working edition, rather than treating draft labels or green tests as a release gate.

**No production merge, deployment, or clinical sign-off requested or performed.**
