# Phase 8 report: evidence recovery, medication library, MCQ expansion, simulation extension

Branch `claude/vigilant-mendel-95k63h`. Not merged (PR #2 untouched), not deployed. Clinical review, reviewer recruitment and the AI assistant were not started. No licensing enquiry was sent, no money spent and no external project created. **No clinical content was imported or published.** No access control was bypassed (see Step 1).

## Step 1: evidence recovery for the five unsupported skills
| Skill | Before | After | Source(s) now read |
|---|---|---|---|
| SK-05 Tracheostomy care | unsupported | **still unsupported** | NCBI Bookshelf NBK596713 returned a browser-verification (reCAPTCHA) page; Open RN and NSW ACI pages returned HTTP 403. No workaround was attempted. Only ICS rec 60 (spares for transfer) is usable |
| SK-13 Chest drain monitoring | unsupported | partial | BTS Clinical Statement on pleural procedures 2023 (practice points, full text; licence line "No commercial re-use"). NBK594490 blocked as above |
| SK-16 Safe mobilization | unsupported | partial | Hodgson 2014 consensus (CC BY 4.0; criteria figures are images and unread) |
| SK-17 CRRT circuit monitoring | unsupported | partial | Alberta Health Services CRRT alarm pathway 2025 (PrisMax-specific); Baxter's Prismaflex manual URL now redirects to the Vantive site and no manufacturer manual was obtained |
| SK-20 Patient transport | unsupported | partial (best recovered) | ICS Guidance on the Transfer of the Critically Ill Adult, 5th ed. (22 April 2026; recommendations 1-88 and the Appendix 7 checklist, full text; copyright Intensive Care Society) |

No skill was forced to `supported`; 24 of 25 are partial and 1 unsupported. Gaps, licences and new source rows are in `docs/phase7/SKILLS_EVIDENCE_REPORT.md` and `content/drafts/skills/NEW_SOURCES.csv`. Skill coverage now: 228 sections (8 full / 139 partial / 81 local-protocol referral), 288 statements (61 sourced / 146 partial / 81 local), 167 checklist items.

## Step 2: medication library (architecture complete; 20 of 50 drafted)
* **Built:** migration 0013 (`medication_items`, monitoring/safety items, revisions, bookmarks; `md_list/md_get/md_progress/md_set_bookmark`), strict publication gate, a **no-dosing guard** in the database and in the draft files (numbers with units, rate expressions and the words titrate, dilute, compatible, y-site, loading/maintenance/bolus dose, infusion rate are rejected for every writer), categories (10), search, high-alert filter, bookmarks, detail pages with separate general / administration / institution-specific preparation / institution-specific dosing sections (the last two are always referrals), nursing monitoring and safety checklist, regulator label and jurisdiction panel, evidence panel and revision history, English and Arabic with RTL, synthetic fictional fixtures (4 agents).
* **Pharmacist workflow:** designed in `docs/MEDICATION_ARCHITECTURE.md`; **not active and not required** (reserved nullable columns never set; a test asserts none is set).
* **Drafts:** `MD-01..MD-20` from current FDA labels (openFDA label API; set id, version, date and manufacturer recorded; boxed warning, indications, warnings, adverse reactions fields only; no dosing fields). 131 sourced / 29 partial / 74 local-protocol statements, 100 monitoring items (69 critical). All are partial evidence, **US labels only**; EMA, MHRA and SFDA labels, practice guidelines and nursing sources were not read for these entries. `high_alert` is true only where a source read names the drug. The insulin, potassium chloride and heparin labels are product- or presentation-specific and are noted as such. Batches 3-5 (30) are planned in `content/drafts/medications/PLAN.csv`: the plan covers all 22 master-list items, antibiotics as eight proposed agents, and 21 proposed additions (marked as not in the master list).

## Step 3: MCQ expansion
66 new original MCQs in 11 unpublished sets (`content/drafts/mcq-expansion`), bringing the draft bank to **306**. Every question has four options, one key, plausible distractors with a reason each, an explanation and a Trace line to a registered source; the existing draft validator rules and audit were reused and extended. 0 validator issues, positions 75/79/77/75 over the whole bank, no near-duplicates. 38 of the 66 new questions carry advisory audit flags (mostly key-longest or a stem without a clinical cue), left for the review phase. Details: `docs/phase8/MCQ_EXPANSION_REPORT.md`.

## Step 4: simulation extension
Built on the existing case engine (migration 0014): per-step **observations** with change since the last decision and position against an authored band (in words), per-option **consequences** revealed only for committed decisions, and a **structured debrief** (learning points, links, scope-of-practice counts, decisions to revisit) revealed only after completion. Synthetic nonclinical fixtures only. The original master list of **20 scenarios is preserved**; the specification's alternative list was reconciled, not adopted (`docs/phase8/SCENARIO_RECONCILIATION.md`). No clinical scenario was written.

## Step 5: verification
| Check | Result |
|---|---|
| Lint, typecheck | pass |
| Unit (Vitest) | 323 pass (was 291): medication engine/guard/drafts, MCQ expansion, case observations |
| Database / RLS | 268 pass (was 246): medication library, case observations and debrief; function catalogue now 48 |
| Playwright E2E + axe | 295 pass, 8 skipped (was 268): medication reference, debrief, observations |
| Build | pass |
| Main CI (run #54, `aa7fbbc`) | green |
| Isolated Supabase CI (run #23, `aa7fbbc`) | green: guard tests, live API suite including skills and medications over supabase-js/PostgREST, build, live UI suite with CAPTCHA test keys |
| Hosted dev (`icu-nursing-dev`) | migrations 0013 and 0014 applied; live verification passes (medications, no-dosing guard, debrief secrecy); the dev Turnstile configuration was not touched |
| Draft validators | skills 25, medications 20, MCQ expansion 66, topic drafts 40: 0 issues |

## Remaining issues and risks
* Tracheostomy care still has no source; the Open RN chapters need a person with a browser.
* Medication entries rest on one US label each; indications and warnings differ elsewhere; no guideline or nursing source was read for them.
* MCQ advisory flags and uncalibrated difficulty; no clinical or language review of any draft.
* The new medication no-dosing guard is deliberately strict (it also blocks laboratory thresholds with units); revisit only with a pharmacist workflow in place.
* Hosted dev still shows synthetic fixtures to signed-in test users by design, and has no backups.

## Owner decisions
Whether to extend the medication drafts through batches 3-5; whether to replace or extend any master scenario with items from the specification list; how to obtain the Open RN and AARC material; when to start the review phase (not started).
