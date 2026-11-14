# ICU Nurse Knowledge Map

**From Knowledge to Bedside Competence.**

An independent, evidence-based educational platform for adult ICU nurses. English first, Arabic (RTL) later.

> **Status:** Phase 0 closed as far as independently possible; Phase 1 (core platform) implemented in a development environment on a feature branch and awaiting supervisory review. **Clinical publication is blocked** until reviewers are appointed and licences are cleared. See [`PHASE0_REVIEW.md`](PHASE0_REVIEW.md) and [`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md).

```bash
npm install && cp .env.example .env.local && npm run dev   # demo mode, no backend needed
```
Live development backend: `docs/LIVE_INTEGRATION_REPORT.md` and `docs/SUPABASE_SETUP.md`.

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
| `src/`, `supabase/`, `tests/`, `scripts/` | The application, migrations and automated tests (see `docs/IMPLEMENTATION.md`, `docs/SECURITY.md`, `docs/SUPABASE_SETUP.md`) |
| `design/prototype/` | Original static wireframe prototype (superseded by the real app) |

## Principles

1. Clinical quality before quantity; nothing is published without human clinical review.
2. Nursing-specific: assess, monitor, recognise, act within scope, escalate, document.
3. Every claim traceable to a source; original wording, original questions, original diagrams.
4. Free access is not permission to reuse: every source is licence-classified first.
5. Fully independent infrastructure (own GitHub repo, Supabase, Vercel, domain). No other project is touched.
