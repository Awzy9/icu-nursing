# AI-assisted clinical evidence review — Topics 01–10 (initial source comparison)

**Date:** 2026-11-16
**Repository:** Awzy9/icu-nursing · branch `claude/vigilant-mendel-95k63h`
**Scope:** First ten topic drafts in deterministic path order (6 from batch-01, 4 from batch-02). Clinical references checked using accessible public sources on 2026-11-16.
**Review category:** **AI-assisted evidence screening and targeted claim verification, NOT comprehensive line-by-line clinical review.**
**Approval / publication:** **NO CHANGE.** This document does not assign `clinically_reviewed`, `approved`, `reviewed_on`, or `published` values, nor use any database approval endpoint.

**Evidence labels used:** **confirmed issue** = a concrete source/version discrepancy; **targeted match** = specific representative statement matches an accessible source, *not* an endorsement of the entire file; **not fully evaluated** = remaining assertions, all distractors, citations, and scope/legal aspects still require line-by-line checks. Source text is not reproduced.

## Register — ten files examined

| ID | Draft | Initial finding | Follow-up |
| --- | --- | --- | --- |
| D06-T01 | `content/drafts/batch-01/D06-T01-sepsis.md` | **Targeted match.** The official SCCM/SSC **2026** recommendation page supports using NEWS/NEWS2/MEWS/SIRS rather than qSOFA alone, urgent cultures ideally before antimicrobials, and differentiated antibiotic timing; the draft correctly labels its 2021 source superseded. | Verify each sepsis recommendation, time window, grade and MCQ against full 2026 guideline; keep 2021 historical only, document UK-specific NICE exceptions. |
| D06-T04 | `content/drafts/batch-01/D06-T04-precautions.md` | **Targeted match.** The CDC's current transmission-based precautions overview supports additional contact/droplet/airborne measures *on top of* standard precautions. | Audit organism-specific isolation examples, donning/doffing and local IPC policy against the underlying CDC isolation guideline before instructional use. |
| D06-T05 | `content/drafts/batch-01/D06-T05-clabsi.md` | **Targeted match.** SHEA/IDSA/APIC 2022 lists hand hygiene, hub disinfection, chlorhexidine-containing dressings, appropriate dressing care and prompt removal of unneeded lines among essential prevention practices; 2017 CDC dressing update supersedes **only** the relevant 2011 dressing statements. | Verify the draft's exact 2011-versus-2022 comparison, CHG exclusions and maintenance intervals claim-by-claim. |
| D07-T04 | `content/drafts/batch-01/D07-T04-pressure-injury.md` | **Follow-up issue.** Fourth-edition **2026** NPIAP/EPUAP/PPPIA guidance and QRG exist. EPUAP says **all full chapters** are now available for free (announcement dated Oct 5, 2026); the draft had relied solely on an abridged guide. This is **not proof a guideline statement is wrong**. | Retrieve/review applicable *full chapters* and reconcile repositioning, devices, proning, conditional preventive dressings, evidence grades and copyright terms; do not upgrade read-status before actually reading them. |
| D09-T01 | `content/drafts/batch-01/D09-T01-sbar.md` | **Targeted match.** AHRQ TeamSTEPPS supports Situation, Background, Assessment, and Recommendation/Request, including read-back of responses. The fictional example is properly described as an example, not an endorsed escalation interval. | Verify each MCQ, distinguish SBAR emergency escalation from complete shift handoff, and keep response-time requirements local-policy-dependent. |
| D09-T02 | `content/drafts/batch-01/D09-T02-documentation.md` | **Targeted educational principle, not yet source-complete.** The content's factual, timely, traceable documentation pattern accords with accessible RCN 2026 material, but its listed Open RN page was only partly read. | Confirm applicable local nursing regulator requirements, test corrections/late entries/eMAR/electronic traceability, and don't universalize UK legal rules. |
| D01-T03 | `content/drafts/batch-02/D01-T03-oxygen-therapy.md` | **Targeted match with scope caveat.** AARC 2022 supports oxygen saturation ranges of 94–98% for most hospitalized adults, and 88–92% for COPD. These **are not universal** targets, especially in patients at risk of hypercapnic respiratory failure or sepsis-specific contexts. The draft differentiates targets and refers to individual orders. | Reconcile all population-specific claims and MCQ rationales with primary guidelines, note jurisdictions and special critical-illness situations; no blanket bedside protocol. |
| D01-T07 | `content/drafts/batch-02/D01-T07-ventilator-parameters.md` | **Targeted match.** AARC 2024 recommends assessment of plateau pressure, delivered VT per predicted body weight, PEEP/auto-PEEP; driving pressure and FiO2 checks have conditional recommendations. The draft's AARC summary matches these distinctions. | Recheck ESICM 2023 ARDS-specific claims, evidence strength, mode applicability, and nursing-versus-RT/prescriber roles. |
| D01-T11 | `content/drafts/batch-02/D01-T11-airway-suctioning.md` | **Targeted match with known ambiguity.** AARC 2022 guidance supports indicated suctioning, preoxygenation, generally avoiding routine saline, sterile open suction, brief episodes and shallow-before-deep; adult as-needed frequency lacks the same study support as pediatric/neonatal recommendations. The draft notes uncertainty on catheter-size wording. | Reconcile catheter occupancy recommendations and evidence grading using the full guideline before teaching exact figures; verify all MCQs. |
| D02-T08 | `content/drafts/batch-02/D02-T08-shock-recognition.md` | **CONFIRMED HIGH-PRIORITY VERSION GAP.** The draft is framed around the **2014 ESICM shock consensus** and says no newer open-access shock consensus was found. **ESICM published updated shock/hemodynamic monitoring guidelines in 2025** (Monnet et al, doi:10.1007/s00134-025-08137-z; 50 statements). The draft needs a source/version update and line-by-line reconciliation, not silent approval. | Compare the 2025 primary guideline's 50 statements to the current draft. Key areas: serial tissue perfusion/capillary refill, dynamic over static fluid-responsiveness markers, invasive monitoring for nonresponders, echocardiography as first-line shock-type assessment. Reconcile 2014 guidance and septic-shock-specific SSC 2026 text separately; review every shock MCQ. |

