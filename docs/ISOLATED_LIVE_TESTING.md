# Isolated configuration for the CAPTCHA-dependent live test suites

Status: **design and safeguards only (2026-11-15).** Nothing here was run against a new project, and no new project, paid service or agreement was created. Owner approval is needed before any new Supabase project is created.

## The problem
The live API suite (`tests/live`, 50 tests) and live UI suite (`tests/live-e2e/ui.live.spec.ts`, 11 tests) were written when the development project's CAPTCHA could be switched to a Cloudflare **test** secret (always pass / always fail) and back. The project now holds the owner's **real** Turnstile secret. These suites (and `scripts/live/configure-captcha.ts --test-keys=... | --off`) would **replace the real secret or disable CAPTCHA** on `icu-nursing-dev`, and with the real secret active they cannot pass anyway because a person must solve the widget.

## Safeguard added now (verified by unit test)
`scripts/live/mgmt.ts` exports `refuseCaptchaWeakeningOnDev()`. It throws when the target project ref is the approved dev project. It is called by `configure-captcha.ts` (for `--test-keys` and `--off`), by `setSecret` in the live API suite and by `secret()` in the live UI suite. Setting the **real** secret through `TURNSTILE_SECRET` is not blocked. `tests/unit/live-guard.test.ts` covers it. Result: running the live suites against the dev project can no longer overwrite the real secret.

## Options for a project where the suites can run
| Option | What it is | Pros | Cons / needs |
|---|---|---|---|
| **A. Local Supabase stack** | `npx supabase start` (Docker) with CAPTCHA enabled using Cloudflare's public test secret through `[auth.captcha]` and an environment variable; the app points at `http://127.0.0.1:54321` | No cloud project, no cost, fully isolated, repeatable in CI | Needs a Docker daemon (**not available in this sandbox**: `docker ps` cannot connect); the live tooling (`mgmt.ts`) calls the hosted Management API, so a local mode (direct SQL and GoTrue admin through the service key) must be written and tested |
| **B. Second hosted Supabase project** (for example `icu-nursing-test`) | Separate project with the Cloudflare test secret and its own Turnstile widget or test site key | Closest to production behaviour; reuses the existing scripts after parameterising the project ref | Owner must approve creating a project (free-plan limits and any cost are the owner's decision); keys and secrets must be handled outside the repo; a ref allow-list is needed so the tooling can never touch other projects |
| **C. Keep the dev project as is** | Only run the real-widget spec (`REAL_CAPTCHA=1 ... captcha-real`) and the non-auth suites | No change | The 61 live tests stay unrunnable |

**Recommendation:** A for routine and CI use (once Docker is available on a developer machine or CI runner), B if the owner wants a hosted pre-staging check. Both keep the dev project's authentication controls unchanged.

## Work plan after approval
1. Parameterise `scripts/live/mgmt.ts` and `tests/live/helpers.ts` with `LIVE_PROJECT_REF` / `LIVE_PROJECT_URL`, accepted only if listed in an explicit allow-list file that does **not** contain the dev ref for CAPTCHA-mutating operations.
2. Add `LIVE_TARGET=local|isolated|dev`; `dev` runs only non-CAPTCHA specs and `captcha-real`.
3. For local mode: `supabase/config.toml` `[auth.captcha] enabled = true, provider = "turnstile", secret = "env(SUPABASE_AUTH_CAPTCHA_SECRET)"` with the public test secret in the shell only; apply `supabase/migrations`; use the Cloudflare public test site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the isolated build.
4. Run the 50 API and 11 UI tests there; keep the real-widget spec on the dev project.
5. Document the commands in `docs/CAPTCHA.md` and CI; add a CI job that never has the real secret.

## What was not done
No new project, no Docker run, no change to the dev project's CAPTCHA settings or secret, and no weakening of any authentication control.

## Feasibility check, Phase 4 (2026-11-15)
* Docker CLI is installed in the development sandbox but **no Docker daemon is running** (`/var/run/docker.sock` is absent), so Option A (local Supabase stack) cannot be executed here. The Supabase CLI (3.1.0) is available, so the option is ready for a machine or CI runner with Docker.
* Option B needs a second hosted Supabase project, which requires owner approval. None was created.
* Nothing was run against, and nothing was changed in, `icu-nursing-dev` (Turnstile secret and CAPTCHA settings untouched). The guard `refuseCaptchaWeakeningOnDev()` remains in force and unit-tested.
* The question bank does not depend on the live suites: its database behaviour is tested on real PostgreSQL with every migration applied (`npm run test:db`), and its UI on the fixtures engine (`npm run test:e2e`). Migration `0006` has **not** been applied to the hosted dev project.
