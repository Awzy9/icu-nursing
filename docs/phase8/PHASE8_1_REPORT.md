# Phase 8.1 report (draft content only; nothing imported, published, merged or deployed)

## Medication drafts: 50 / 50
Batches 3-5 (MD-21..MD-50) added to the existing 20. Each draft records the exact product label (set id, version, date, manufacturer in `content/drafts/medications/LABEL_SOURCES.csv`), nursing monitoring, adverse effects, warnings, escalation, mandatory referral to institution preparation/dosing sections, a jurisdiction limit (US FDA labels only) and an `evidence_type_note` stating the source is a product label, not a bedside nursing practice guideline. No dosing; no clinical or pharmacist review claimed. `npm run validate:medications`: 50 drafts, 0 issues.

## Clinical scenario drafts: 20 / 20 specifications (0 published)
Original master list preserved in order. Six are decision graphs (SC-04 ventilator alarm, SC-06 accidental extubation, SC-13 cardiac arrest, SC-14 transfusion reaction, SC-15 CRRT circuit complication, SC-19 anaphylaxis) with changing fictional observations, consequences, scope-of-practice labels, source traces and structured debriefs. Fourteen are outlines listing only source-supported nursing actions, outstanding sources and gaps; SC-11 (severe hyperkalemia) is marked unsupported with no actions. `src/lib/scenario-draft-validator.ts`, `npm run validate:scenarios` (0 issues), `tests/unit/scenario-drafts.test.ts`, inventory in `content/drafts/scenarios/SCENARIO_INVENTORY.csv`.

## Skills evidence: 25 / 25 partial
Tracheostomy care recovered from unsupported to partial using one accessible NHS GGC guideline (regional, review date passed). Other tracheostomy sources (Open RN, NCBI, ACI, eCampusOntario) were blocked or missing and were not circumvented. Still no skill is "sourced" end to end; many sections remain local-protocol or permission-required.

## MCQ audit (306 questions, unchanged count)
38 flagged new questions reworded; new-question flags 38 -> 2; whole bank flagged 132 -> 96; unique-longest key 24.8% -> 15.7%; unique-shortest 24.5% -> 32.4%; positions 75/79/77/75; no identical options or near-duplicates. See `docs/phase8/MCQ_EXPANSION_REPORT.md`.

## Tests (local)
Lint, tsc, build clean; 23 unit files / 329 tests pass; all five draft validators report 0 issues. DB/RLS and Playwright suites need Postgres/CI and run in GitHub Actions (see CI results in the final message). Turnstile configuration untouched.

## Blockers
- Evidence: AARC, INS, ERC, AHA full texts need permission; medication evidence is label-only (US); hyperkalemia and several scenario topics lack a read source; NHS GGC guideline is dated; Open RN/NCBI/ACI access blocked.
- Licensing: see `LICENSING_REGISTER.md` (Phase 8.1 additions); no enquiries made.
- Postponed by owner: clinical review, AI assistant.
