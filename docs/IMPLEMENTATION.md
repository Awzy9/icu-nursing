# Implementation notes (Phase 1)

## Run it

```bash
npm install
cp .env.example .env.local   # leave Supabase empty for demo mode
npm run dev                  # http://localhost:3000/en
npm run check                # lint + typecheck + unit tests
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:db
npm run build && npx playwright install chromium && npm run test:e2e
npx tsx scripts/generate-seed.ts   # regenerate supabase/seed.sql from src/content/demo.ts
```

Demo mode (no Supabase variables): synthetic, clearly labelled content; no accounts; no admin.

## Architecture

| Layer | Where | Notes |
|---|---|---|
| Routing + i18n | `src/app/[locale]`, `src/i18n`, `src/messages` | `en` (LTR), `ar` (RTL, **draft translation**); logical CSS; Latin digits + Gregorian calendar for clinical values; no unit conversion exists by design |
| Config | `src/lib/env.ts` | Zod; half-configured Supabase is rejected; service-role key never read |
| Content access | `src/lib/content/*` | Repository interface: demo (synthetic) and Supabase (public views of approved snapshots) |
| Auth | `src/lib/auth.ts`, `(auth)` pages, `src/middleware.ts`, `/auth/callback` | Supabase Auth; sessions validated with `getUser()`; staff must reach aal2 |
| Authorization | `supabase/migrations` | Default-deny RLS, column grants, SECURITY DEFINER workflow functions |
| Admin CMS | `src/app/[locale]/admin`, `components/admin` | Server actions only forward to DB functions; the DB decides |

## Database migrations

| File | Purpose |
|---|---|
| `0001_identity.sql` | roles enum, profiles, user_roles, reviewer_specialties, aal2-aware helpers, append-only audit log, role admin functions, default-deny privileges |
| `0002_content_schema.sql` | domains (10), topics (working copy), sections, scope-labelled actions, sources, references, image metadata, immutable versions, assignments, reviews, bookmarks, progress, public views, RLS |
| `0003_workflow.sql` | validation, submit, withdraw, assign, review, publish, revise, rollback, archive, restore |
| `supabase/seed.sql` | **development only** synthetic topics (generated) |

## Publication workflow (enforced in PostgreSQL)

`draft → in_review → approved → published`, plus `changes_requested`, `archived`, rollback. Highlights: reviews attach to immutable snapshots; approval only through `record_review` by an assigned clinical reviewer with MFA who is not the author; every required reviewer role must approve, by distinct people; AI-assisted/generated content needs ≥2 distinct human approvers whatever the settings; publishing needs an approved version and a publisher with MFA; cited draft guidelines must be acknowledged and are labelled "DRAFT"; RED-licensed sources need an "independently written" note; images need alt text and a reusable licence. Learners only ever read the published snapshot, so editing a published topic never changes what they see until a new version is approved and published.

## Test inventory (all run in CI)

| Suite | Count | Covers |
|---|---|---|
| `tests/unit` (Vitest) | 47 | env validation, i18n parity, formatting, content repository, snapshot mapping, auth validation, rate limit, open-redirect, callback route, admin actions |
| `tests/db` (Vitest + PostgreSQL 16) | 81 | migrations from scratch, RLS, cross-user isolation, role escalation, MFA, workflow rules, AI rule, publication/rollback, audit, API-surface allowlist |
| `tests/e2e` (Playwright + axe) | 118 (+2 skipped) | desktop/tablet/mobile, a11y (light + dark), RTL, overflow, security headers, keyboard, input safety, 404s, performance budget |

## Known gaps (also listed in the final report)

- Auth, MFA, email flows and the Supabase repository were **not exercised against a live Supabase stack** (none exists; a downloaded PostgREST binary could not be run in this environment). Database behaviour is tested on real PostgreSQL; page logic with mocks.
- No content is clinically reviewed. The ten topics are synthetic and labelled so.
- Arabic UI text is a draft pending native/clinical-terminology review. Staff admin UI is English-only.
- Image upload to Storage is not implemented (metadata registration only).
- Search is a simple text filter over published snapshots (adequate for the demo corpus; full-text search is a Phase 2 item).
