# Licensing Register

Classification (as defined in the project brief):

- **GREEN** — clearly open licence permitting commercial reuse when conditions are followed.
- **YELLOW** — free to access; commercial reuse/adaptation needs review or permission.
- **RED** — proprietary, paid, copyrighted or unclear. Research and citation only unless permission is obtained.

**Rule:** until a source's licence has been verified against the publisher's own page, it is treated one level more restrictive than claimed. Free access ≠ permission to redistribute.

Last checked: 2026-11-14. Machine-readable detail: `sources/source_register.csv`.

| Source | Class | Basis | What may be done | What must NOT be done | Action |
|---|---|---|---|---|---|
| Open RN (6 books) | **GREEN (conditional)** | Round 2: CC BY 4.0 read on publisher pages for Skills 2e and Health Alterations, CC Attribution label on Fundamentals 2e; NCBI page still unreadable; "except where otherwise noted" requires image-level checks | After verification: adapt with attribution + modification notice | Reuse third-party images/figures without checking their own licence; imply endorsement | Verify licence text on each book's NCBI page; log image-level exceptions |
| OpenStax nursing | YELLOW | Licence is per book | Per book | Bulk reuse before checking | Check each book |
| AACN (framework, ECCO, KAT, Synergy) | **RED** | Proprietary; some paid/member-only | Read public descriptions; cite | Scrape, copy, adapt ECCO, KAT or the framework text | Build original competency framework |
| SCCM ICU Liberation | **RED for commercial use** | SCCM page: free for hospital staff training; other use needs advance request (iculiberation@sccm.org) | Cite underlying peer-reviewed evidence; write original text | Copy tools, illustrations, training content into the paid product | Send permission request (needs your approval) |
| AARC CPGs | **RED** | Journal/AARC copyright (open-access status unverified) | Cite, paraphrase, original diagrams | Copy tables/figures/text | Check each CPG's reuse terms |
| AHA 2025 CPR/ECC | **RED** | AHA copyright | Cite, original diagrams | Reproduce algorithms/figures/training graphics | Review AHA permissions policy |
| **European Resuscitation Council (ERC) Guidelines 2025** | **RED for commercial use** | ERC Download Centre (read 2026-11-14), verbatim: "All assets can be downloaded and used for educational purposes free of costs. Commercial use needs an agreement with the ERC." Journal articles are © Elsevier/ERC (licence text not read) | Paraphrase and cite; original wording only | **Reproduce ERC figures, algorithms, tables or substantial text without permission; use in any paid or commercial feature without an agreement** | **Obtain a written agreement with the ERC before commercial release.** Draft D02-T15 paraphrases only |
| Royal College of Physicians NEWS2 report (2017) | GREEN/YELLOW | Report text: "there is no copyright restriction" but the RCP must be acknowledged on anything reproduced; charts must be reproduced in colour and not modified or amended | Cite, paraphrase, acknowledge RCP | Modify or redraw the official charts; reproduce the scoring table altered | Use the official chart downloads from rcp.ac.uk; acknowledge RCP |
| CDC/HICPAC 2011 intravascular catheter guideline | YELLOW | US government publication; reuse terms not captured | Cite, paraphrase | Reproduce tables | Verify per use |
| Glasgow Coma Scale assessment aid | **RED** | "(c) Sir Graham Teasdale 2015" on the aid; website has a Permissions page (not read) | Cite, describe the three components in original words | Reproduce the chart or its wording | Request permission if the chart is to appear |
| Resuscitation Council UK 2025 guidelines pages | **RED** | RCUK copyright; the site offers an "Application for permission to reproduce RCUK materials" | Cite and paraphrase; pages hold summaries and algorithm PDFs | Copy algorithms or text | Apply for permission if reuse is needed |
| AARC CPGs (Respir Care, © Daedalus Enterprises) | **RED** | Full-text PDFs read (suctioning 2022, oxygen 2022, patient-ventilator assessment 2024) carry a Daedalus Enterprises copyright | Cite, paraphrase | Copy text, tables or the AARC guideline tables | Ask permission only for specific tables |
| ESICM guidelines (ARDS 2023, shock 2014, enteral nutrition 2017) | **YELLOW – non-commercial licence** | CC BY-NC 4.0 (open access) | Cite and paraphrase | Reuse text or figures in a commercial product | Treat as cite-only for a paid platform |
| SHEA/IDSA/APIC 2022 updates (CLABSI, VAP) | GREEN | CC BY 4.0 (open access) | Reuse with attribution and change notice | – | Keep attribution |
| NICE guidance (NG253, NG148, CG103) | **YELLOW/RED** | NICE Notice of Rights; terms restrict commercial gain | Cite and paraphrase | Reproduce text commercially | Seek NICE permission for any reuse |
| SSC 2021 (PMC copy) | **RED (cite-only)** | PMC Open Access Subset note limits reuse to the COVID-19 declaration period | Cite | Reuse text | – |
| International Pressure Ulcer/Injury Guideline 4th ed. (NPIAP/EPUAP/PPPIA 2026 Quick Reference Guide) | **RED** | © 2026 NPIAP/EPUAP/PPPIA | Cite and paraphrase | Copy recommendations verbatim | Request permission if needed |
| AHRQ TeamSTEPPS 3.0 | YELLOW | US federal material, third-party items possible; automated fetch blocked | Original exercises based on principles; attribute | Reuse downloadables before per-item check | Verify per download |
| CDC | YELLOW | US federal; images may carry third-party rights | Cite; paraphrase | Reuse images/training slides unchecked | Verify per page; record dates |
| KDIGO | **RED** | KDIGO copyright (unverified); 2026 AKI/AKD update is a **draft** per search results | Cite/paraphrase final published versions | Present draft as final; copy tables | Re-check at build time |
| ASPEN | **RED** | Proprietary; paid resources | Cite public guidance | Use paid education | — |
| ISMP | **RED** | Proprietary | Cite; ask permission to reproduce high-alert lists | Copy lists/figures | Permission request |
| NICE | YELLOW | Notice of Rights not read. Sepsis: NG51 superseded by **NG253** (adults, published 2025-11-19) | Cite; reuse after reading notice | Imply NICE endorsement | Verify |
| WHO | YELLOW/RED | Many WHO publications are CC BY-NC-SA (non-commercial) — **unverified** | Cite only | Commercial reuse of NC material | Verify per publication |
| H5P (software) | GREEN/YELLOW | Licensing page read: site content CC BY 4.0; code MIT "wherever possible" but parts of the PHP library are **GPL** — legal check before integration | Use if licence fits | Assume content licences follow software licence | Read licence page |
| React Flow | GREEN | `LICENSE` read = MIT |
| Next.js, Supabase, Tailwind, shadcn/ui, Lucide, Expo | Unverified | Licences not read; confirm at install | Use | — | Record exact licence per package in `THIRD_PARTY_LICENSES` at Phase 1 |

