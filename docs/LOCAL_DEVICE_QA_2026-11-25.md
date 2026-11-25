# Local physical-device QA — no extra Supabase subscription

Candidate: 8808a616bebedcd4334cd435985ed113e04fbda3 (all four workflows green). Release checklist: #116. Production release blocker: #114.

Hosted project creation was refused by the Supabase free-plan active-project limit. Do not pause, delete or repurpose the two existing active projects. Use a disposable local stack on a tester-controlled workstation. These are setup instructions, not evidence that a workstation, VPN, or physical device has been configured.

## 1. Prepare an isolated workstation

- Clone a separate checkout of the candidate branch; never use an existing production-linked directory or copy its .env.local.
- Install Docker, a supported Node runtime and Supabase CLI. The local CI candidate was tested with CLI v2.118.0; check `supabase --version` and the relevant command help. Install dependencies with `npm ci` and `npm run mobile:install`.
- Check `supabase/config.toml`: project_id identifies a local Docker stack, not a hosted ref. Do not run supabase link, db push, hosted live helpers or any hosted management API commands.
- Restrict the workstation firewall to localhost and authorized private test devices. Local Supabase credentials are development credentials and must never be exposed to the public internet.
- In the disposable checkout only, set the auth site URL to the private QA website origin and add exact allowed redirects for `nursingmasteryqa://auth/callback` and `nursingmasteryqa://auth/callback?type=recovery`. Keep email confirmations enabled. Set up a separate genuine Turnstile widget/secret restricted to the QA hostname; configure local auth CAPTCHA with its secret from the environment, not in git. Cloudflare always-pass CI secrets must stay within the loopback-only CI harness; do not extend its allow-list or use those secrets for this device environment.
- Start the stack with `supabase start` and check `supabase status` locally. Confirm migrations include `20261125070000_working_progress_replay_safety`; confirm only synthetic user accounts and data exist. Never upload a production database dump.
- Use the local publishable key (sb_publishable_ prefix). Do not substitute a secret key or legacy JWT to bypass the app's key/bundle guard. If the installed CLI does not supply a publishable key, stop and resolve CLI compatibility first.

## 2. Private HTTPS connectivity

The app intentionally rejects arbitrary cleartext URLs. Use a private network with trusted HTTPS reverse proxies, not a public tunnel. One possible option is Tailscale Serve on an authorized private tailnet with TLS, if available within the tester's existing plan. Use separate HTTPS origins/ports for local API (54321) and website (3100). Restrict proxy access to the tester devices and the minimum necessary paths; do not publish Supabase Studio, Mailpit, database ports or admin endpoints. Local API gateway defaults may expose other services; verify route restrictions before admitting a device. Do not use Tailscale Funnel or other public-sharing features. Set Supabase Auth's external API URL correctly for confirmation links, and verify links can be used on the device without exposing Mailpit. Check installed CLI configuration documentation for the applicable fields.

Website .env.local in the disposable checkout (replace placeholders only after private HTTPS is operational):

```
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SITE_URL=https://<private-qa-site>
NEXT_PUBLIC_SUPABASE_URL=https://<private-qa-api>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-publishable-key>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<separate-qa-site-key>
CONTENT_EDITION=working
```

Run `npm run build:working-content` then `npm run dev -- --hostname 127.0.0.1 --port 3100`. This working catalog contains unapproved educational drafts. Keep the website private, retain draft labels, and never change production publication flags. Confirm mobile CAPTCHA, catalog API, sign-in, and email confirmation through the private network before installing a build. Access Mailpit only from the workstation. Inspect external URL handling, RLS and grants. No live user information should be used.

## 3. Build the QA app

Use the tested isolated-replay profile with the following public values and matching build-time approved origins (use a separate QA build environment; do not overwrite shared Expo preview or production variables):

```
APP_VARIANT=isolated-replay
EXPO_PUBLIC_PROGRESS_REPLAY=true
EXPO_PUBLIC_SUPABASE_URL=https://<private-qa-api>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
EXPO_PUBLIC_SITE_URL=https://<private-qa-site>
ISOLATED_REPLAY_SUPABASE_URL=https://<private-qa-api>
ISOLATED_REPLAY_SITE_URL=https://<private-qa-site>
```

Verify `npx expo config --type public --json` in mobile/ reports Nursing Mastery QA, com.nursingmastery.app.qa on both platforms, nursingmasteryqa scheme and updates.enabled=false. Do not publish via EAS Update. Android can be built locally with the Android toolchain or an approved EAS internal build. iOS requires macOS/Xcode with provisioning or an approved EAS internal build with registered device and signing. Do not use production submission. Cloud build quotas and any VPN/certificate costs are not included in the Supabase free-project quote; confirm before using paid resources.

## 4. Record results

Follow #116 on both devices. Keep the computer and private network available during reconnect tests. The cloud CI runs are evidence of JS export and isolated integration, not physical-device acceptance. Record exact commit, device build and OS, test results and sanitized failures. Stop the private proxy and local services when finished. Do not deploy or merge to production merely because local tests pass.

Reference documentation:
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/local-development/cli/config
- https://tailscale.com/docs/features/tailscale-serve
