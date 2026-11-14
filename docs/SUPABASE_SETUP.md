# Supabase setup (needs the product owner's approval before any cloud project is created)

No Supabase, Vercel or payment resources exist yet. This is the checklist for when you approve them.

1. **Create a new, independent Supabase project** (not shared with any other product). Note the project URL and the *anon/publishable* key. **Do not copy the service-role key into this app or into Vercel**: the app never uses it.
2. **Apply the schema**: `supabase link --project-ref <ref> && supabase db push` (runs `supabase/migrations/0001…0003` in order). Do **not** apply `supabase/seed.sql` to a production clinical database (demo content, development only).
3. **Auth settings** (Dashboard → Authentication): confirm email required; minimum password length 12; enable leaked-password protection and CAPTCHA; enable TOTP MFA; set *Site URL* and add `<site>/auth/callback` to the redirect allow-list; customise email templates; review rate limits.
4. **Storage**: create a public bucket named `topic-images` (read-only for the API; uploads by project owners/staff). The CMS records each image's path, alt text and licence.
5. **Bootstrap the first administrator** (see `docs/SECURITY.md`), then grant roles from `/admin/users`. Staff must enrol in MFA at `/mfa`.
6. **Vercel**: create a new project; set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public values). No secrets are required by the app.
7. **Before launch**: backups/PITR enabled and a restore drill performed; error monitoring configured; privacy policy and terms published; security review of CSP (`docs/SECURITY.md`).

Supabase's "Security Definer View" advisor will flag `public_topics` and `public_domains`. That is intentional: they are the only public read surface and expose approved, published snapshots only (`tests/db/content.test.ts`, `tests/db/surface.test.ts`).
