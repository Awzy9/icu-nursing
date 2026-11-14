# Phase 0 Review Pack — Round 2

Date: 2026-11-14 · **Recommendation: Phase 0 is NOT ready for sign-off.** Substantial progress; the remaining gaps are mainly human verification, reviewer appointment and your decisions. Phase 1 will not begin until you explicitly approve Phase 0.

Branch: `claude/vigilant-mendel-95k63h` in `Awzy9/icu-nursing` (feature branch; `main` untouched). No other repository, Supabase, Vercel, domain or paid service was touched.

## 1. The original 14 acceptance criteria

| # | Criterion | Round 1 | Round 2 | Notes |
|---|---|---|---|---|
| 1 | Product scope defined | ✅ | ✅ | `PRODUCT_REQUIREMENTS.md` |
| 2 | Audience defined | ✅ | ✅ | |
| 3 | 10 domains organised | ✅ | ✅ | 124 topics; 18 proposals pending approval |
| 4 | First 40 topics prioritised | ✅ | ✅ | Now with primary reference, evidence priority, reviewer roles |
| 5 | Every selected resource has a verified source link | ⚠️ | ⚠️ **Improved, still partial** | 6 of 7 blocked links now load in Chromium; **AHA still unverified in a browser**; NCBI Open RN page unreadable; AACN framework page 403; 14 P1 topics lack a pinned primary source |
| 6 | Licensing risks documented | ⚠️ | ⚠️ **Improved, still partial** | Licences read for Open RN (3 books), SCCM, React Flow, H5P. **Not read:** AARC, AHA, AHRQ, CDC, ISMP, NICE, WHO, KDIGO, ASPEN terms; stack licences |
| 7 | Proprietary resources identified | ✅ | ✅ | AACN prices captured as evidence |
| 8 | Content template ready | ✅ | ✅ | |
| 9 | Clinical review process defined | ✅ | ✅ **Expanded** | `CLINICAL_REVIEWER_MATRIX.md` (8 roles, no names) |
| 10 | Database design documented | ✅ | ✅ | |
| 11 | Technical architecture documented | ✅ | ✅ | |
| 12 | UI structure documented | ✅ | ✅ **Completed** | `UI_WIREFRAMES.md` + prototype (Figma not used) |
| 13 | Development backlog organised | ✅ | ✅ | |
| 14 | Release 1 measurable acceptance criteria | ✅ | ✅ | |

Your rule — "do not mark Phase 0 complete if the clinical source register or licensing register is incomplete" — **still applies**, because criteria 5 and 6 are only partly met.

## 2. Completed this round

| Task | Deliverable | Status |
|---|---|---|
| Git: feature branch, commit, push | branch + PR (see §7) | Done (PR not merged) |
| Competitor and market research | `COMPETITOR_ANALYSIS.md`, `MARKET_OPPORTUNITY.md` | Done, with caveats (§4); 7 differentiators |
| Wireframes (7 screens) | `UI_WIREFRAMES.md`, `design/prototype/index.html` | Done; tested at 390 px, no overflow/console errors |
| Source verification | `SOURCE_VERIFICATION_REPORT.md`, rebuilt `source_register.csv` (34 entries) | Partly done (§3) |
| SCCM permission email | `SCCM_PERMISSION_REQUEST.md` | Drafted, **not sent** |
| Reviewer framework | `CLINICAL_REVIEWER_MATRIX.md` | Done; all roles vacant |
| Curriculum review | `CURRICULUM.md` (review section), new CSV columns, `proposed_topics.csv` | Done |
| This report | `PHASE0_REVIEW.md` | Done |

**Key corrections found:** NICE sepsis NG51 is superseded by NG253; MedEd101 is a pharmacy-board prep site, not nursing; ICU Delirium is a research centre, not a commercial LMS; KDIGO 2026 AKI/AKD remains a draft on KDIGO's own page; a prototype flaw (choice labels revealing answers) was found and fixed; the delirium objective no longer references CAM-ICU worksheets.

## 3. Outstanding tasks

