# Question bank (Phase 4)

Interactive MCQ practice and exam modes. **All questions currently available are synthetic, nonclinical development fixtures. The 240 clinical draft MCQs are not imported, not published and not reachable.**

## Routes
| Route | Purpose |
|---|---|
| `/{en,ar}/question-bank` | Dashboard: stats, resume unfinished attempts, start practice/exam (topic filter, count, exam time limit, bookmarked-only), progress by topic, previous attempts |
| `/{en,ar}/question-bank/attempt/[id]` | The runner. Practice: one question per screen, submit before feedback, per-option explanations, locked answers. Exam: no feedback, change/clear answers, flag, question navigator, server-anchored timer, confirmation summary |
| `/{en,ar}/question-bank/attempt/[id]/results` | Score, breakdown by topic, review of every question with explanations, filters (all / incorrect / flagged / not answered) |

`loading.tsx` and `error.tsx` provide loading and error states; empty states cover "no questions published" and "no attempts yet".

## Architecture
```
UI (server pages + one client runner) -> server actions (zod-validated) -> QuestionBankService
    database mode : Supabase RPCs qb_* (SECURITY DEFINER, content gate, RLS)         src/lib/question-bank/supabase-service.ts
    fixtures mode : in-memory engine with the same semantics (dev + E2E)             src/lib/question-bank/fixture-service.ts
shared pure logic : seeded shuffle (shuffle.ts), scoring (score.ts), wire schemas (types.ts)
```
`resolveMode()` (`src/lib/question-bank/index.ts`): `QUESTION_BANK_MODE=fixtures|database`, otherwise fixtures in demo mode and database when Supabase is configured. Fixtures are **refused when `NEXT_PUBLIC_APP_ENV=production`** and database mode is refused without Supabase.

## Database (`supabase/migrations/0006_question_bank.sql`)
| Table | Learner access |
|---|---|
| `question_items` (stem, kind, status, approval/review fields) | none (staff read only, MFA enforced) |
| `question_options` | none (staff read only) |
| `question_answer_keys` (correct option + rationale) | none (staff read only) |
| `question_explanations` (one per option) | none (staff read only) |
| `question_stats` (all-learner aggregates) | none (staff read only) |
| `quiz_attempts`, `quiz_attempt_items`, `quiz_answers` | own rows, read only; `is_correct` stays NULL until revealed |
| `learner_question_stats`, `question_bookmarks` | own rows, read only |

No learner has INSERT/UPDATE/DELETE on any of these. All writes go through functions: `qb_progress`, `qb_start_attempt`, `qb_get_attempt`, `qb_submit_answer`, `qb_set_flag`, `qb_set_position`, `qb_submit_attempt`, `qb_discard_attempt`, `qb_list_attempts`, `qb_set_bookmark`.

### Answer secrecy
* `qb_get_attempt` builds feedback (correct option, rationale, explanations) only for an answer already revealed (practice, after that answer was submitted) or for a completed attempt. An unanswered question never carries a key, rationale or explanation.
* Exam answers are stored with `is_correct = NULL`; scoring happens inside `finalize_attempt` on submission or when the server clock passes `expires_at`.
* Practice answers are final (a second submission is refused). Exam answers can be changed or cleared until submission.
* Scoring is deterministic: unanswered = incorrect; items withdrawn before being answered are *voided* and leave the denominator; percentage in tenths with integer half-up rounding (`private.score_tenths`, mirrored by `src/lib/question-bank/score.ts`).
* Shuffling: `order by md5(seed || scope || id) collate "C"` for questions and options, seed stored per attempt; the TypeScript implementation matches (cross-tested). Shuffling permutes option IDs, and the key is an option ID, so it cannot move.
* Resumption: the attempt id is an unguessable UUID *and* every function checks `user_id = auth.uid()`; another user gets "not found". Position, answers, flags and the remaining time (server clock) are restored.
* Unfinished attempts are capped at 5 per learner.

### Content gate
A question is learner-visible only if `private.question_is_visible()` is true: `status = 'published'`, not retired, `approved_at` and `published_at` set, **and**
* `demo_synthetic`: `source_note` starts with `SYNTHETIC FIXTURE` **and** `app_settings.question_fixtures_visible` is true (default **false**; production never shows them); or
* `clinical`: a named approver, an independent `clinical_reviewer` (different from the author), and the question's topic is currently published through the existing workflow.

`private.question_publish_guard` enforces the same evidence on every write (including owner/import scripts), published content is frozen (`question_*_frozen` triggers), and **no function in this phase sets the clinical review fields**, so clinical questions cannot become visible. A positive-control test shows the path works only with every safeguard present, and that unpublishing the topic hides the question again.

## Development fixtures
`src/lib/question-bank/synthetic-questions.json` (16 questions about astronomy, arithmetic, grammar, fictional library/ferry/card-game rules; two include Arabic). Labelled "Synthetic sample" in the UI. For a development database: `npm run seed:question-fixtures [-- --visible]` writes `supabase/seed_question_fixtures.sql` (idempotent; not a migration; hidden unless `--visible`).

## Tests
`tests/unit/question-bank*.test.ts` (shuffle, scoring, fixtures, fixture engine, mode resolution, source-tree gate), `tests/db/question-bank.test.ts` + updated `tests/db/surface.test.ts` (RLS, secrecy, scoring, resumption, expiry, gate), `tests/e2e/question-bank.spec.ts` (practice, exam, resume, keyboard, axe, RTL, dark mode, mobile, privacy).