## Permission requests (draft, not sent)

1. **SCCM** — iculiberation@sccm.org: ask whether independently authored educational material referencing the ABCDEF bundle, and linking to SCCM resources, is acceptable in a paid platform; ask about use of any SCCM tools.
2. **AHA / ISMP / KDIGO / AARC** — ask only if needed for specific tables or figures; default is original diagrams.

## Provenance rule for every content item

Each topic/question/scenario stores: source IDs, a note of *what was independently written*, author, reviewer, licence class of each source, and the date sources were last checked (`content_versions` + `topic_references`).

## Additions from Batches 5 and 6 (checked 2026-11-14)
| Source | Class | Licence evidence | Allowed | Not allowed | Action |
|---|---|---|---|---|---|
| SCCM official pages: SSC 2026 recommendations, PADIS 2018 and 2025 focused update | **RED (cite-only)** | Recommendation pages read; no reuse licence found; full publications not read | Cite; short attributed paraphrase at recommendation level | Copy text; claim full-text review | None for cite-only use |
| Open RN Nursing Skills Appendix C and Nursing Fundamentals chapters | **GREEN (conditional)** | CC BY 4.0 per publisher/NCBI | Adapt with attribution and change notice | Omit attribution | Keep attribution in published content |
| ISMP List of High-Alert Medications in Acute Care Settings (2024) | **RED** | PDF footer, verbatim: "Permission is granted to healthcare provider organizations to reproduce and distribute portions of the material contained herein, for internal non-commercial purposes, but only with proper attribution made to ISMP. All other use of the material is prohibited without prior written permission from ISMP." | Cite; describe the concept; name a few categories | Reproduce the list or its tables in the platform; any commercial or public redistribution | Written ISMP permission before any use beyond citation (owner decision; not requested) |
| FDA Infusion Pump Risk Reduction Strategies for Clinicians (page dated 2018) | **YELLOW** | Page licence statement not read; US government web content (verify) | Cite and paraphrase | Present as current device-specific guidance for non-US settings | Verify FDA reuse terms at build time |
| AABB et al. Circular of Information (June 2024) | **RED** | Public review PDF hosted by AABB is watermarked "DO NOT COPY" on every page; the document is also sold in print; no reuse licence found | Cite and paraphrase facts and structure in original wording | Reproduce text, tables or the PDF; teach from the PDF as if licensed | Written AABB permission needed before any reproduction (owner decision; not requested) |
| FDA guidance page: Acceptable Circular of Information (Sept 2024) | **YELLOW** | Page read; licence statement not read | Cite | – | Verify |
| CPOT review, Front Pain Res 2024 (doi 10.3389/fpain.2024.1481085) | **GREEN** | CC BY 4.0 (PMC) | Reuse with attribution and change notice | Treat as the original tool instructions | Original CPOT terms of use still unchecked |
| CPOT (Gelinas), BPS (Payen), RASS (Sessler), SAS (Riker) original instruments | **UNRESOLVED** | Original publications not accessible; instrument terms of use not read | Describe only structure given by an open secondary source; do not teach level descriptors or scoring charts | Copy scoring charts or descriptors | Owner to decide whether to request permission or license a training resource |

