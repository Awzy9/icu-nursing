# Draft quality report and exact progress counts

Date: 2026-11-14 · Branch `claude/vigilant-mendel-95k63h` · **All content AI-generated, DRAFT, NOT clinically reviewed, not imported, not published.**

## Counts
| Measure | Count |
|---|---|
| P1 first-release topics | 40 |
| Drafted topics (all batches) | **12** (Batch 1: 6, Batch 2: 6) |
| Clinically reviewed / approved topics | **0** |
| Topics imported into the database / published | **0** |
| Planned Batch 1 slots unfinished | 4 (see `BACKLOG.md`) |
| Planned Batch 2 slots unfilled | 4 (3 source-feasible, 1 partly) |
| P1 topics not attempted | 24 |
| MCQs written | 72 (36 per batch), 216 wrong-option explanations |
| MCQ correct-answer positions | Batch 1: A 8, B 9, C 9, D 10 · Batch 2: A 9, B 11, C 8, D 8 |
| Batch 2 claims traced to full text | 72 of 72 matched (`batch-02-claim-trace.csv`); Batch 1 traced manually (see its internal review) |
| Source register entries | 48 (`sources/source_register.csv`) |
| Approx. words in drafts | 28,500 |

## Batch status
| Batch | Drafts | Internal review | Human clinical review |
|---|---|---|---|
| 1 | 6 | Done (`BATCH_01_INTERNAL_REVIEW.md`) | None |
| 2 | 6 | Done (`BATCH_02_INTERNAL_REVIEW.md`) | None |
| 3 | not started | – | – |

## Test status (2026-11-14, this commit)
| Check | Result |
|---|---|
| Lint (`npm run lint`) | clean |
| Typecheck | clean |
| Unit tests (`npm test`) | 104 passed (12 files) |
| Draft validation (`npm run validate:drafts`) | 12 of 12 drafts pass |
| Database tests (`npm run test:db`, local PostgreSQL 16) | 170 passed |
| E2E + accessibility, demo mode (3 viewports, axe light/dark, CSP, keyboard) | 127 passed, 2 skipped (mobile-only tests on non-mobile projects) |
| Real-CAPTCHA live checks (`captcha-real.live.spec.ts`) | 5 passed |
| **Not run:** live API suite (`tests/live`, 50 tests) and the live UI suite (`tests/live-e2e/ui.live.spec.ts`, 11 tests) | They sign in with Cloudflare's test token, which the real Turnstile secret now refuses. Running them would require replacing the owner's real secret with a test secret; this was **not done** |

## Known limitations of this QA
- AI self-review is not independent; claim matching shows the wording exists, not that the paraphrase is clinically perfect.
- Several sources are dated or blocked (see `BATCH_02_INTERNAL_REVIEW.md` §7).
