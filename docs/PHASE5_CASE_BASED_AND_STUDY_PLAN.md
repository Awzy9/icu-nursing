# Plan: non-AI case-based learning and study/revision modes (NOT STARTED)

Status: **plan only.** No code, schema or content for these features exists. They start only after the owner accepts the quiz engine's internal quality gate (see `docs/phase4/PHASE4_REPORT.md`). Everything here is deterministic and non-AI; the AI assistant stays postponed. Clinical review stays postponed: until it happens, only synthetic nonclinical fixtures can be served, exactly as for the question bank.

## 1. Principles carried over from the question bank
1. **Same content gate.** Case and study items get `kind`, `status`, approval/review fields and a `*_is_visible()` function with the same rules (synthetic fixtures need the dev setting; clinical needs independent clinical review + a published parent topic). A guard trigger enforces it on every write; published content is frozen.
2. **Secrets stay server-side.** Branch outcomes, "best" choices and rationales are returned only after the learner commits a decision, mirroring answer secrecy.
3. **All writes through definer RPCs**, own-row RLS, no learner INSERT/UPDATE/DELETE, deterministic scoring.
4. **Service interface + fixtures engine** so the UI is testable without a database; fixtures refused in production.
5. **i18n en/ar, RTL, WCAG 2.1 AA, keyboard and screen-reader support**, loading/empty/error states, mobile first.

## 2. Feature A: case-based learning ("Cases")
**Learner experience.** A short scenario unfolds in 4-8 steps. Each step shows new information (history, observations, a chart or trend, an SBAR from a colleague) and asks one decision (single best action, or "select all that apply" up to 4 options). After committing, the learner sees what happened, the rationale per option, and the scope label (independent / needs order / escalate). A final summary lists decisions, a deterministic score and the linked topic pages for revision.

**Data model (migration `0007_cases.sql`).**
| Table | Notes |
|---|---|
| `case_items` | code, kind, status, origin, domain, topic, difficulty, title, vignette (jsonb en/ar), source_note, approval/review fields, version |
| `case_steps` | case, position, `information` jsonb, `prompt` jsonb, `mode` (`single`, `multi`), unique (case, position) |
| `case_step_options` | step, label text, `next_position` (branching), `points` smallint (0-2) - **not readable by learners** |
| `case_step_feedback` | option, explanation, scope label, source pointer - **not readable by learners** |
| `case_attempts`, `case_attempt_steps` | own-row state; chosen option ids; points revealed only after commit |
RPCs: `cs_list`, `cs_start`, `cs_get` (current step only, never later steps), `cs_choose` (commits, returns outcome and feedback for that step), `cs_finish` (summary), `cs_resume`. Branching is deterministic from stored `next_position`; no randomness except an optional seeded option shuffle.

**Authoring path.** Cases are written as structured Markdown/JSON in `content/drafts/cases/` using the same validator pipeline as topic drafts (new rules: every step cites a topic claim; no dose/threshold unless traced to a source; at least one step tests escalation scope). They remain DRAFT until clinical review, like the 240 MCQs.

**UI.** `/[locale]/cases` list, `/cases/[id]/attempt/[attemptId]` stepper (one step per screen, live region announces the outcome), `/cases/.../results`. Reuses `QuizRunner` patterns (focus management, navigator replaced by a step trail).

**Tests.** Unit: branching, scoring, fixtures engine. DB: secrecy (later steps and options' points not leaked), RLS, resume, gate (clinical blocked). E2E: complete a branching case, resume, keyboard, axe, RTL.

## 3. Feature B: study and revision modes ("Study")
1. **Topic revision sheets** - key points, red flags and escalation criteria pulled from the *published* topic snapshot only (`public_topics`), so the gate is inherited. No new content store.
2. **Targeted revision from the question bank** - "revise what I got wrong / flagged / bookmarked": builds a practice attempt from `learner_question_stats.last_correct = false`, flagged and bookmarked items (all already gated).
3. **Spaced repetition (deterministic).** Leitner boxes (5 boxes, intervals 1/3/7/14/30 days) over questions the learner has answered. Table `learner_review_schedule(user_id, question_id, box, due_at)` updated inside the existing reveal path (`private.reveal_answer`); a `due today` count on the dashboard and a "Review due" practice launcher. No ML, fully testable with a fake clock.
4. **Flashcards (optional, last).** Cards derive from topic key points; same gate and RPC pattern.
5. **Study plan view.** Domain progress (already on the dashboard) plus "next suggested topics" using plain rules (lowest accuracy first, then least recently viewed).

**Schema (migration `0008_study.sql`).** `learner_review_schedule`, plus a view/RPC `st_revision_set(p_kind, p_limit)`. Own-row RLS; no content tables.

## 4. Sequencing and gates
| Step | Work | Exit criteria |
|---|---|---|
| 0 | Owner accepts quiz-engine gate; confirms scope | written acceptance |
| 1 | Study mode 2 + 3 (reuse existing tables; smallest risk) | unit/DB/E2E/a11y green, no schema leak |
| 2 | Study mode 1 (revision sheets from published snapshots) | works with demo topics only; draft clinical topics invisible |
| 3 | Cases: schema + fixtures engine + 3 synthetic cases | content gate, secrecy and RLS tests green |
| 4 | Cases UI + E2E + a11y + RTL | same bar as the question bank |
| 5 | Case authoring validator + 2-3 DRAFT case pilots (not published) | validator passes; still DRAFT |
Each step ends with the same checks: lint, typecheck, unit, DB/RLS, content-gate security tests, E2E (3 viewports), axe, build.

## 5. Risks and open questions for the owner
* Scoring philosophy for cases (partial credit vs best-action only) - proposed: 0-2 points per decision, shown as "decisions aligned with the reference answer", never as competence.
* Whether spaced repetition should be opt-in per learner (proposed: on by default, with a switch).
* Clinical review capacity: no case can leave DRAFT without it; fixtures keep the engine testable meanwhile.
* Arabic case text needs terminology review before any non-fixture release.