1. **Human browser checks** (I cannot pass these challenges): NCBI Open RN collection page; AHA 2025 guideline pages and AHA permissions policy; AACN Competence Framework page.
2. **Read licence/terms** for AARC, AHRQ, CDC, ISMP/ECRI, NICE, WHO, KDIGO, ASPEN.
3. **Pin primary sources** for 14 P1 topics (Surviving Sepsis edition, neurocritical care, transfusion, pressure injury, VAE, early-warning score, etc.).
4. **Read the A-priority guidelines in full** (23 topics) before drafting.
5. Check the **AHA Feb 2026 algorithm change notice** and confirm adult BLS/ALS/post-arrest part numbers.
6. Confirm Open RN Advanced Skills and Management books on their publisher pages.
7. Second competitor pass: Arabic/Gulf providers, "other players", RN/NP Picmonic pricing, hands-on trial of competitors (requires accounts).
8. Appoint named reviewers (§6).
9. Figma version of wireframes (needs your approval).
10. Send (or edit and send) the SCCM email; consider requests to AHA/ISMP if figures/lists are needed.

## 4. Research limitations (read before relying on anything)

- Automated Chromium is not "a normal browser": Cloudflare (AHA) and reCAPTCHA (NCBI) still blocked it. Blocks are recorded as *unverified*, not *unavailable*.
- Several facts come from **search-result summaries** (AHA dates, AARC journal citations, AACN ECCO price, NURSING.com CCRN FAQ price, Picmonic app ratings) and are labelled as such.
- **No guideline or textbook was read in full.** Nothing in the curriculum is clinically verified.
- Competitor pricing is promotional, US-oriented and date-specific; I did not trial any product, so statements on ICU content, simulations and mobile reflect public pages only.
- No market-size numbers were estimated.
- Pricing/feature pages can change; re-check before using them externally.

## 5. Copyright and licensing risks

| Risk | Level | Mitigation |
|---|---|---|
| Copying AACN (framework, ECCO, KAT) | High | Original framework only; AACN does license its framework to platforms — a paid route exists if ever wanted |
| SCCM ICU Liberation in a paid product | High | Permission email drafted; fallback = cite PADIS, own wording |
| AHA algorithms/figures | High | Original diagrams only; permissions policy unread |
| ISMP high-alert list (ECRI copyright) | High | Link to list; describe categories in own words |
| AARC/KDIGO guideline tables | Medium–high | Paraphrase and cite; terms unread |
| KDIGO draft cited as final | High (accuracy) | Version label rule; re-check before AKI/CRRT topics |
| Open RN "except where otherwise noted" | Medium | Image-level licence check; attribution + modification notices |
| WHO non-commercial licences | Medium | Cite only until read |
| CAM-ICU worksheets (Vanderbilt copyright) | Medium | Teach principles; link out; ask permission if embedding |
| H5P GPL components | Medium | Legal review before use |
| Competitor trademark/endorsement implications (AACN, CCRN) | Medium | No implied affiliation |

## 6. Clinical reviewer requirements

Eight roles are specified (`CLINICAL_REVIEWER_MATRIX.md`): senior ICU nurse educator (curriculum lead), bedside ICU nurse, clinical pharmacist, respiratory therapist, critical care physician, nephrology, neurology, infection prevention. **All are vacant; no names invented.** 26 of the 40 P1 topics need multidisciplinary review. Minimum to start Phase 2 realistically: curriculum lead + bedside nurse + pharmacist + intensivist, with RT/nephrology/neurology/IPC engaged for their topics. Reviewer availability is the critical path for launch.

## 7. Git and pull request

See the PR link in the session summary. The PR targets `main`, is **not merged**, and carries the checklist above. `main` was not modified.

## 8. Decisions still required from the product owner

1. **Approve or reject Phase 0** after reading this pack (nothing else proceeds until then).
2. Appoint reviewers / choose the review model and budget.
3. Send the SCCM email? Edit placeholders (name, organisation, countries).
4. Curriculum: add the 3 P1 candidates (chest drain, CVC care, early mobility)? Approve the 2 merges? Approve new Domains 11–12?
5. Figma wireframes: yes/no (and which Figma account/team).
6. Second competitor pass including Arabic/Gulf market: yes/no.
7. Name, domain, budget and approval to create Supabase/Vercel/payment accounts (no spending yet).
8. Payment provider and Saudi payment methods.
9. Primary jurisdiction for scope-of-practice rules.
10. Who performs the human browser checks in §3.1 (you, or grant me another route).
