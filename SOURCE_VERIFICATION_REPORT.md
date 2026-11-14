# Source Verification Report

Verification date: **2026-11-14** · Data: [`sources/source_register.csv`](sources/source_register.csv) (34 entries, built by `sources/build_source_register.py`).

## Method and its limits

- A real browser (headless Chromium, desktop user-agent) was used instead of curl. It is automated, so it is **not** the same as a person using a normal browser; some sites still challenged it.
- Where a page was readable, I read its text. Where it was not, I used web-search result snippets and say so.
- **No clinical guideline or textbook was read in full.** "Full text reviewed" is "No" for every guideline in the register. What I did read: landing/index pages, licence blocks, tables of contents, and short page fragments.
- A block (403/406/challenge) is recorded as "not verified", never as "page missing".

## The seven previously blocked links

| Link | Result in Chromium | Status |
|---|---|---|
| AARC guideline index | 200, full index read | **Verified** (index only) |
| AHA 2025 guidelines (cpr.heart.org; professional.heart.org) | Cloudflare "Just a moment" challenge, not passed | **Still unverified in a browser**; facts below come from search snippets |
| AHRQ TeamSTEPPS index | 200 (one re-fetch returned an error page) | **Verified** |
| AHRQ SBAR tool page | 200, "Page last reviewed November 2019" | **Verified** |
| CDC infection control + Core Practices | 200 | **Verified** |
| KDIGO guideline index and AKI page | 200 | **Verified**; AKI/AKD 2026 update is still a **draft** |
| React Flow / xyflow GitHub | 200; `LICENSE` fetched = **MIT** | **Verified** |

## Required independent checks

| Check | Finding | Confidence |
|---|---|---|
| Open RN book list | NCBI Bookshelf page remained blocked (reCAPTCHA). Publisher pages loaded: Nursing Fundamentals 2e, Nursing Skills 2e (published 2023-08-28), Health Alterations, Nursing Pharmacology 2e (Aug 2023). NCBI collection listing (via search): Advanced Skills 2023, Management & Professional Concepts 2e 2024, Fundamentals 2e 2024. | Medium — NCBI page not read directly |
| Open RN CC BY 4.0 | Read on publisher pages: Nursing Skills 2e "Creative Commons Attribution 4.0 International License, except where otherwise noted"; Health Alterations "CC BY 4.0 unless otherwise indicated"; Fundamentals page label "Creative Commons Attribution". Collection-wide statement via search. **Caveat: "except where otherwise noted"** — images/third-party items need item-level checks. | Good for 3 books; Advanced Skills and Management books not loaded |
| AACN resource descriptions/restrictions | Online-courses page (loaded) describes ECCO, Knowledge Assessment Tool, Competence Framework & Toolkit, Nurse Orientation Pathway. Toolkit page: from $275 (1 year, up to 5 orientees). KAT page: $58/orientee (1–10), ECCO+KAT bundle $404. Framework page itself returned 403 even in Chromium; description via search (2022 Initial Competency, 41 pages, free download after sign-in, AACN licenses it to platforms). **All proprietary/paid → RED.** | Good on commercial status; framework text not read |
| SCCM commercial-use permission | Page text read: free for hospital staff training and most scientific presentations (with acknowledgement); "For medical education programs with associated registration fees or for use in commercial settings, requests for use of SCCM materials should be made in advance by contacting iculiberation@sccm.org." Some content needs third-party permission. | High |
| AHA publication date | Online 2025-10-22; *Circulation* 152 suppl 2; Part 1 DOI 10.1161/CIR.0000000000001372; AHA change notice updated 2026-02-06 lists algorithm corrections. From search snippets, not a browser read. | Medium |
| AARC publication dates | Read on index: Patient-Ventilator Assessment (2024), SBT for Liberation From Adult MV (2024), Artificial Airway Suctioning (2022), Oxygen in Acute Care – adult (2022), Tracheostomy – adult (2021). Journal citations (Respir Care 2024;69(8):1042–1054 and 69(7):891–901) from search. | High for years |
| ISMP | High-Alert Medications in Acute Care Settings list, "ISMP; 2024", site now ECRI, "Copyright © 2026 ECRI". List PDF not opened. | Medium |
| ASPEN | Home page loaded. No adult critical-care nutrition guideline pinned yet; paid self-assessment programme exists. | Low — selection still needed |
| NICE | **Correction:** NG51 is replaced by **NG253** (adults 16+; published 2025-11-19, last updated 2026-09-23), NG254 (<16), NG255 (pregnancy). Register updated. AKI guideline still not pinned. | High |
| WHO | Patient-safety hub loaded: Global Patient Safety Action Plan 2021–2030 (2021-08-03), Global patient safety report 2024 (2024-05-30). Licence not read; many WHO publications are CC BY-NC-SA, which would block commercial reuse. | Low on licence |

## Additional findings

- **KDIGO 2026 AKI/AKD** is still described on KDIGO's own page as a draft being prepared for publication. Final publication not found. Never cite as final.
- **H5P**: site content CC BY 4.0; code MIT "wherever possible" but parts of the PHP library are **GPL** — legal review needed before integration.
- **CAM-ICU**: icudelirium.org says CAM-ICU is free to use; manuals carry Vanderbilt/Ely copyright per search. Do not redistribute worksheets without permission. The objective for the delirium topic was rewritten accordingly.
- **AARC blood-gas guideline** is from 2013 (expert panel) — dated.

## Still unverified (needs a human or a different route)

1. NCBI Open RN page content and Advanced Skills / Management book pages.
2. AHA pages (Cloudflare) — including AHA reuse/permissions policy.
3. AACN Competence Framework page (403).
4. Licence/reuse terms for AARC, AHRQ, CDC, ISMP, NICE, WHO, KDIGO, ASPEN — **not read** (no terms page was found/opened).
5. Specific documents for several P1 topics (see `curriculum/master_curriculum.csv`, column `primary_reference`, 14 topics still "TO SELECT/REGISTER").
6. Licences of the software stack (Next.js, Supabase, Tailwind, shadcn/ui, Lucide, Expo).

## Verdict

Source register is materially better but **not complete**. Six entries are verified to licence/permission level by reading the publisher's own page (Open RN Fundamentals, Skills and Health Alterations; SCCM permission text; React Flow `LICENSE`; H5P licensing page). KDIGO's draft status and NICE NG253's dates are also verified, but their licences are not. No guideline has been verified by full-text review. Do not treat Phase 0 criteria 5 and 6 as fully satisfied.
