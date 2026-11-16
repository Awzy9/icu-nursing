# Phase 10 report (draft content only; nothing imported, published, merged or deployed)

Starting point: branch head `622b107` (descendant of `1c93d19`, which contains the Android package-name change). The mobile prototype and its package identifier were left unchanged.

## 1. Scenario round-trip tests
* `tests/unit/support/scenario-to-case.ts` (test-only; `src/` cannot import drafts) converts a validated scenario decision graph into the case-engine fixture format; it refuses outlines, drafts that fail the validator, and drafts claiming review.
* `tests/unit/scenario-roundtrip.test.ts` (22 tests) runs a synthetic **nonclinical** scenario in the authoring format (a fictional ferry office) through the in-memory case engine: branching, observation changes (and no asserted normal bands), consequences, secrecy of keys until a choice, debrief only after completion (scope counts, revisit positions), scoring (best route 100%, worst lower), resumption across service instances, authorization (other users, wrong step, foreign option, finished attempts) and content gating (nothing in `src/` loads from the draft directories or refers to scenario ids; the seed contains no scenario; converted clinical drafts exist only in memory with a non-fixture code). It also converts every real decision graph in memory and checks every route terminates, the best route scores 100% and the engine's points match the authored points.
* `tests/db/scenario-roundtrip.test.ts` (4 tests) loads the converted synthetic draft into the **SQL** case engine (publishing runs the database's structure checks) and repeats branching, observations, secrecy, scoring, debrief, resumption, cross-user refusal and the fixture gate.
* The validator accepts `synthetic_fixture: true` drafts (id `SYN-SC-nn`, setting must say it has no clinical content) so fixtures never need to impersonate a master scenario. No clinical scenario was imported or published.

## 2. Equipment persistence
Migration `0015_equipment_learning.sql` (manual rollback provided): tables `equipment_bookmarks` and `equipment_progress` with RLS (own rows readable, no direct writes), four SECURITY DEFINER functions (`eq_state`, `eq_set_bookmark`, `eq_mark_viewed`, `eq_reset_progress`) behind `private.require_user()`, fixture isolation (refuse unless fixtures are visible on a development database) and a CHECK allowing only `SYN-EQ-nnn` codes, ceilings (50 bookmarks, 8 parts per module). App layer: state service with Supabase and in-memory fixture implementations, server actions with rate limits and module/part validation, optimistic UI with rollback, sign-in required in database mode, no browser storage. Tests: `tests/db/equipment.test.ts` (7: isolation, clinical codes rejected even for the owner, sessions/devices, cross-user, direct writes denied, account deletion cascade, ceilings), `tests/unit/equipment-state.test.ts` (3), an isolated-stack live UI test (second device and second user), updated function-catalogue and surface tests.

## 3. Structured scenarios: 13 of 20 are full decision graphs
New: SC-17 delirium and agitation (NICE CG103, updated January 2023) and SC-20 neurological deterioration after head injury (NICE NG232, May 2023; framed as head injury only). Earlier: SC-01, 03, 04, 06, 10, 11, 13, 14, 15, 18, 19. Seven remain outlines (SC-02, 05, 07, 08, 09, 12, 16); `docs/phase10/SCENARIO_EVIDENCE_GAPS.md` lists the sources still needed and the searches that failed. No action, threshold or dose was invented.

## 4. Administrative features
Audit in `docs/phase10/ADMIN_AUDIT.md`. Implemented: staff-only read-only `/admin/content` (database counts by status with each publication gate; counts-only draft register; licensing summary), source-register staleness badges, `npm run validate:all`, a generated counts-only draft register with a freshness test and a CI check, tests (DB and unit). Not implemented (needs owner decisions): authoring UIs, revision tables for questions and cases, review assignment for non-topic content.

## 5. Mobile architecture
Audit in `docs/phase10/MOBILE_ARCHITECTURE_AUDIT.md`: the prototype has two source files, no networking or accounts, and shares no code with the website; the package id `com.criticalcarenursing.myapp` is intentional (owner-specified) and unchanged; the RPC layer and RLS are directly reusable by a native client; Turnstile, deep links, account deletion and a shared schema package are the main work; the prototype alone is not enough for a public store release and a WebView wrapper is not recommended.

## 6. Local verification
Lint and typecheck clean; unit 27 files / 366 tests; database/RLS 18 files / 281 tests (run against a local Postgres 16); six draft validators 0 issues; seeds up to date; Playwright with a CI-equivalent build 307 passed, 8 skipped, 0 failed. CI results for the final commit are reported separately.

## 7. Remaining gaps
Seven scenarios lack sources; equipment parameter explanations need sources; medication evidence is mostly label-only; no authoring or review UI beyond topics; reproduction permissions for several publishers unresolved; clinical review not started; mobile work needs owner decisions (identifiers, CAPTCHA approach, iOS scope).
