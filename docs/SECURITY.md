# Security model

## Principles
- **Default deny.** RLS is enabled on every table; privileges for `anon`/`authenticated` are revoked by default and granted explicitly per table/column/function (see each migration).
- **No service-role key in the application.** Privileged actions are `SECURITY DEFINER` functions that check the caller's role (and MFA) themselves. `eslint` forbids referencing the service-role key name in app code, and `src/lib/env.ts` does not accept it.
- **Authorization lives in the database.** The UI hides what you may not do, but the database refuses it.
- **Staff must use MFA.** Staff roles count as active only when the session JWT has `aal = aal2` (`has_staff_role`). The app additionally redirects staff to `/mfa`. Controlled by `app_settings.require_staff_mfa` (default true).
- **Append-only audit log.** Role changes, content edits and every workflow transition are recorded with the actor; UPDATE/DELETE/TRUNCATE on `audit_log` raise an error even for the owner.

## Bootstrapping the first administrator (one-off, by a database owner)
No one is an administrator initially. After the first admin signs up and confirms their email, run in the Supabase SQL editor (as the project owner):

```sql
insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'you@example.org';
```
Further roles are granted from `/admin/users` (administrators with MFA only).

## Known limitations / follow-ups
- **CSP**: per-request nonce + `strict-dynamic`; no `'unsafe-inline'` for scripts (verified by e2e: no violations, every inline script carries the nonce). Network access is limited to the configured Supabase project host. Styles still allow inline attributes (used for progress bars).
- **Rate limiting** is layered: Supabase Auth limits (configured via `scripts/live/configure-auth.ts`; the built-in mailer allows 2 emails/hour), best-effort per-instance limits on sign-in/sign-up/reset (8/5/5 per minute per IP), staff actions (120/min) and uploads (20/min). Add a platform WAF/rate limit at deployment because serverless instances do not share memory.
- Auth, MFA, password-reset and the whole workflow **were exercised against the live dev project** (see `docs/LIVE_INTEGRATION_REPORT.md`). Real email *delivery* was not (built-in SMTP limits; custom SMTP needed).
- Review Supabase dashboard settings before launch: enable email confirmations, CAPTCHA, leaked-password protection, and set the site URL / redirect allow-list.

## Dependency audit (2026-11-14)
- `npm audit --omit=dev` (what ships to users): **0 vulnerabilities**. Next.js 15.5.29 bundles PostCSS 8.4.31, which has advisories; `package.json` overrides it to a patched PostCSS (`^8.5.33`). Re-check when upgrading Next.
- Test runner upgraded to Vitest 5 to clear a critical advisory in its worker pool (`tinypool`).
- Remaining: **6 moderate advisories in development-only tooling** (typescript-eslint → `minimatch` ReDoS). They are not shipped and cannot be reached by users; `npm audit fix --force` would downgrade ESLint tooling, so they are tracked rather than forced.
- CI should run `npm audit --omit=dev --audit-level=high` (added to the workflow).

## Live findings (2026-11-14)
See `docs/LIVE_INTEGRATION_REPORT.md` for the full list. Highlights: helper functions moved to a non-exposed `private` schema (RPC surface is exactly 15 intentional functions, none for `anon`); advisors went from 33 to 17 security findings (the remainder are the two intentional definer views and the 15 role-checked RPCs); publishers now see reviewer profiles; staff MFA gating uses verified claims; forms keep input on server errors; client bundle contains no secret key material; the secret key is never used by the app (test harness only, in memory).

## Image uploads
Bucket `topic-images`: public read, 2 MB, PNG/JPEG/WebP only (SVG/GIF refused). The app validates the **file signature** (not the browser-declared type), stores under `<topic_id>/<random-uuid>.<ext>`, records licence + alt text, and deletes the file if metadata insertion fails. Storage write policies reuse the topic's edit rule (author with MFA while draft, or admin); uploads freeze while a topic is in review. The database also refuses metadata whose path is not inside the topic's own folder.
