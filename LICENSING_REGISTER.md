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

| SCCM official pages: SSC 2026 recommendations, PADIS 2018 and 2025 focused update | **RED (cite-only)** | Recommendation pages read 2026-11-14; no reuse licence found; full publications not read | Cite; short attributed paraphrase at recommendation level | Copy text; claim full-text review | None for cite-only use |
| Open RN Nursing Skills Appendix C and Nursing Fundamentals chapters | **GREEN (conditional)** | CC BY 4.0 per publisher/NCBI | Adapt with attribution and change notice | Omit attribution | Keep attribution in published content |
