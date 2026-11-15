# Phase 13 - native app status, authentication design, iOS readiness

## Staging (Vercel)
`staging` = `b1e69002b67e22ec7429c19e1bff250979b50209` (history-preserving merge of the verified Phase 12 commit `01d60ee` into `253ab79`; tree identical to dev; `npm ci`; repaired lockfile kept).
Deployment `dpl_8ENgV7kv4HfmvnA5FnXnpmMk9rqi` READY. Preview: https://icu-nursing-preview-git-staging-fawwaz5381-8944s-projects.vercel.app (Vercel Authentication on). Demo mode: no Supabase credentials, synthetic content only. Account deletion is NOT claimed to work on the preview (no backend); it is proven in isolated Supabase CI.

## Native app (`mobile/`, package `com.criticalcarenursing.myapp`, unchanged)
Expo SDK 58 / React Native 0.88, Expo Router (4 tabs + stack), design system (AA contrast, 48dp targets), English/Arabic with RTL, learning screens on synthetic data (hub, question practice, cases, skills, medications, equipment diagrams, bookmarks and progress). The original prototype is kept at `/prototype`. `@icu/schemas` and `@icu/fixtures` resolve through Metro `extraNodeModules` and tsconfig paths. Not a WebView wrapper: the only WebView is the CAPTCHA bridge.

## Authentication design
- **Client**: one supabase-js client, PKCE, `autoRefreshToken: false`, `detectSessionInUrl: false`. Public anon key and URLs only; the config validator refuses a service-role key and plain-http hosts (except local dev addresses). With no configuration the app runs offline on samples.
- **Token storage**: `expo-secure-store` (Keychain / Keystore-backed) through a chunking adapter (values > 2 KB are split; torn writes read as "no session"; shrink/remove leave no stale chunks).
- **CAPTCHA**: unchanged server-side enforcement. Turnstile is solved on `/{locale}/mobile-captcha` (bare page, noindex, no site chrome) inside a restricted WebView (navigation allow-list, incognito, no file access). The page posts `{type:"icu.turnstile", v:1, token}`; the app accepts it only from the site's own origin with the exact shape. Tokens are single use; the form requests a fresh one after every attempt.
- **Session lifecycle**: refresh only when the app is foregrounded and within 120 s of expiry; a revoked refresh token wipes local state; sign-out is global (revokes other devices) and clears the device.
- **Callbacks**: only `icuknowledgemap://auth/callback` and `https://<site>/auth/callback` with a bounded `code` and a type from a fixed list; everything else is ignored.
- **Account deletion** (screen `delete-account`): shown only when signed in; recent-sign-in check (JWT `amr`), typed email confirmation, MFA message, immediate and permanent, privacy and backup-retention explanation, no grace period. Server enforces recency, aal2 when a factor exists, own account only; the device is wiped afterwards.

## Verification
- Root: lint, tsc, 439 unit tests, 299 DB/RLS tests, 328 e2e (incl. `/mobile-captcha` in en/ar on three viewports) green locally.
- Mobile: tsc, Android and iOS exports, bundle scan (no drafts, no service-role string, no draft index) clean; 31 mobile unit tests (storage, config, captcha bridge, callbacks, session lifecycle, RPC contracts).
- Isolated Supabase CI (`tests/live/mobile-auth.live.test.ts`, 6 tests): CAPTCHA still required server-side; sign-in with a token; chunks fit a 2 KB secure store; restore after restart; foreground refresh; revoked session ends; global sign-out; RPC contracts against shared schemas; cross-user isolation; published-content gate (fixtures hidden => empty); account deletion with email mismatch, MFA aal2 enforcement, session wipe, other user untouched.
- Found and fixed: `ci.yml` had been invalid YAML since the mobile step was added (a colon in the step name), so the CI workflow silently did not run on `eed6ab5` and `add2f24`.

## iOS readiness (not built; no Apple account in use)
Done: bundle exports for iOS pass; no Android-only APIs; secure storage via Keychain. Needed from the owner: Apple Developer Program account (paid; not purchased), a bundle identifier decision (proposed `com.criticalcarenursing.myapp`), EAS iOS credentials, App Privacy answers and privacy manifest (no tracking, no analytics), associated-domains / apple-app-site-association file on the production domain for https callbacks, TestFlight setup. Android: App Links `assetlinks.json` likewise needs the production domain and Play signing fingerprint.

## Remaining gaps
- Sync of bookmarks/progress for signed-in users via the `eq_*`/`cs_*`/`sk_*` RPCs is implemented in the client (`mobile/src/api/rpc.ts`) and live-tested, but screens still read device-local progress; wiring them to the server is the next increment.
- Question-bank study modes on the server (`qb_*` RPCs) are not yet in the native app (local engine only).
- No emulator/device run in this environment; the Android build of the evolved app (versionCode 5) has not been made. Builds v3/v4 contain the earlier prototype/foundation.
- Sign-up and MFA enrolment screens are not in the app (sign-in, reset and sign-out only).
- Real clinical content, reviewer recruitment and the AI assistant remain postponed.
