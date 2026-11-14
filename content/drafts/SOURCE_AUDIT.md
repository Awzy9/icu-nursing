# Source audit of the 29 drafted topics (2026-11-14)

Machine-readable: `SOURCE_AUDIT.csv` (topic × source, with status). Register: `sources/source_register.csv` (column `source_status`). A unit test now fails if a draft cites a source whose status is NOT READ, if a cited ID is missing from the register, or if a cited SUPERSEDED source is not described as superseded in the draft.

Status definitions: **VERIFIED FULL TEXT** (the document's full text was downloaded and read); **PARTIAL OR SUMMARY** (only part, a chapter, a page or an abstract was read); **NOT READ** (inaccessible or not opened; never cited as evidence); **SUPERSEDED** (a newer edition exists; may be cited only with an explicit statement).

## Corrections made after the supervisor's review
| Issue | Finding | Correction |
|---|---|---|
| Sepsis (D06-T01) | The front matter listed S-SSC-2026, whose full text was never read | Now cites **S-SSC-2021 (SUPERSEDED, full text read)** and S-NICE-NG253 (PARTIAL: two chapters); **S-SSC-2026 is listed as NOT READ** under `sources_not_read` |
| Pressure injury (D07-T04) | Listed S-NPIAP-2019 although the draft uses the 2026 4th-edition Quick Reference Guide | Now cites **S-INTL-PI-2026 (PARTIAL: abridged Quick Reference Guide only)**; S-NPIAP-2019 is marked **SUPERSEDED / 2019 edition not read** |
| GCS (D03-T01) | Source ID pointed to Open RN Health Alterations | Now **S-GCS-OFFICIAL (PARTIAL: aid PDF and three web pages)**; Open RN was never read |
| Shock (D02-T08) | Source ID pointed to Open RN Health Alterations | Now **S-ESICM-SHOCK-2014 (VERIFIED FULL TEXT, dated)** and S-SSC-2021 (SUPERSEDED); Open RN and SSC 2026 listed as NOT READ |
| Delirium (D03-T10) | Listed S-SCCM-PADIS although only an abstract page was read | Now cites **S-NICE-CG103 (PARTIAL: recommendations chapter)**; PADIS is **PARTIAL OR SUMMARY (abstract only) and listed under `sources_not_read`**; no PADIS recommendation is quoted |
| Enteral feeding (D07-T06) | Listed S-ASPEN (never read) | Now S-ESICM-EEN-2017 and S-SHEA-VAP-2022; ASPEN NOT READ |
| AKI (D04-T02) | Listed the NICE landing page and the KDIGO 2026 draft | Now S-NICE-NG148 (PARTIAL: recommendations); KDIGO NOT READ |
| CLABSI / VAE / others | Source IDs were the generic CDC index | Now the actual documents (CDC 2011 PDF, SHEA 2022 ×2, AARC) |
| Oxygen, defibrillation, cardiac arrest, ETT, fluid balance | Mixed or generic IDs | Now the specific verified documents (AARC, RCP NEWS2, ERC ×3, NICE CG174/NG148, CDC 2011) |
| Not-read references named only in text | BTS 2017, WHO hand hygiene, CDC isolation 2007 | Registered as **NOT READ** and listed under `sources_not_read` |

## Totals (CSV)
57 relations: 27 CITED + VERIFIED FULL TEXT; 13 CITED + PARTIAL OR SUMMARY; 3 CITED + SUPERSEDED (SSC 2021 in D06-T01, D02-T08, D02-T04, each carrying the superseded statement); the rest are explicitly not used as evidence (12 NOT READ, 1 SUPERSEDED, 1 PARTIAL).