| UK Kidney Association hyperkalaemia guideline website (July 2026) | **RED (unconfirmed)** | No licence statement found in the 60 pages read; some figures reproduced with permission from other journals | Cite; paraphrase; omit dose tables | Reproduce text, tables or figures | Verify UKKA reuse terms before any wider use |
| AARC Spontaneous Breathing Trials CPG 2024 (Respir Care; PMC11285503) | **RED (cite-only)** | (c) Daedalus Enterprises; PMC licence statement not read | Cite and paraphrase | Reproduce | Same approach as other AARC guidelines |
| AARC Blood Gas Analysis and Hemoximetry CPG 2013 | **RED** | Downloaded copy carries a publisher watermark: "For personal use only" | Cite and paraphrase | Reproduce | Paraphrase only |
| KDIGO AKI guideline 2012 | **RED (unconfirmed)** | Copyright statement not located in the text read | Cite and paraphrase recommendation statements | Reproduce recommendations, tables or figures | Verify KDIGO reuse terms |
| Open RN Nursing Advanced Skills (ch. 3, 7), Nursing Pharmacology (ch. 4, 8, 10), Nursing Fundamentals (ch. 15) | **GREEN (conditional)** | CC BY 4.0 per book licence ("except where otherwise noted"); some images CC BY-NC-SA or other licences; Pharmacology text reproduces US drug labelling | Adapt text with attribution and change notice | Reuse images without checking each credit; reproduce drug label doses | Keep attribution; check every image |
| JICS education: mechanical ventilation (Wattley and Camporota, 2026; PMC13427949) | **RED (unconfirmed)** | (c) The Intensive Care Society 2026; PMC copyright notice; no Creative Commons text found | Cite; paraphrase | Reproduce text or figures | Verify PMC licence |
| HAMILTON-C1 Operator's Manual 2.2.x (2020) | **RED** | "(c) 2020 Hamilton Medical AG. All rights reserved ... No part of this publication may be reproduced ... without the prior written permission of Hamilton Medical" | Cite; paraphrase general behaviours labelled device-specific | Reproduce alarm tables, screenshots or figures; generalise to other ventilators | Written permission needed for any reproduction (not requested) |
| Brain Trauma Foundation Severe TBI Guidelines 4th ed (2016) | **RED (unconfirmed)** | No copyright statement located in the text read | Cite and paraphrase recommendation statements with level and population | Reproduce tables; apply to non-TBI | Verify BTF reuse terms |
| UHS Sussex NHS Pathology User Guide page | **YELLOW** | Licence not read | Cite as one laboratory's local information | Present local ranges as universal | Verify |
| ARUP Consult pages (DIC; anticoagulant effects) | **RED** | (c) ARUP Laboratories. All Rights Reserved. | Cite; paraphrase | Reproduce tables or scoring systems | Permission needed for reproduction |

