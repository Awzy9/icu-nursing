# P1 clinical curriculum — Batch 12 (23 November 2026)

**Repository:** Awzy9/icu-nursing | **PR:** #113 | **Branch:** `p1/clinical-content-batch-01-20261123`
**Release:** PROPOSAL-ONLY; no clinical validation, merge, publication or deployment.

## Implemented
- Added `content/proposals/p1-12/VARICEAL_BLEEDING_NURSING.md`: distinct upper GI variceal haemorrhage teaching; airway/aspiration and haemorrhagic shock escalation, ordered vasoactive/antimicrobial support, transfusion safety, recurrent bleed monitoring and transfer for advanced care. Contains a three-phase fictional unscored case and three reviewer questions.
- Added `content/proposals/p1-12/LOWER_GI_BLEEDING_NURSING.md`: unstable haematochezia with **possible upper GI source**, patient-first nursing response, updated stability-led imaging/endoscopy distinction, safe bowel-preparation safeguards, transfusion and anticoagulant handover. Contains three-phase fictional unscored case and three reviewer questions.
- Cross-referenced these specialist modules in `content/proposals/p1-11/GI_HAEMORRHAGE_NURSING.md` to avoid accidentally presenting the older versions as current.
- Added `tests/unit/p1-expansion-batch-12.test.ts` to enforce status, evidence caveats, up-to-date naming and exclusion from `buildWorkingContent()`.

## Important 2026 guideline chronology verified
1. **Baveno VIII** was released online **August 19, 2026** (journal issue November 2026; DOI 10.1016/j.jhep.2026.07.030), newer than **Baveno VII 2022**. The Baveno Cooperation's **2026 organisational abstract** was read. Publisher search-indexed excerpts supplied specific acute variceal bleeding statements; **full guideline was not readable directly** (403). Do not mark those sections as fully read or clinically approved. https://www.bavenocoop.net/ressources-and-events/publication/35
2. **ASGE 2026 lower GI bleeding** published online **August 28, 2026** (DOI 10.1016/j.gie.2026.06.046; PubMed PMID 42667281). Primary PubMed abstract inspected and a dated October 2, 2026 reporting of ASGE's guideline explains stability / bowel-preparation-driven colonoscopy vs CT ± angiography in persistent instability. **Full official treatment table not read.** https://pubmed.ncbi.nlm.nih.gov/42667281/ and https://news.gastro.org/issues/2026/october-2026/asge-ties-lower-gi-bleeding-workup-to-stability-not-timing/
3. **ACG 2023** LGIB and **ESGE 2021** LGIB are background crosschecks; their specific endoscopy/CTA scopes remain tied to each society and date. https://pubmed.ncbi.nlm.nih.gov/36735555/ and https://www.esge.com/diagnosis-and-management-of-acute-lower-gastrointestinal-bleeding-esge-guideline
4. A **2026 ASGE esophageal/gastric varices** guideline was identified (publisher indexed), but its full details need expert review before teaching it as a specific protocol. https://www.giejournal.org/article/S0016-5107%2826%2906936-1/fulltext

## Safety and rights boundaries
- Nursing actions: assess and **escalate**, support medications/transfusion/endoscopy **as prescribed**, and monitor patient response. No dose, blood-product ratio, calculated transfusion trigger, fixed endoscopy deadline, manual tamponade/device instructions, procedural technique, or inappropriate use of ulcer guidance as variceal treatment.
- Commercial source rights **unverified**; all guideline material is **RED/cite-only**, in original independent wording, without copied figures/tables/algorithms.
- Both new files live under `content/proposals` outside `content/drafts`; original 40/20 inventory and generated draft index/history intentionally unchanged.
- Human clinical reviewers required: hepatology/GI, nursing educators, intensivist, pharmacist, blood bank and interventional radiology as relevant. Exact local protocols and final 2026 source statements must be checked.
- Exclusion tests only check this new content; they do **not** resolve previously identified concerns that some older unreviewed working-draft content may be accessible when `CONTENT_EDITION=working` is enabled. That is a separate product release blocker.

## Next priorities
- Clinician evaluation, full authoritative guideline verification and source licensing, locally relevant adaptation.
- Explicit release eligibility enforcement for any existing learner-facing working catalog, without unexpectedly disabling users' current access.
- CI green on final commit, no false human approval claims.