## Highest-priority edits to prepare — NOT applied to clinical drafts yet

1. **D02-T08 (HIGH):** Update `guideline_versions` / `sources` and references to include ESICM 2025 *after reading the full 2025 publication*. Remove or amend the no-newer-guidance assertion; it is disproved by the 2025 publication. Replace reliance on the dated 2014 consensus for assertions now covered by updated guidance, preserving accurately delimited historic context.
2. **D07-T04 (MODERATE):** The 2026 international pressure injury full chapters are now reported available, so examine relevant chapters and revise the draft's evidence coverage and explicit limitations accordingly; **do not claim the full chapters were read yet**.
3. **Other 8 topics (PENDING):** Conduct a paragraph-by-paragraph comparison and check each MCQ and distractor against its corresponding cited source. A targeted source match in this document does **not** mean all assertions or references were verified.

## Public sources directly inspected for targeted verification

- SSC / SCCM, adult sepsis recommendations 2026: https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026
- CDC transmission-based precautions (2024): https://www.cdc.gov/infection-control/hcp/basics/transmission-based-precautions.html
- SHEA/IDSA/APIC CLABSI 2022 open-access article: https://pmc.ncbi.nlm.nih.gov/articles/PMC9096710/
- CDC chlorhexidine dressing update: https://www.cdc.gov/infection-control/hcp/c-i-dressings/index.html
- EPUAP announcement of full 2026 International Pressure Injury Guideline chapters (2026-10-05): https://epuap.org/the-international-guideline-is-out-2/
- AHRQ TeamSTEPPS SBAR: https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/sbar.html
- RCN 2026 publication on clear, accurate nursing documentation: https://www.rcn.org.uk/-/media/Royal-College-Of-Nursing/Documents/Publications/2026/March/011-049.pdf (available search excerpt only; PDF **not** read in full in this screening)
- AARC oxygen 2022, PubMed abstract: https://pubmed.ncbi.nlm.nih.gov/34728574/
- AARC patient-ventilator assessment 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/
- AARC artificial airway suctioning 2022, full HTML: https://doi.org/10.4187/respcare.09548
- ESICM 2025 shock guideline bibliographic record and abstract: https://pubmed.ncbi.nlm.nih.gov/41236566/
- ESICM 2025 guideline official announcement: https://www.esicm.org/esicm-guideline-circulatory-shock-haemodynamic-monitoring/

## Review integrity

- **10/40 topic drafts reviewed at source-comparison / triage level.** **0/40 have been fully, sentence-by-sentence evidence-verified by this review.**
- **1 confirmed dated-source/version issue (D02-T08); 1 source-depth follow-up (D07-T04); 8 targeted matches requiring full review.**
- Original clinical content untouched, no `reviewed_on`/approval metadata changed, no publication path altered.
- Not a substitute for review and sign-off by a qualified, accountable clinical professional.
