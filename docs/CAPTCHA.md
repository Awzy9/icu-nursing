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
