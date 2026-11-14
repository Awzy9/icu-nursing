# Development Roadmap

Estimates are planning ranges, not commitments. Effort assumes one full-stack developer plus part-time clinical reviewers/pharmacist.

## Milestones

| M | Phase | Weeks | Depends on | Exit criteria |
|---|---|---|---|---|
| M0 | Phase 0 blueprint | 2–3 | — | Review pack approved (see `PHASE0_REVIEW.md`) |
| M1 | Phase 1 core platform | 3–4 | M0, Supabase/Vercel approval | Auth, RLS tests, topic reader, admin CMS, workflow enforced in DB |
| M2 | Phase 2 library | 4–6 | M1, reviewer recruitment, licences verified | 40 topics approved & published, MCQs, references |
| M3 | Phase 3 practical | 3–4 | M2, pharmacist | 25 skills, 50 medications (no unreviewed doses), SBAR training |
| M4 | Phase 4 sim + exams | 4–6 | M2 | 20 scenarios, 300 questions, timed exams, analytics |
| M5 | Phase 5 AI | 2–3 | M2–M4 content | Cited answers, refusals tested, usage caps |
| M6 | Phase 6 beta/launch | 3–4 | all | Release acceptance criteria met |

## Phase 1 task breakdown (first build after approval)

1. Repo scaffold (Next.js/TS/Tailwind/shadcn), CI, lint, test harness. *AC: green CI on empty app.*
2. Supabase project + migrations for identity, curriculum, versions, sources, audit. *AC: migrations replay from scratch.*
3. RLS policies + SQL tests. *AC: cross-user access denied in tests.*
4. Auth flows + roles + MFA for staff. *AC: e2e login/logout; role escalation impossible from client.*
5. Topic reader + TOC + search. *AC: a11y, mobile layout.*
6. Progress/bookmarks. *AC: private, persisted.*
7. Admin CMS + workflow transitions. *AC: AI/author cannot publish; every transition audited.*
8. Public pages (home, about, disclaimer, legal placeholders).

## Dependencies on you / external parties

- Approval to create Supabase/Vercel projects and any spend; domain.
- Clinical reviewers (nurse educators, pharmacist, RT, nephrology, neuro, infection prevention).
- SCCM permission request (needs your go-ahead).
- Payment provider decision.

## Testing requirements

Unit (logic, scoring), DB (RLS, constraints, workflow triggers), integration (exam and simulation APIs), e2e (Playwright), accessibility (axe), performance (Lighthouse CI), security review before Phase 6, content QA (link check, reference check, licence check).

## Risk register

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | Clinical error in published content | M | **High** | Mandatory human review, versioning, report-error flow, unpublish path, periodic review |
| R2 | Copyright/licence breach | M | High | Register first; originals only; RED = cite only; permission requests |
| R3 | Reviewer availability limits throughput | H | High | Recruit early; publish only what is reviewed; scale content to reviewer capacity |
| R4 | Draft guideline presented as final (e.g., KDIGO 2026) | M | High | Version pinning; re-check at build time |
| R5 | Scope creep (AI, mobile) before foundation | M | M | Phase gates |
| R6 | RLS misconfiguration leaks data | L | High | Default-deny, policy tests in CI |
| R7 | Medication info misuse | M | High | No doses without pharmacist review; local-protocol warnings |
| R8 | Saudi/Arabic terminology errors | M | M | Local clinician review before Arabic launch |
| R9 | Payment/regional compliance | M | M | Choose provider early; legal review |
| R10 | Misleading accreditation claims | L | High | Policy: no claims until granted |
| R11 | Cost overrun (AI, hosting) | M | M | Budget caps; usage limits |

## Effort estimate (rough)
Engineering ≈ 16–23 weeks across phases 1, 3–6; content production (clinician time) is the true critical path and is not captured in the engineering weeks.
