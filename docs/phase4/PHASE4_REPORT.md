# Phase 4 report: interactive question bank

Branch `claude/vigilant-mendel-95k63h`. Not merged, not deployed. **All 40 clinical drafts and 240 clinical MCQs remain AI-generated DRAFT, not clinically reviewed, not imported, not published.** Clinical review and the AI assistant remain postponed. ICU Scope and ICU Knowledge Map were not touched. The hosted `icu-nursing-dev` project was not touched (no migration applied, Turnstile settings untouched, no new project created).

## 1. What was built
**Routes** (en and ar, RTL): `/question-bank` (dashboard), `/question-bank/attempt/[id]` (practice and exam runner), `/question-bank/attempt/[id]/results` (score and review). A "Question bank" link was added to the header and the dashboard.

**Practice mode**: one question per screen, four options, submit before feedback, explanation of the correct answer *and of why each other option is wrong*, locked answers, previous/next, navigator, completion summary and score, topic filter, bookmark and flag.
**Exam mode**: question count (3-40), optional time limit (10-60 min), no feedback until submission, change/clear answers, flag for review, navigator showing answered/flagged/current, confirmation listing unanswered and flagged counts, server-anchored countdown with auto-submit, score, then full review with explanations and filters (all / incorrect / flagged / not answered).
**Dashboard**: stats, resume list (with discard), start form, progress by topic, previous attempts table, empty/loading/error states.
**Accessibility**: native radio groups in a fieldset whose legend is the stem, focus moves to the question heading on navigation, live-region announcements (answer saved, correct/incorrect, time warnings), `role=timer`, `alertdialog` confirmation, navigator buttons with full state in their accessible name, status never by colour alone (icon + text), 44 px targets, logical CSS properties for RTL. Arabic chrome is complete; English-only content shows a labelled English fallback with `lang`/`dir` set.

## 2. Database (`supabase/migrations/0006_question_bank.sql`)
New tables: `question_items`, `question_options`, `question_answer_keys`, `question_explanations`, `quiz_attempts`, `quiz_attempt_items`, `quiz_answers`, `learner_question_stats`, `question_stats`, `question_bookmarks`; new setting `app_settings.question_fixtures_visible` (default false); RPCs `qb_progress`, `qb_start_attempt`, `qb_get_attempt`, `qb_submit_answer`, `qb_set_flag`, `qb_set_position`, `qb_submit_attempt`, `qb_discard_attempt`, `qb_list_attempts`, `qb_set_bookmark`. Full model in `docs/QUESTION_BANK.md`. Key properties: keys/explanations not selectable by learners; learners have no write grants; `is_correct` NULL until revealed; deterministic server-side scoring; seeded shuffle that never moves the key; owner-only attempt access; 5-unfinished-attempt cap; server-clock expiry; frozen published content; guard trigger on every write.

## 3. Content gate (Task 3)
* Learner visibility requires published + approved + (synthetic: labelled `SYNTHETIC FIXTURE` **and** the dev setting on) or (clinical: named approver + independent clinical reviewer + published topic).
* The existing clinical publication workflow is unchanged (`publish_topic` etc. untouched); **no function sets question review fields**, so clinical questions cannot become visible in this phase.
* Dedicated development fixture mode: `QUESTION_BANK_MODE=fixtures` (default in demo mode) - 16 labelled nonclinical questions; refused when `NEXT_PUBLIC_APP_ENV=production`. DB fixtures via `npm run seed:question-fixtures`.
* Tests that draft clinical questions cannot surface: DB (clinical draft invisible via RPCs, tables, bookmarks; guard rejects every incomplete publication path; positive control; unpublishing the topic hides again; unlabelled synthetic rejected; setting off hides all fixtures), unit (source tree never connects `content/drafts` to question tables; mode resolution refuses fixtures in production; learner code never selects keys), E2E (no question API routes exist; no clinical vocabulary in the served HTML; no explanation/rationale text in any response before submission). There is **no question search** feature; the existing topic search reads only `public_topics`.

## 4. Task 5: MCQ audit (still 240 DRAFT items)
| Metric | Before | After |
|---|---|---|
| Correct option is the unique longest | 84 (35.0 %) | **46 (19.2 %)** |
| Correct option is the unique shortest | not measured | 54 (22.5 %) |
| Answer positions A/B/C/D | 59/63/60/58 | 59/63/60/58 (each 24-26 %) |
| Identical options within a question | not measured | 0 |
| Near-duplicate questions (stem + options) | not measured | 0 |
| Questions with at least one automated flag | 124 | 94 |
| Distractors with absolute wording | 67 | 69 |
75 option rewrites (mostly lengthening short distractors with plausible-but-wrong detail; one key trimmed) across 26 drafts; no clinical claim in a key was changed. All 40 drafts pass `npm run validate:drafts`. A regression test (`tests/unit/drafts.test.ts`) locks in: 240 questions in 40 drafts, all `status: DRAFT`, unique-longest <= 25 %, unique-shortest <= 30 %, positions 20-30 %, no duplicate options. The audit script now also reports shortest-key bias, duplicate options and near-duplicate questions. Remaining automated flags are mostly heuristic (no patient context in "understanding" items, short stems). Distractor absolutes rose by two because new filler text reuses existing phrases; this is open work. Source metadata was not re-verified in this phase (unchanged since Phase 3).

