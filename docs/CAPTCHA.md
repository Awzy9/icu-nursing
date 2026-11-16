# CAPTCHA (Cloudflare Turnstile)

**What it protects:** sign-in, account registration and password-reset requests (the calls attackers automate for credential stuffing, sign-up spam and email bombing). Verification is done **server-side by Supabase Auth**: the browser widget produces a single-use token, our server action forwards it to Supabase, and Supabase checks it with Cloudflare using the *secret* it stores. The Next.js app only ever holds the public **site key**; no CAPTCHA secret exists in this repo, in Vercel, or in the browser.

If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, the widget is not shown and the app does not require a token (demo mode, local development). **In staging/production, set the site key *and* the Supabase secret together**: if only the Supabase side is enabled, sign-in is impossible (no token); if only the site key is set, Supabase does not verify it. `GET /api/health` reports `"captcha": true|false` so you can check a deployment.

## Keys I need from you (Cloudflare dashboard → Turnstile → Add widget)
| What | Where it goes | Who sets it |
|---|---|---|
| **Site key** (public) | Vercel env `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (staging and production, separate widgets recommended) | you, or tell me and I will add it to the staging config |
| **Secret key** (private) | Supabase → Authentication → Attack Protection → CAPTCHA → provider *Cloudflare Turnstile* → paste secret. Or run locally: `TURNSTILE_SECRET=... npx tsx scripts/live/configure-captcha.ts` with your own access token | **you** (do not paste it into chat; if you want me to apply it, send it only through the secure credential form) |
| **Hostnames** | In the Turnstile widget add: `localhost`, your staging hostname (e.g. `icu-nursing-staging.vercel.app`), later your production domain | you |

Widget mode: *Managed* (recommended). Pre-clearance not needed.

## What is already verified (dev project, Cloudflare's published TEST keys)
Cloudflare publishes test keys: site key `1x00000000000000000000AA` produces a token that the test secret `1x0000000000000000000000000000000AA` always accepts, and `2x0000000000000000000000000000000AA` always rejects. The dev project currently uses the "always pass" test secret, so the full chain is exercised without real keys:

- API: sign-in, sign-up and password recovery are refused without a token (`captcha_failed`); a token is accepted; a token the provider rejects is refused even with correct credentials; verification links and MFA are unaffected (live tests).
- UI: the widget loads under the nonce-based CSP (script inserted by our bundle via `strict-dynamic`, `frame-src` limited to `challenges.cloudflare.com` and only when CAPTCHA is on); the form receives the token; a missing token shows "Please complete the security check"; a rejected token shows "The security check failed", clears the password field and re-arms the widget with a fresh token.
- Unit tests: the token is mandatory when enabled, forwarded to Supabase on all three actions, oversized tokens rejected, CSP only opened when enabled.

**Not verified:** your real site/secret keys and real challenge difficulty (managed challenges may require interaction); behaviour behind your production domain. Do this at staging with the real keys (checklist in `docs/STAGING.md`).

## Operations
- Rotate the secret in Cloudflare, paste the new one in Supabase; no deploy needed. Changes take a few seconds to apply.
- To turn it off in dev: `npx tsx scripts/live/configure-captcha.ts --off`.
- Accessibility: Turnstile offers an accessible challenge; the form shows a text label "Security check". Keyboard users reach the widget in tab order.
- Privacy: Turnstile contacts Cloudflare. Mention it in the privacy policy before launch.

## Status: real Turnstile widget active on the DEV project

- Widget: owner-created "ICU Nursing Dev". Public site key `0x4AAAAAAGA_er_6N84u9td4` (public by design) is set in the local, git-ignored `.env.local` for development. The matching **secret** was entered by the owner in Supabase (Authentication → CAPTCHA protection); it never passed through this repository.
- `localhost` works with the real key (widget renders on `/login`, `/register`, `/forgot-password` under our CSP). When a Vercel staging URL exists, the owner adds its hostname to the widget in Cloudflare and sets `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel.
- The widget runs in Cloudflare's interactive mode ("Verify you are human"). Automated browsers are meant to fail it, so a **positive** login/reset/sign-up needs a human.

### Verified automatically (real Supabase + Cloudflare, no human token)
| Check | Result |
|---|---|
| Sign-in and password-reset requests with **no** token | 400 `captcha_failed` (no captcha_token found) |
| Same with a **forged** token | 400 `captcha_failed (invalid-input-response)` — proves Supabase calls Cloudflare siteverify with a valid secret (a wrong secret would say `invalid-input-secret`) |
| Cloudflare's public **test** token | Rejected now (the real secret replaced the test secret) |
| Real widget loads on all three forms, no CSP violation, token empty until a human completes it | pass (`tests/live-e2e/captcha-real.live.spec.ts`, `REAL_CAPTCHA=1`) |
| UI: missing token → "Please complete the security check."; forged token → "security check failed", form stays | pass |

### Manual real-CAPTCHA checklist (needs a person; about 5 minutes)
1. `npm run build:live && NEXT_DIST_DIR=.next-live npx next start -p 3100` (or `npm run dev`), open `http://localhost:3000/en/login`.
2. Tick "Verify you are human", sign in with a test account → expect success.
3. `/en/forgot-password`: complete the check, submit → expect the neutral "if an account exists…" message (an email only arrives for an authorised organisation address, max ~2/hour).
4. `/en/register`: complete the check, submit with an authorised organisation address → expect "check your email".
Report any "security check failed" message: it would indicate a hostname or secret mismatch.

### Consequence for the automated live suites
The live API suite (`tests/live`) and most of the live UI suite authenticate by password and used Cloudflare's **test** token, which the real secret now refuses. They therefore **cannot run** while the real secret is configured, and I will not overwrite the owner's secret to make them run. Options: (a) run them against a second, disposable dev project (needs owner approval); (b) temporarily switch the secret to the Cloudflare test secret yourself, run the suites, and re-enter the real secret afterwards. The old secret-swapping UI test is now skipped unless `CAPTCHA_MODE=test`.
