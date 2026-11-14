# ICU Nurse Knowledge Map

**From Knowledge to Bedside Competence.**

An independent, evidence-based educational platform for adult ICU nurses. English first, Arabic (RTL) later.

> **Status: Phase 0 (research & blueprint) — awaiting review.** No application code exists yet, by design. See [`PHASE0_REVIEW.md`](PHASE0_REVIEW.md) for findings, open items and decisions needed.

This is **educational software, not a clinical decision-support system.** It does not replace institutional protocols or professional judgment. It contains no real patient data.

## Repository map

| Path | Contents |
|---|---|
| [`PHASE0_REVIEW.md`](PHASE0_REVIEW.md) | Review pack: acceptance check, outstanding work, decisions needed |
| [`COMPETITOR_ANALYSIS.md`](COMPETITOR_ANALYSIS.md) · [`MARKET_OPPORTUNITY.md`](MARKET_OPPORTUNITY.md) | Market research and differentiators |
| [`UI_WIREFRAMES.md`](UI_WIREFRAMES.md) · `design/prototype/` | Low-fi wireframes + local prototype |
| [`SOURCE_VERIFICATION_REPORT.md`](SOURCE_VERIFICATION_REPORT.md) | What was verified, how, and what was not |
| [`SCCM_PERMISSION_REQUEST.md`](SCCM_PERMISSION_REQUEST.md) | Draft permission email (not sent) |
| [`CLINICAL_REVIEWER_MATRIX.md`](CLINICAL_REVIEWER_MATRIX.md) | Reviewer roles and multidisciplinary-review rules |
| [`PRODUCT_REQUIREMENTS.md`](PRODUCT_REQUIREMENTS.md) | Scope, audience, features, release acceptance criteria |
| [`CURRICULUM.md`](CURRICULUM.md) | Curriculum overview and the 40-topic first release |
| [`SOURCE_REGISTER.md`](SOURCE_REGISTER.md) | Source register summary (data in `sources/source_register.csv`) |
| [`LICENSING_REGISTER.md`](LICENSING_REGISTER.md) | GREEN/YELLOW/RED licence classification and permission actions |
| [`CLINICAL_GOVERNANCE.md`](CLINICAL_GOVERNANCE.md) | Publication workflow, reviewer roles, medication review |
| [`TECHNICAL_ARCHITECTURE.md`](TECHNICAL_ARCHITECTURE.md) | System, auth, RLS, CMS, simulation, subscriptions, deployment |
| [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md) | Schema and ER diagram |
| [`DEVELOPMENT_ROADMAP.md`](DEVELOPMENT_ROADMAP.md) | Phases, milestones, dependencies, risks |
| [`UI_DESIGN_GUIDELINES.md`](UI_DESIGN_GUIDELINES.md) | Visual language and page structure |
| `curriculum/` | `master_curriculum.csv` (124 topics), `proposed_topics.csv` (18), generator script |
| `sources/` | `source_register.csv` |
| `content/templates/` | Templates: topic, skill, medication, MCQ, scenario, checklist, clinical review |
| `docs/`, `database/`, `design/`, `tests/` | Reserved for later phases |

## Principles

1. Clinical quality before quantity; nothing is published without human clinical review.
2. Nursing-specific: assess, monitor, recognise, act within scope, escalate, document.
3. Every claim traceable to a source; original wording, original questions, original diagrams.
4. Free access is not permission to reuse: every source is licence-classified first.
5. Fully independent infrastructure (own GitHub repo, Supabase, Vercel, domain). No other project is touched.
