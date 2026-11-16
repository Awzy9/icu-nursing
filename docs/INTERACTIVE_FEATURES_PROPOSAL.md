# Proposal: non-AI interactive educational features (Phase 3, 2026-11-15)
Status: **proposal only; nothing built or published.** All features below can be developed and tested without importing or publishing any unreviewed clinical draft. No AI assistant or clinical review work is included (both are postponed by the owner).

## Guiding rules
1. **Content gate.** Question, case and simulation content is served only when its `status` is a reviewed state. Until then the features run on **synthetic, non-clinical fixtures** (for example questions about using the platform, or clearly fictional "demo" items marked `demo_synthetic`, as the app already does for topics). Drafts stay in `content/drafts` and are not importable.
2. **No new clinical claims in code.** Feedback text comes only from content records; the application never generates clinical advice.
3. **Testable by construction:** deterministic scoring, schema validation, fixtures, unit and E2E tests, axe checks.
4. **Privacy:** attempt data is per-user under RLS; no leaderboards; aggregate item statistics for educators only.

## Feature list (priority order)
| # | Feature | What it does | Technical approach | Tests | Content dependency |
|---|---|---|---|---|---|
| 1 | **MCQ practice and exam modes** | Present one question at a time; practice mode shows rationale after each answer (why correct and why not); exam mode hides feedback until the end; timer optional; resume unfinished attempts | Question schema mirroring the draft format (stem, tag, options, key, rationales, source IDs, status); tables `question_items`, `quiz_attempts`, `quiz_answers` with RLS; server action to score; option order shuffle with seeded RNG that never changes the key; accessible radio-group UI | Unit: scoring, shuffle determinism, schema validation. DB: RLS. E2E: complete a quiz, resume, keyboard-only, axe | Synthetic fixtures now; reviewed items later |
| 2 | **Case-based questions** | A short fictional case with 2–5 linked questions (assessment, prioritisation, escalation, documentation) and a "what is your next step" SBAR builder | `case_items` with ordered `question_items`; scenario stem and findings revealed progressively; each step records an answer | Unit: progression logic. E2E: step-through, back/forward, a11y | Reviewed cases only |
| 3 | **Step-by-step nursing scenarios** | Branching decision scenarios for recognition and escalation (not procedure instructions): the learner chooses an action, sees the patient state change and a consequence note | JSON scenario graph (nodes, choices, state, feedback, source IDs); graph validator (no dead ends, every node reachable, every feedback cites a source ID) | Unit: graph validation and traversal. E2E: complete a path; a11y | Reviewed scenarios; synthetic graph for tests |
| 4 | **Progress and bookmarks (extend)** | Per-section progress, "continue where you left off", bookmarked questions and sections, notes (private) | Extend `learning_progress` with section-level rows; client-side only scroll state plus server save; RLS unchanged | Unit and E2E on the existing pattern | None |
| 5 | **Revision and study modes** | Flashcards from key points; spaced repetition (Leitner boxes or a simple SM-2 variant); "weak topics" from quiz results; printable one-page revision sheets | `study_cards`, `card_reviews`; deterministic scheduler with unit tests; offline-capable view | Unit: scheduler; E2E: review session | Reviewed key points |
| 6 | **Educational device and monitoring simulations** | Generic, clearly fictional simulations: (a) alarm-response drill on a *generic* ventilator panel (patient-first decision practice; no manufacturer branding), (b) pressure and flow curves from synthetic data to show concepts (for example volume versus pressure control), (c) ECG rhythm recognition using synthetic or licensed strips | Client-side deterministic simulators driven by JSON scripts; no manufacturer screens, tables or alarm lists; explicit "educational simulation, not a real device" banner | Unit: simulator state machines; E2E: run a drill; a11y with text alternatives for every graphic | Licensed or synthetic assets; reviewed scripts |
| 7 | **Learning-experience upgrades** | Key-points card, glossary tooltips, reading time, print view, deep links | Template change and render-only components | Unit and E2E | Reviewed glossary |

## Recommended build order
1. Quiz engine (feature 1) with synthetic fixtures, including the content gate and item-statistics view for educators (aggregate only).
2. Study modes (feature 5) reusing the same item store.
3. Case-based questions (feature 2), then scenarios (feature 3).
4. Simulations (feature 6), starting with the concept curves (no device imitation).
5. Learning-experience upgrades (feature 7) in parallel, as they need no new data model.

## What this proposal deliberately avoids
Publishing any draft MCQ or case; imitating real device screens or alarm tables; generating feedback or questions with AI; procedure instructions or doses; unreviewed scoring thresholds for competence.

## Decisions needed from the owner
Target jurisdiction(s) and languages for the first release; whether quizzes are formative only or may count toward certificates (this raises review and assessment-validity requirements); whether to commission licensed assets (ECG strips, device graphics); the retention period for learner attempt data.
