# Isolated live testing (implemented in Phase 6)

The live API suite (`tests/live`) and live UI suite (`tests/live-e2e/ui.live.spec.ts`) need CAPTCHA to be controllable (Cloudflare **test** keys, including the always-fail secret). They therefore must never run against the hosted `icu-nursing-dev` project, whose Turnstile secret is real. They now run against a **local Supabase stack started by the Supabase CLI inside a GitHub Actions job** (Docker): `.github/workflows/isolated-supabase.yml`.

## What the job does
1. Copies nothing out of the repository's secrets: the only "secrets" are Cloudflare's **public** test keys written in the workflow (`1x0000000000000000000000000000000AA`, site key `1x00000000000000000000AA`).
2. Edits only the CI copy of `supabase/config.toml` (relaxed rate limits, local redirect URLs, `[auth.captcha]` enabled with the test secret) and runs `supabase start`, which applies migrations `0001`-`0011`.
3. Exports the loopback endpoints (`http://127.0.0.1:54321`, DB `:54322`, Mailpit `:54324`) as `LIVE_*` variables.
4. Runs the guard unit tests, then the live API suite (50 workflow tests + 9 isolated transport/auth tests), builds the app against the local stack and runs the 11 live UI tests in Chromium with the Turnstile **test** widget.
5. On failure, uploads container logs and Playwright artifacts; always stops the stack.

## Guards (`scripts/live/target.ts`, `isolated-targets.json`)
* The default target is the hosted dev project and **test-key operations are refused there** (`requireIsolated()` throws unless `LIVE_TARGET=isolated`).
* `LIVE_TARGET=isolated` is accepted only for the explicit loopback allow-list; a hosted URL (including the dev project) fails **at import time**.
* Only Cloudflare's public test secrets may be applied (`assertTestCaptchaSecret`).
* The "reject token" tests flip the local GoTrue container's `GOTRUE_SECURITY_CAPTCHA_SECRET` by recreating that container (`isolated-auth.ts`, local Docker only). The Management API CAPTCHA call is simulated by `mgmt.ts` and can never reach a hosted project in isolated mode.
* Unit tests (`tests/unit/live-guard.test.ts`) prove all of the above independent of the environment they run in.

## Running it on a machine with Docker
```
sed -i 's/email_sent = 4/email_sent = 1000/; s/sign_in_sign_ups = 30/sign_in_sign_ups = 1000/' supabase/config.toml   # then restore with git checkout
# append the [auth.captcha] block shown in the workflow, then:
export SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA
supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta
eval "$(supabase status -o env | sed 's/^/export /')"
export LIVE_TARGET=isolated LIVE_SUPABASE_URL=$API_URL LIVE_ANON_KEY=$ANON_KEY LIVE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY LIVE_DB_URL=$DB_URL LIVE_MAIL_URL=http://127.0.0.1:54324
npm run test:live
NEXT_PUBLIC_SITE_URL=http://localhost:3100 NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build:live
npx playwright test --config playwright.live.config.ts tests/live-e2e/ui.live.spec.ts
```
The sandbox used for development has no Docker daemon, so the workflow itself is the proof of execution.

## What still runs only against the hosted dev project
`tests/live-e2e/captcha-real.live.spec.ts` (the real Turnstile widget) and `email.live.spec.ts` (real email delivery) need the real secret and a person, and are not part of the isolated job. Application integration against the hosted project is covered by `scripts/live/verify-app-on-dev.ts` (sessions via admin-issued links, CAPTCHA untouched).
