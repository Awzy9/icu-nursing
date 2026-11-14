# Implementation notes (Phase 1)

Progress log, commands and decisions for the Phase 1 build. Updated per batch.

## Run it

```bash
npm install
cp .env.example .env.local   # leave Supabase empty for demo mode
npm run dev                  # http://localhost:3000/en
npm run check                # lint + typecheck + unit tests
npm run test:db              # needs DATABASE_URL (a PostgreSQL superuser connection)
npm run build && npm run test:e2e
```

Demo mode (no Supabase variables): synthetic, clearly labelled content, no accounts.

## Layout

| Path | Purpose |
|---|---|
| `src/app/[locale]/…` | App Router pages (all localised) |
| `src/i18n`, `src/messages` | next-intl routing + English/Arabic catalogues |
| `src/lib/env.ts` | Zod-validated configuration (no service-role key, ever) |
| `src/lib/content` | Content repository interface; demo + Supabase implementations |
| `src/lib/supabase`, `src/lib/auth.ts` | Server/browser clients, session + role helpers |
| `src/components/ui` | Design-system primitives (shadcn-style) |
| `supabase/migrations` | Reproducible database schema, RLS and workflow functions |
| `tests/unit`, `tests/db`, `tests/e2e` | Vitest, PostgreSQL/RLS, Playwright |

See the batch sections below.
