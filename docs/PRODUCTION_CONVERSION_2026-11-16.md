# ICU Nursing production conversion — 16 November 2026

Owner authorized converting the existing `dvmevjomyaqrojsiffnf` Supabase project instead of creating another project. The other ICU Knowledge Map database was not changed.

Completed:
- Preserved the existing account and database records; no reset, deletion or test seed executed.
- Applied existing migrations 0015 equipment learning, 0016 draft workspace, 0017 account deletion, 0018 subscriptions, 0019 AI evidence review and 0020 tutor usage via Supabase migration tools.
- Set app_settings.environment=production, question_fixtures_visible=false, mock_payments_enabled=false. Kept staff MFA and distinct-reviewer requirements enabled.
- Verified zero public tables without RLS.
- Saved Vercel production connection variables for project `prj_J2rv5kVPQxEmFqpahGJWHs5O0HUZ`, canonical URL https://icu-nursing.vercel.app, production app environment, existing publishable key and existing public Turnstile site key. No service-role key is used by the application. Billing is off.
- Disabled the legacy hosted development tooling before it could run tests/reset/seed/configuration against the converted production project. Isolated loopback CI remains available.

Pending before live-account release:
- Supabase dashboard sign-in currently requires the owner's CAPTCHA completion. Set Auth site URL and callback allow-list to the production URL; inspect current email/security settings without replacing existing secrets.
- Verify Turnstile permits the production hostname. The configured public site key is the existing owner-created key; its secret remains in Supabase.
- Configure and verify custom SMTP and sender domain for general-public registration/recovery.
- Redeploy Vercel after Auth and CAPTCHA are correctly paired, and verify production-mode health and positive/negative authentication flows.
- Inspect production backups and remaining advisor findings. Existing public views and authorized RPCs were deliberately designed as definers; do not change them blindly based on generic lints.
- No payment provider is integrated in ICU Nursing; billing remains off. This is separate from ICU Knowledge Map's RevenueCat integration.
- Published-topic and published-clinical-question counts are currently zero. The 16 synthetic questions remain stored but are hidden in production. Drafts were not granted clinical approval or published by this conversion.

The project may still be named icu-nursing-dev in the dashboard; its database environment is now production. The Vercel release is not yet declared fully ready. The previous demo deployment remains active until redeployment.
