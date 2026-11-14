# Vercel staging: prepared, NOT deployed

**Nothing has been deployed, no Vercel project exists, and nothing here costs money.** This document and the files below make a staging deployment a ~20-minute task once you approve.

## What is already in the repository
| File | Purpose |
|---|---|
| `vercel.json` | Next.js framework, `npm ci` / `npm run build`, region `bom1` (Mumbai, next to the Supabase ap-south-1 database), `ignoreCommand` safety guard |
| `scripts/vercel-ignore.sh` | **Only a branch named `staging` is ever built.** Connecting the repo to Vercel cannot deploy `main`, feature branches or PR previews by accident |
| `.env.staging.example` | The five public variables for staging (no secrets exist in the app) |
| `src/app/robots.ts`, `X-Robots-Tag` header | Non-production deployments are `noindex`; only `NEXT_PUBLIC_APP_ENV=production` may be crawled |
| Staging banner | `NEXT_PUBLIC_APP_ENV=staging` shows "STAGING: test data only" (en/ar) |
| `scripts/smoke.ts`, `.github/workflows/smoke.yml` | Read-only smoke test for any deployed URL (headers, CSP nonce, noindex, health, auth redirect, CAPTCHA host, no secrets) - runnable by hand or via the manual GitHub workflow |

## Decisions I need from you
| # | Decision | My recommendation |
|---|---|---|
| 1 | **Vercel plan.** The free Hobby plan is for personal, non-commercial use under Vercel's terms; a commercial product's staging normally belongs on a paid plan. Check Vercel's current pricing and terms before creating the project. **I will not create a paid service without your approval.** | Pro plan for the team that owns the product |
| 2 | **Supabase project for staging.** Reuse `icu-nursing-dev` (fastest, but it holds the test-key CAPTCHA, test accounts and development data) or create a **separate staging project** (clean data, real CAPTCHA/SMTP, mirrors production). Production must be a third, separate project | Separate staging project; apply migrations with `npm run live:migrate` (script is pinned to the dev ref today, parameterise before use) |
| 3 | **Staging hostname** (Vercel default `*.vercel.app` is fine initially) | default |
| 4 | **Access control.** Staging will be reachable by anyone with the URL (it is `noindex`, but not private). Use synthetic data only; Vercel "Deployment Protection"/password options may need a paid plan | synthetic only, protection if available |
| 5 | Turnstile **site key + secret**, SMTP provider (see `docs/CAPTCHA.md`, `docs/EMAIL_TESTING.md`) | before the first real-user test |

## Deployment steps (after approval)
1. **Branch:** staging builds only from `staging`. After you merge PR #2 (or choose to deploy earlier): `git push origin <commit>:refs/heads/staging`.
2. **Vercel:** Add New → Project → import `Awzy9/icu-nursing`, Production Branch = `staging`, framework Next.js (auto), leave `vercel.json` defaults. Do **not** add any secret.
3. **Environment variables** (Production scope of the staging project): copy `.env.staging.example`. `NEXT_PUBLIC_SITE_URL` must equal the final URL exactly.
4. **Supabase (staging project):** Authentication → URL Configuration: *Site URL* = staging URL; *Redirect URLs* add `https://<staging>/auth/callback`. Set the CAPTCHA secret and SMTP (see the two guides). Keep `password >= 12`, email confirmation on, TOTP on.
5. **Turnstile:** add the staging hostname to the widget.
6. **Deploy**, then run the smoke test:
   ```bash
   npx tsx scripts/smoke.ts https://<staging> --live --captcha
   ```
   (or Actions → "Smoke test a deployment (manual)").
7. **Manual acceptance:** register with a real address (email arrives), sign in, enrol TOTP as the bootstrap admin (first-admin SQL in `docs/SECURITY.md`), run the author → reviewer → publisher flow with *test accounts only*, check Arabic/RTL on a phone.
8. Run `npm run test:e2e:live` locally against the staging project if you want the full UI suite (it creates and removes its own test users; it refuses to run against any project other than the pinned dev ref, so adapt `scripts/live/mgmt.ts` deliberately).

## Rollback and operations
- Roll back with Vercel "Instant Rollback" (promote a previous deployment) or redeploy an earlier commit to `staging`. Database changes are forward-only migrations; never edit applied migrations.
- A bad deployment can be switched off by removing the `staging` branch (the ignore guard then skips everything).
- Add uptime monitoring on `/api/health` (returns `{status, mode, captcha}`; `captcha:false` on a live deployment is a misconfiguration).

## Environment matrix
| | Development | Staging | Production |
|---|---|---|---|
| Supabase project | `icu-nursing-dev` | separate (recommended) | separate, backups/PITR on |
| `NEXT_PUBLIC_APP_ENV` | unset | `staging` | `production` |
| Indexing | no | no | yes |
| CAPTCHA | Cloudflare TEST secret | real keys | real keys |
| SMTP | built-in (2/h) | custom | custom, verified domain |
| Data | synthetic | synthetic | real learners; **no patient data ever** |
