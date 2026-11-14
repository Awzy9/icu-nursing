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
- CSP uses `'unsafe-inline'` for scripts because Next.js injects inline bootstrap scripts; move to nonce-based CSP before production hardening.
- App-level rate limiting is best-effort (per instance). Rely on Supabase Auth limits and the hosting firewall/WAF for production.
- Email confirmation, password reset and MFA flows are implemented against Supabase Auth APIs but were **not run end-to-end against a live Supabase project** in this session (no project exists; creating one needs your approval). Database behaviour is covered by tests on real PostgreSQL.
- Review Supabase dashboard settings before launch: enable email confirmations, CAPTCHA, leaked-password protection, and set the site URL / redirect allow-list.