## Additions from Phase 3 (checked 2026-11-15)
| Source | Class | Licence evidence | Allowed | Not allowed | Action |
|---|---|---|---|---|---|
| US FDA-approved drug labels via openFDA (ten drugs; one manufacturer label each) | **YELLOW** | FDA-published labelling; manufacturer copyright and openFDA terms not read | Cite; paraphrase safety statements | Reproduce label text or dosing; present US labelling as universal | Verify openFDA and manufacturer terms before any wider use |
| JAMA Netw Open 2026 peripheral vasopressor meta-analysis (PMC12993702) | **GREEN** | "Open access article distributed under the terms of the CC-BY License" | Reuse with attribution | – | Keep attribution |
| Crit Care Explor 2026 (PMC13506231) and Cardiovasc Diagn Ther 2025 (PMC12432607) | **YELLOW** | CC BY-NC-ND 4.0 | Cite and paraphrase for non-commercial use | Commercial reuse; derivatives | Check before any commercial release |
| J Patient Saf 2026 potassium safeguards (PMC13492640) | **GREEN** | CC BY 4.0 | Reuse with attribution | – | Keep attribution |
| J Multidiscip Healthc 2026 peri-extubation summary (PMC13715538) | **YELLOW** | CC BY-NC | Non-commercial reuse with attribution | Commercial reuse | Check before commercial release |
| NICE CG32 and NG24 | **YELLOW** | NICE copyright; Notice of rights not read | Cite | Reproduce text | Verify NICE terms (same approach as other NICE content) |
| NHS Improvement Patient Safety Alert NHS/PSA/RE/2016/006 | **YELLOW** | Licence not read | Cite | – | Verify (NHS England publications are often under the Open Government Licence; not confirmed here) |
| Draeger Evita Infinity V500 Instructions for Use | **RED** | Manufacturer copyright; third-party-hosted copy | Cite; paraphrase general behaviours labelled device-specific | Reproduce alarm tables, screenshots, figures | Written permission needed for reproduction |
| AACN Practice Alerts (public summaries only) | **RED** | AACN copyright; full text login-only | Cite the public summary | Access or copy login-only text; reproduce | Membership/permission needed for full text |
| NMC Code and Standards of proficiency for registered nurses | **YELLOW** | NMC copyright; terms not read | Cite and paraphrase | Reproduce | Verify |
| NCSBN/ANA National Guidelines for Nursing Delegation (2019) | **YELLOW** | NCSBN copyright; terms not read | Cite and paraphrase | Reproduce | Verify |
| Canberra Health Services ICU procedures (arterial line; CRRT) | **UNVERIFIED** | HTTP 403; not read | – | – | Obtain permission or an accessible copy |

