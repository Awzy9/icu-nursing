# Draft quality report and exact progress counts

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h` · **All content AI-generated, DRAFT, NOT clinically reviewed, not imported, not published.**

## Unique-topic counts (canonical inventory `TOPIC_INVENTORY.csv`)
| Measure | Count |
|---|---|
| P1 first-release topics | 40 |
| Drafted topics (unique) | **15** (Batch 1: 6; Batch 2: 9) |
| Blocked | **4** (D03-T09, D09-T03, D07-T01, D02-T14) |
| Not attempted | **21** |
| Clinically reviewed / approved | **0** |
| Imported into the database / published | **0** |
| MCQs | 90 (36 + 54); 270 wrong-option explanations |
| MCQ correct-answer positions | Batch 1: A 8 B 9 C 9 D 10 · Batch 2: A 12 B 16 C 14 D 12 |
| Batch 2 claims traced to source text | 119 matched of 119 (`batch-02-claim-trace.csv`) |
| Untraced statement groups (labelled) | 15 (`UNTRACED_STATEMENTS.md`) |
| Source register entries | 49 (`sources/source_register.csv`) |

## Batch status
| Batch | Drafts | Internal review | Human clinical review |
|---|---|---|---|
| 1 | 6 | Done | None |
| 2 | 9 (6 + 3 continuation) | Done (including addendum) | None |
| 3 | not started | – | – |

## Test status (2026-11-14, this commit)
| Check | Result |
|---|---|
| Lint, typecheck | clean |
| Unit tests | 114 passed (12 files; includes inventory, consistency and MCQ-quality tests) |
| Draft validation | 15 of 15 drafts pass |
| Database tests (local PostgreSQL 16) | 170 passed |
| E2E + accessibility (demo mode, 3 viewports, axe, CSP) | 127 passed, 2 skipped (mobile-only on other projects) |
| Real-CAPTCHA live checks | 5 passed |

Live tests blocked by the real Turnstile secret: `tests/live` (50) and `tests/live-e2e/ui.live.spec.ts` (11) cannot run without replacing the owner's real secret; the five real-CAPTCHA checks in `captcha-real.live.spec.ts` can and do run.

## Limitations
AI self-review is not independent; text matching proves wording exists, not that every paraphrase is perfect; dated or blocked sources remain (shock 2014, enteral nutrition 2017, PADIS, SSC 2026, BTS 2017, ERC BLS/PRC full text).