## 5. Test results (this commit)
| Check | Result |
|---|---|
| `npm run lint` (`--max-warnings 0`) | pass |
| `npm run typecheck` | pass |
| Unit (`npm test`) | **246 passed** in 15 files (new: shuffle, scoring, fixtures, fixture engine, mode resolution, source-tree gate, bank-wide MCQ guard) |
| Database/RLS (`npm run test:db`, real PostgreSQL 16, all 6 migrations) | **200 passed** in 9 files (new: 29 question-bank tests; API-surface allowlist extended) |
| Audit fuzz/matrix/views with seed 3 | 76 passed |
| E2E + accessibility (Playwright, desktop/tablet/mobile, demo build) | **168 passed, 3 skipped** (171 including the 14 new question-bank specs x 3 viewports; the 3 skips are viewport-specific tests, among them the keyboard-only test on mobile) |
| Axe (WCAG 2.1 A/AA, serious+critical) | 0 violations on dashboard, practice question + feedback, exam question, results, Arabic runner, dark mode en/ar |
| `npm run validate:drafts` | 40 of 40 pass |
| Build | pass (demo build; `NEXT_PUBLIC_SUPABASE_*` empty) |
Live CAPTCHA suites were **not run**: see `docs/ISOLATED_LIVE_TESTING.md` (no Docker daemon in this sandbox; second hosted project needs approval). The real Turnstile secret was not touched.

## 6. Screenshots (`docs/phase4/screenshots/`, desktop 1280 and mobile 390)
`*-1-dashboard`, `*-2-practice-question`, `*-3-practice-feedback`, `*-4-exam-question` (timer, flag, navigator), `*-5-exam-confirm`, `*-6-results-review`, `*-7-arabic-rtl-question`.

**Walkthrough.** Dashboard -> pick Practice/Exam, topics, count (and exam time) -> Start -> answer; practice shows feedback after "Submit answer", exam saves each choice silently -> navigator/flags -> "Finish"/"Submit exam" opens a confirmation (unanswered and flagged counts) -> results page with score, per-topic scores and a filterable review with explanations -> back to the dashboard where the attempt appears in history; unfinished attempts appear under "Continue where you left off".

## 7. Internal quality gate for the quiz engine
| Criterion | Evidence | Met |
|---|---|---|
| No answer key/explanation before submission (client data and API) | DB + unit + E2E response-body scan | yes |
| Own-attempt privacy, no learner writes, deterministic scoring | DB tests (RLS, forged score/answer denied, parity tests) | yes |
| Clinical drafts cannot surface | DB + unit + E2E gate tests | yes |
| Practice, exam, resume, expiry work end to end | E2E on 3 viewports | yes |
| Accessibility (keyboard, SR names, contrast, RTL) | axe + keyboard + RTL E2E | yes, automated only |
| Lint, types, build clean | see section 5 | yes |
| Verified against the hosted Supabase project | not done (migration not applied, needs your go-ahead) | **no** |
| Manual screen-reader and native-Arabic review | not done | **no** |
The engine passes the *internal* gate on everything that can be verified locally. The two open rows are owner-dependent. Per your instruction, case-based and study modes are **planned only** (`docs/PHASE5_CASE_BASED_AND_STUDY_PLAN.md`); nothing was started.

## 8. Known limitations
* The learner-facing bank has **no real content**: 16 synthetic fixtures only; with fixtures off (production) the dashboard shows "No questions are published yet".
* Fixture mode keeps attempts in server memory: lost on restart, shared by one process only. It exists for development and tests.
* `supabase-service.ts` (the RPC wrapper) is verified through the zod schemas against real function output and the SQL tests, not against a live PostgREST/GoTrue stack.
* Pages that call `notFound()` inside a streamed route return HTTP 200 with the not-found UI (Next.js streaming behaviour); content is still withheld (tested).
* Rate limiting is the repository's best-effort per-instance limiter; the database caps unfinished attempts.
* A question withdrawn during an attempt is hidden from unanswered items and voided from the score; answered items remain visible so the learner can finish.
* Arabic UI strings are a draft pending native-speaker review; only 2 of 16 fixtures have Arabic text.
* Automated accessibility checks only; no manual assistive-technology pass.
* No staff authoring/review UI for questions yet (writes are migrations/seed scripts), by design until clinical review is un-postponed.
* Remaining MCQ audit flags (94) and 69 absolute-wording distractors need a human pass during clinical review.

## 9. Owner actions
1. Review this branch; say whether to **apply `0006_question_bank.sql` to `icu-nursing-dev`** (`npm run live:migrate`) and, if so, whether to load the fixtures (`npm run seed:question-fixtures -- --visible`) there for a hosted check.
2. Decide on the isolated CAPTCHA test environment (Docker-capable machine/CI for the local stack, or approval for a second hosted project).
3. Confirm acceptance of the quiz-engine gate so the case-based/study plan can start.
4. Arrange native Arabic and manual screen-reader review when convenient.
5. No merge, deployment, import, publication, payment or agreement was made or is required for this phase.