## Additions from Phase 8.1 (checked 2026-11-15; no licensing enquiry made)
| Source | Class | Licence evidence | Allowed | Not allowed | Action |
|---|---|---|---|---|---|
| NHS Greater Glasgow and Clyde adult tracheostomy guideline (N-NHSGGC-TRACH-2022) | **YELLOW** | Distributed through the National Tracheostomy Safety Project (permission acknowledged on the document); licence text not otherwise read; review date has passed | Cite; paraphrase as a regional, dated, local guideline | Reproduce; present as national or current | Re-check for a current edition before any publication |
| US FDA labels via openFDA, medication batches 2-5 (40 further drugs; one manufacturer label each, recorded in `content/drafts/medications/LABEL_SOURCES.csv` with set id, version, date and manufacturer) | **YELLOW** | Same position as the Phase 3 entry; a product label is not a bedside nursing practice guideline | Cite; paraphrase safety statements | Reproduce label text; apply US labels to other jurisdictions | Verify openFDA and manufacturer terms; add UK/Canadian/other labels if jurisdictions are extended |
| AHS CRRT alarm pathway (N-AHS-CRRT-ALARM-2025), used in scenario SC-15 and XQ-07 | **YELLOW** | Licence not stated on the page read; machine-family specific | Cite; paraphrase | Reproduce; generalise to other machines | Verify |
| Scenario drafts SC-01..SC-20 | n/a (original wording) | Authors' own fictional specifications; each cites only registered sources | Internal development | Import or publish before clinical review | Keep out of the database |
| Open RN tracheostomy chapter, NCBI Bookshelf, ACI and eCampusOntario copies | **UNVERIFIED** | Blocked or not found; verification challenges were not bypassed | - | - | Try again later or obtain an accessible edition |

## Additions from Phase 9 (checked 2026-11-15; no licensing enquiry made)
| Source | Class | Licence evidence | Allowed | Not allowed | Action |
|---|---|---|---|---|---|
| UK Kidney Association acute hyperkalaemia guideline, full PDF, July 2026 (N-UKKA-HK-2026-07) | **YELLOW** | No copyright or reuse statement in the text read; some figures are reproduced from other publishers with permission | Cite; paraphrase recommendations without doses, rates or preparations | Reproduce text, tables or figures | Verify UKKA terms; review date October 2026 |
| JBDS 01 Hospital Management of Hypoglycaemia in Adults with Diabetes, 4th edition, January 2020 (N-JBDS-HYPO-2020), copy hosted by an NHS trust | **YELLOW** | Copyright statement not found in the text read; a newer edition exists but its PDF returned HTTP 403 and was not read | Cite; paraphrase without amounts or routes | Reproduce the algorithm or tables | Verify JBDS/ABCD terms; look for the current edition |
| RCP National Early Warning Score 2 report (2017), re-read for scenarios SC-01 and SC-03 | **YELLOW** | Same position as the Phase 3 entry | Cite; paraphrase the tiers and recommendations without reproducing the chart | Reproduce the chart or scoring table | Verify RCP terms |
| Scenario and equipment drafts (SC-01..SC-20, EQ-01..EQ-08) | n/a (original wording) | Authors' own specifications; each cites only registered sources; equipment graphics in the app are original generic schematics | Internal development | Import or publish before clinical review; copy manufacturer screens, alarm tables or manuals | Keep drafts out of the database |
| National Tracheostomy Safety Project adult emergency algorithms (tracheostomy.org.uk) and secondary copies | **UNVERIFIED** | Official PDFs not fetched; only search summaries and secondary copies were seen | - | - | Read the official algorithms and licence before use |
| Resuscitation Council UK anaphylaxis guideline, May 2021 (N-RCUK-ANAPH-2021), used in SC-19 | **RED** | The PDF states: "No part of this publication may be reproduced without the written permission of Resuscitation Council UK" | Cite; paraphrase key recommendations without doses; do not reproduce the algorithm figure | Reproduce text or figures | Permission needed for any reproduction; none requested |

## Additions from Phase 10 (checked 2026-11-15; no licensing enquiry made)
| Source | Class | Licence evidence | Allowed | Not allowed | Action |
|---|---|---|---|---|---|
| NICE CG103 Delirium: prevention, diagnosis and management (updated January 2023), used in SC-17 | **YELLOW** | NICE copyright; Notice of rights not read | Cite; paraphrase recommendations without reproducing assessment-tool items or medicine amounts | Reproduce text; reproduce CAM-ICU or ICDSC | Verify NICE terms; CAM-ICU and ICDSC licence and training terms not read |
| NICE NG232 Head injury: assessment and early management (May 2023), used in SC-20 | **YELLOW** | NICE copyright; Notice of rights not read | Cite; paraphrase without numerical triggers | Reproduce text; apply to non-head-injury causes | Verify NICE terms |
