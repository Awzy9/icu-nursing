# Whole question-bank structural audit — 24 November 2026

Content snapshot `e949bcc5126ca77d1fa8026b3f27f8cd4a47a802`; identical question content after test-only correction `46edb1cf95766d1fc7c99ccab46f7f9ca83e5404`. Fetched all 51 Markdown question sets in three groups of 17. Checked all 306 questions for key, four distinct options, one correct rationale, three incorrect rationales, minimum option and feedback lengths, per-set answer distribution/length gates, review flag and forbidden review wording; checked presence of expansion traces. This is a static subset of the repository validators, not execution of the full CI, all-pairs duplicate detection or independent clinical/evidence appraisal.

| Metric | Result |
|---|---:|
| Draft sets | 51 |
| Questions | 306 |
| Answer positions A/B/C/D | 75/79/77/75 |
| Unique-longest correct answer | 67 (21.9%) |
| Unique-shortest correct answer | 84 (27.5%) |
| Questions below feedback-length heuristic (correct <60 chars or any incorrect <25 chars) | 0 |
| Short stems (<60 chars) | 5 |
| Findings in replicated structural/gate checks | 0 |

## Follow-up

Five stems flagged: D01-T12 Q5, D04-T03 Q5, D01-T19 Q4, D07-T01 Q4, D01-T06 Q5. Shortness is a heuristic, not proof of a bad item. The full duplicate audit, current evidence review and learner difficulty/discrimination remain unresolved. The older 15 November report had 74 uniquely longest correct answers (24.2%). Two new regression tests had loaded only the main source CSV and falsely rejected valid skills and medication source IDs. Fixed them to use `loadKnown()` from the production expansion validator. Full CI remains necessary.

Index source metadata spot-check over all 51 topic/question entries: 139 unique listed IDs; 0 absent from the combined registry; 2 metadata field discrepancies detected by the replicated CSV check. Source presence is not evidence currency or reuse permission. Clinical and rights gates remain unchanged; no production publication.
