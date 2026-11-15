# Phase 7 report: Practical Nursing Skills Library

Branch `claude/vigilant-mendel-95k63h` (starting commit `114dcbe`). Not merged (PR #2 untouched), not deployed. Clinical review and the AI assistant remain postponed. **All 25 clinical skills are unreviewed drafts held outside the database; none is published, imported or reachable from any learner surface.** ICU Scope, ICU Knowledge Map and every other project were untouched; no paid service was created; the real Turnstile configuration of `icu-nursing-dev` was not read or changed.

## Skills drafted: 25 of 25 (as evidence-mapped drafts), 0 publishable
The scope is the original master list (Part 6 of the master prompt, recovered from the first message of the project transcript); `src/lib/skill-draft-validator.ts` enforces the 25 titles. 20 drafts are partially supported; **5 have no usable source** and contain only referrals to local policy: tracheostomy care, chest drain monitoring, safe patient mobilization, CRRT circuit monitoring, patient transport. No bedside step was invented to fill a gap.

## Actual evidence coverage (details: `phase7/SKILLS_EVIDENCE_REPORT.md`)
| Measure | Result |
|---|---|
| Sections (194) fully / partially supported / local-protocol referral | 8 / 113 / 73 |
| Statements (239) sourced / partial / local-protocol | 43 / 123 / 73 |
| Checklist items (150) sourced / partial / local-protocol | 25 / 87 / 38 (critical-marked items 93) |
| Skills publishable (supported evidence + cleared licence + reviewer + approver) | 0 |

Sources read in full text this phase: CDC/HICPAC 2011 intravascular catheter guideline (peripheral, central, dressing, hand-hygiene recommendations) and the CDC/HICPAC 2009 CAUTI guideline (recommendation sections I-III). Others come from the Phase 2-3 traced topic drafts. **Missing references:** Open RN Nursing Skills/Advanced Skills (CC BY, publisher returns 403 to the research tool; the one permissive source that would unlock tracheostomy, chest drain, peripheral IV, NG and transfusion steps), AARC tracheostomy CPG, INS Standards, BTS pleural guidance, ICS transfer guidance, AHA 2025, BSH transfusion-reaction guideline, ASPEN, AACN alerts, manufacturer instructions.

## Features implemented
* Migration **0012_skills** (6 tables, 9 gated functions, publish guard, freeze triggers, rollback verified on a scratch database, applied to `icu-nursing-dev`): skills, checklist steps with per-step evidence support, revision history, bookmarks, self-study sessions.
* **Competency model**: self-study sessions now; observed assessment, assessor identity/credential and verification columns reserved behind a named CHECK (`skill_sessions_self_study_only`) for a future clinical-review phase. No certificate, approval, qualification, score or "competent" state exists anywhere.
* Interface: `/skills` (search, category browsing, bookmarked filter, progress), skill detail (objectives, prerequisites, 14 section types with evidence badges, checklist, evidence/references/licensing panel, revision history, own history), checklist runner (radio per step, progress, finish summary, discard), learning-hub card and navigation entry, English and Arabic (RTL, marked English fallback).
* Synthetic nonclinical skills `SYN-SKILL-001..004` for development; seed file generated and drift-checked in CI.
* Draft pipeline: 25 JSON drafts, `build_evidence.py` (references, coverage matrices), validator (`npm run validate:skills`), unit tests (10) including negative cases.
* Specifications for the next modules: `phase7/NEXT_MODULES_SPECS.md` (50 medications, 240 to 300+ MCQs, 20 scenarios, equipment and monitoring education).

## Test results
| Suite | Result |
|---|---|
| Lint, typecheck | pass |
| Unit | 291 pass (was 274; +17: skills engine, drafts validator, Arabic checks) |
| Database / RLS (PostgreSQL 16) | 246 pass (was 233; +13 skills tests; function catalogue now 44) |
| Playwright E2E + axe (3 viewports) | 268 pass, 8 skipped (was 238; +27 skills tests and the draft-invisibility test) |
| Build | pass |
| Main CI (run #47, 0b0b76e) | green |
| Isolated Supabase CI (run #16, 0b0b76e) | green: guard tests, live API suite incl. skills over supabase-js/PostgREST, build, live UI suite incl. the new database-mode skills test with CAPTCHA test keys |
| Hosted dev verification (`verify-question-bank.ts`) | all checks pass including 16 new skills checks (real roles, raw rows, drafts, guard, isolation) |

## Verification that draft clinical skills cannot surface
* **Database:** drafts, in-review, approved, partially supported and permission-pending clinical skills are invisible in list, search, detail and bookmarks (DB tests); every publish-guard branch is tested; the same on hosted dev; flipping a development database to production hides all synthetic skills.
* **Browser/API:** e2e loads all 25 draft titles from the files and proves they never appear in `/skills`, in any search, in 404-ing detail routes, in `/library` search, in the sitemap or in the page source; a unit test forbids any file in `src/` from referencing `content/drafts/skills`; the seed generator emits only `demo_synthetic` rows.

## Security and licensing issues
* Skill tables are closed to learners (no read, no write); the observed-assessment path cannot be created by anyone, including the owner role, without dropping a named constraint; hourly session ceiling and open-session cap added; search input is bounded and escaped.
* Licensing: most clinical sources are cite-only or permission-required (AARC, ERC, AHA, SCCM, AACN, NPIAP, INS, ISMP, AABB, manufacturers, GCS aid); the CDC PDFs carry no reuse statement; Open RN is CC BY but unread. A clinical skill cannot reach the gate without `license_status` original or cleared.
* Remaining risks: the evidence classification of each draft statement is my own and unreviewed; some partially read sources (AABB Circular, SCCM statements, KDIGO summary) support only `partial`; hosted dev still has fixtures visible (as since Phase 5), no backups, and `pg_graphql` off.

## Changes to the original roadmap
* Skills (Phase 3 of the master plan) delivered as architecture plus drafts; the platform cannot publish any skill until review and licensing, which are later-phase dependencies, so Phase 3's "25 skills + checklists" is **not complete as published content**.
* Sequence for the remaining Phase 3 items proposed in `NEXT_MODULES_SPECS.md`: close the five source gaps first (Open RN access), then medication architecture with pharmacist workflow, MCQ audit tooling, scenario-engine extensions, equipment content.

## Owner actions
Provide a browser-capable route to Open RN (or approve NCBI Bookshelf copies); decide how to obtain permissions for the RED sources; nominate clinical reviewers (critical care nurses, a pharmacist, an infection-prevention nurse) for the review phase; keep PR #2 unmerged until you decide.
