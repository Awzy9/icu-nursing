# tests
* `tests/unit` - Vitest (jsdom): validators, i18n, question-bank shuffle/scoring/fixtures/engine/mode, source-tree content gate. `npm test`
* `tests/db` - Vitest against real PostgreSQL with every migration applied (RLS, workflow, audit, question bank, API surface allowlist). `npm run test:db`
* `tests/e2e` - Playwright on the demo build (3 viewports, axe, CSP, RTL, question bank). Build with Supabase variables empty first:
  `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= NEXT_PUBLIC_TURNSTILE_SITE_KEY= npm run build && npm run test:e2e`
  (set `PW_CHROMIUM_PATH` to a Chromium binary if Playwright's own browser is not installed).
* `tests/live`, `tests/live-e2e` - need the hosted dev project and its real CAPTCHA; see `docs/ISOLATED_LIVE_TESTING.md`.
