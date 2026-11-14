# Real-email integration testing (prepared, waiting for SMTP credentials)

**Why:** Supabase's built-in sender allows 2 emails/hour for the whole project and only delivers to your organisation's members, so registration, verification and password-reset emails have never been exercised with real delivery. Everything else in auth is already verified live (links are generated through the admin API in the current tests).

**Status:** the tooling below is written and lint/type-checked; the Resend-reading parts are **not executed yet** (they need your SMTP/API credentials) and rely on Resend's documented API shapes, so expect to fix small details on the first run.

## What I need from you (about 10 minutes)
1. **A Resend account** (free tier is enough: resend.com). Any SMTP provider works, Resend is chosen because its API lets the test read the sent message back, so no inbox is required.
2. **An API key** (Resend → API Keys → *Full access*; a sending-only key cannot read messages back). Treat it as a secret. Use it for SMTP below and revoke it when testing is finished.
3. **Configure Supabase SMTP**, either:
   - Dashboard: `supabase.com/dashboard/project/dvmevjomyaqrojsiffnf` → Authentication → Emails → SMTP Settings → host `smtp.resend.com`, port `465`, user `resend`, password = the API key, sender `onboarding@resend.dev`, sender name `ICU Nurse Knowledge Map`; then set the email send rate limit (Authentication → Rate Limits) to ~30/hour; **or**
   - On your machine: `SUPABASE_ACCESS_TOKEN=sbp_... SMTP_PASS=re_... SMTP_ADMIN_EMAIL=onboarding@resend.dev npm run live:smtp -- --templates` (adds branded confirmation/reset templates too).
4. **Let the test harness read the Resend API:** when I ask, enter the same key in the secure credential form for host `api.resend.com` (I never see it). Or run the tests on your machine with `RESEND_API_KEY=re_...`.
5. *(Production, later)* verify your sending domain in Resend (SPF/DKIM/DMARC) and use `no-reply@yourdomain`; `onboarding@resend.dev` is a sandbox sender and only delivers to the account owner and to Resend's test addresses.

## Run
```bash
npm run live:email:preflight            # shows what is still missing (works today)
npm run build:live
LIVE_EMAIL=1 npm run test:e2e:live      # runs the whole live UI suite including the email tests
```
Recipients are Resend's test addresses `delivered+<tag>@resend.dev`, which Resend accepts without a verified domain; no personal mailbox is used.

## What the email tests check
| Test | Verifies |
|---|---|
| Registration | the app shows the check-email page; a **real** confirmation email arrives (provider reports sent/delivered), from the configured sender, branded, containing no password; the link points at the project's `/auth/v1/verify` and an allow-listed callback; following it activates the account and lands signed in on the dashboard |
| Duplicate registration | same page, no account enumeration |
| Password reset (known account) | a real recovery email arrives; link opens `/reset-password`; a new strong password can be set |
| Password reset (unknown address) | identical UI message, **no email sent** |

## Also verify by hand once (cannot be automated)
- Gmail/Outlook/hospital mail systems: does the message land in the inbox rather than spam, and do links survive email security scanners (some scanners pre-click links; recovery/confirm links are single-use, so a scanner can consume them: if you see this, switch the templates to the token-hash pattern: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`, which our callback already supports).
- Arabic users: templates are English-only for now (Phase 2 item).
- Email size, links in RTL clients, plain-text fallback.

## Risks and limits to keep in mind
- Email bombing: mitigated by CAPTCHA on all three email-sending forms, Supabase's per-hour limits and our per-IP limits; keep the Supabase email limit low (30/hour in dev; set for production traffic deliberately).
- Bounces and complaints: Resend reports them; add monitoring before launch.
- Never email clinical content or personal health information; the templates deliberately say so.

## Interim plan (no domain yet): Supabase built-in sender

Decision: custom Resend SMTP is postponed until a verified domain exists (before public launch). For development we use the **built-in sender** with an **authorised organisation email address**, with email confirmation **kept enabled** (never disabled to bypass verification; the tool refuses to run if `mailer_autoconfirm` is not `false`).

Limits to respect: only organisation members' addresses receive mail; about **2 emails/hour** for the whole project; default (unbranded-sender) deliverability may land in spam; links redirect to the Site URL, which is not reachable from a cloud session.

Tests (`npm run live:email:builtin -- <mode>` with `EMAIL_TEST_ADDRESS` set; a local git-ignored ledger caps sends at 2/hour):
| Mode | What it proves | Who completes it |
|---|---|---|
| `signup` | Confirmation email is requested and sent for a new account | Person checks inbox and clicks the link |
| `verify` | Account becomes confirmed only after the link is used (checked via admin API) | Automated |
| `reset` | Password-reset email is delivered | Person checks inbox |
| `status` | Confirmation is required, SMTP is built-in, sends used this hour | Automated |

Not provable in this setup: completing the reset in the browser from the emailed link (it redirects to a site URL not reachable from the cloud session; that step is already covered by admin-generated-link live tests), deliverability at scale, branded sender/DKIM. All of these wait for the verified domain and production SMTP.

## Verified results (built-in Supabase sender, DEV project `icu-nursing-dev`, 2026-11-14)

Test mailbox: the authorised organisation mailbox supplied by the owner (address deliberately not recorded here). Real Cloudflare Turnstile was completed by a person in a local browser (`localhost`). Email confirmation stayed enabled throughout.

| Step | Result | Evidence | Verified by |
|---|---|---|---|
| Registration with real Turnstile | **Passed** | `auth.users` row created 18:58:03 UTC; provider `email`; matching `public.profiles` row exists | Independent SQL check |
| Confirmation email delivered | **Passed** | `confirmation_sent_at` 18:58:03; owner reports receiving the Supabase email | Database timestamp + owner report |
| Confirmation link works; confirmation is required | **Passed** | `email_confirmed_at` = 18:58:30 UTC (27 s after sending), populated only after the link was used | Independent SQL check (read-only) |
| Password-recovery email requested | **Passed** | `recovery_sent_at` = 19:00:08 UTC | Database timestamp |
| Password recovery delivered and completed | **Passed** | Owner confirmed the recovery email arrived and the password reset worked (real Turnstile completed in a local browser); `last_sign_in_at` 19:00:20 UTC is consistent with it | Owner report (not independently observable beyond the timestamps) |

Summary: registration, email confirmation and password recovery all work end to end with real Turnstile and the built-in sender on the DEV project.

Limits observed/known: built-in sender only reaches organisation members and allows about 2 emails per hour project-wide (both used in this run); messages come from Supabase's shared sender and may land in spam; branding, DKIM/SPF alignment and volume cannot be assessed until a verified domain and production SMTP exist. The earlier scripted attempt (no human token) was refused by CAPTCHA and sent nothing.
