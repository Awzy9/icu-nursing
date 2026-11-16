# Mobile integration architecture (iOS and Android), Phase 11

Status: design only. Nothing was published, submitted or deployed, the existing Expo prototype was not modified, and the Android package identifier is unchanged: `com.criticalcarenursing.myapp` (the value at repository HEAD and in the owner's new Play Console form; an earlier commit briefly used a capital C to match a Play app that has since been deleted). Any change needs the owner's approval.

## 1. Decisions
| Topic | Decision | Why |
|---|---|---|
| App type | One native Expo (React Native) app for iOS and Android, evolved from `mobile/` | Reuses the prototype and EAS project; a WebView of the website is excluded (store-review risk, no native session security, Turnstile/CSP complications) |
| Backend | The existing Supabase project, called directly with the public anon key and the learner's JWT | All authorization, content gates and fixture isolation live in Postgres (RLS and `SECURITY DEFINER` RPCs), so the app inherits them unchanged. The service-role key never enters the app |
| Shared code | A workspace package `packages/schemas` holding the zod schemas and TypeScript types, consumed by web and mobile | The type files (`question-bank`, `study`, `cases`, `skills`, `medications`, `equipment/state`, `content`) depend only on `zod` and on each other, with no Next or server imports (checked in Phase 11), so they move without rewriting |
| Content | Synthetic fixtures only until clinical review and publication gates are satisfied | Restriction carried over from every phase; the RPCs already hide anything not published |
| Distribution | EAS Build per platform; Play closed test already prepared; TestFlight only after the owner approves Apple membership | Costs and store submissions need explicit approval |

## 2. Repository layout (target; not yet applied)
```
/                      Next.js website (unchanged)
packages/schemas/      zod schemas + types (moved from src/lib/*/types.ts, re-exported so web imports keep working)
packages/i18n/         en.json / ar.json message files shared by both apps
mobile/                Expo app (existing)
  app/                 Expo Router routes
  src/api/             supabase client, RPC wrappers (one function per RPC, parsed with packages/schemas)
  src/auth/            session store, CAPTCHA bridge, deep-link handlers
  src/offline/         cache + write queue
  src/ui/              native components (no web UI reuse)
```
Migration steps (each a small, tested commit): (1) add npm workspaces and move the schema files with re-export shims; (2) point `tsconfig` paths and Metro `watchFolders`/`resolver.nodeModulesPaths` at `packages/`; (3) add a CI job that type-checks and unit-tests `packages/schemas` and `mobile/`; (4) only then add features to the app.

## 3. Reuse of Supabase RPCs and RLS
The app calls the same functions as the web: `qb_*` (question bank), `st_*` (study), `cs_*` (cases), `sk_*` (skills), `md_*` (medications), `eq_*` (equipment), plus `record_topic_view`, `set_topic_completion` and the published-topic read paths. Rules:
* One typed wrapper per RPC; every response is parsed with the shared zod schema, so a server change that breaks the contract fails loudly in tests.
* The web's Next.js server actions (rate limits, fixture cookie) have no mobile equivalent. The database ceilings already protect against abuse (attempt limits, bookmark limits, 40 draft-note changes/hour); Supabase Auth rate limits cover sign-in. If a route needs server-only logic later, expose it as a Supabase Edge Function, not by embedding secrets in the app.
* Staff functions (`adm_*`, admin topics, MFA flows) stay web-only. The mobile build contains no staff UI.
* Fixture mode (cookie identity) does not exist on mobile. Development uses a development Supabase project with fixtures switched on; production behaviour is identical code with fixtures off.

## 4. Native navigation
Expo Router (file-based, on React Navigation): tabs for Learn, Practice (question bank, study, cases), Skills and Equipment, Library, and Account; stack screens for details; modal for the case runner. Requirements: screen titles and header buttons labelled, focus moved to the screen heading on navigation, hardware back handled, bottom-tab touch targets at least 48 dp, dynamic type respected, RTL layout via `I18nManager.forceRTL` with a restart prompt when the language changes (Arabic), and no content-bearing navigation state in URLs that would reveal unpublished item ids.

## 5. Secure session handling
* `@supabase/supabase-js` with `persistSession` and a custom storage adapter. Tokens are never in AsyncStorage in plain text. Use the pattern of an AES key held in `expo-secure-store` (Keychain / Keystore) encrypting the session blob kept in a file or MMKV, because SecureStore values are size-limited.
* `autoRefreshToken` tied to `AppState` (start when active, stop when backgrounded); sign-out clears the secure store and the offline cache.
* Optional biometric unlock (`expo-local-authentication`) as a local gate over a stored refresh token, never replacing server authentication.
* No secrets in the bundle: only `EXPO_PUBLIC_SUPABASE_URL`, the anon key and the Turnstile site key are public. Separate dev/staging/production values through EAS environment variables.
* Transport: HTTPS only; certificate pinning is optional and adds operational risk, so it is deferred. Android `allowBackup="false"`; iOS data protection class default; screenshots/app-switcher blur for learner data is optional.
* Staff roles require MFA (aal2) server-side; the mobile app does not need to enrol or verify staff TOTP because staff functions are not exposed in it.

## 6. Authentication and CAPTCHA compatibility
The project requires Cloudflare Turnstile on sign-in and sign-up (Supabase Auth CAPTCHA protection). That configuration must not be weakened. Native options, in order of preference:
1. **WebView bridge (recommended):** a tiny website page (for example `/m/captcha`, nothing else on it) renders the Turnstile widget for the production site key and posts the token to the app with `window.ReactNativeWebView.postMessage`. The app then calls `supabase.auth.signInWithPassword({ email, password, options: { captchaToken } })`. The page needs: the site's hostname on the Turnstile widget, a CSP that allows only Cloudflare's challenge origin, no cookies, and a strict `postMessage` origin check. Use Cloudflare's always-pass test keys in development and CI.
2. **System-browser sign-in** (`expo-auth-session` / `expo-web-browser`) that completes on the website and returns through a deep link. Safer against token interception but a heavier experience.
3. Any non-CAPTCHA path (for example magic links without CAPTCHA) would change the security configuration and needs the owner's decision first.
Email confirmation and password-reset links use `/auth/callback`; on mobile they must open the app (see section 7). Native third-party sign-in is not planned; if it is added later on iOS, Sign in with Apple becomes mandatory.

## 7. Deep links
* Custom scheme `icuknowledgemap://` for development and as a fallback; verified HTTPS links (Android App Links via `/.well-known/assetlinks.json`, iOS Universal Links via `/.well-known/apple-app-site-association`) for production, served by the website with the app's signing certificate fingerprint and team id (these require the final Play signing key and, for iOS, an Apple team: both pending owner decisions).
* Supabase Auth: add the app redirect URLs to the Redirect URLs allow-list; `emailRedirectTo` and `redirectTo` become the HTTPS link that opens the app, with the website as fallback when the app is not installed.
* Handler validation: accept only known paths (`/auth/callback`, `/reset-password`, `/learn/<slug>`, `/cases/<id>` ...), parse parameters with zod, never navigate to a path derived directly from an untrusted link without a route allow-list, and require a signed-in session for protected routes.

## 8. Offline-capable educational interfaces (synthetic content first)
* **What works offline:** screens that render cached, already-downloaded published content and the learner's own recent state: synthetic equipment modules (diagram and explanations), skill checklists and case content that were opened or explicitly downloaded, and bookmarks.
* **Architecture:** TanStack Query with a persisted cache (MMKV or SQLite) keyed by content id and version; a content manifest call returns versions so stale items are replaced; eviction on sign-out and when an item is retired. Downloaded packages are signed by the server's response schema, not by trust in the device.
* **Offline writes:** bookmark, viewed-part and checklist marks go to an outbox and replay when online. This fits the database: `eq_set_bookmark`, `eq_mark_viewed`, `qb_set_bookmark`, `sk_mark` are idempotent or last-write-wins, and server ceilings still apply on replay.
* **What must not be offline:** answer keys, unreleased steps of a case, or any unpublished draft. Case and question engines keep secrets server-side by design (`cs_get`, `qb_get_attempt` reveal only after a choice), so scoring stays online. The first offline release is limited to synthetic nonclinical fixtures, with a visible "sample content" label.
* **Security of the cache:** encrypted at rest with the same key mechanism as the session; cleared on account deletion.

## 9. Account deletion and privacy requirements
Both stores require an in-app route to delete the account (and a web URL for Google Play), and an accurate privacy policy and data-safety declaration.
* **Gap found:** the website has no learner account-deletion feature today. It must be built first, once, for both clients: a confirmed, re-authenticated action that calls a `SECURITY DEFINER` function (or Edge Function with a narrowly scoped role) deleting the `auth.users` row. Existing foreign keys already cascade learner data (bookmarks, attempts, progress, `equipment_*`, skills sessions); staff-authored records use `ON DELETE SET NULL` where history must survive (as in the Phase 11 draft-notes tables). Needs: a tested migration, an e2e flow, a public web page describing deletion, retention of audit records without personal data, and a rule for the last administrator.
* **Data inventory** (email, display name, locale, progress, bookmarks, attempts, saved notes, device-independent): no patient data is ever collected; no advertising identifiers; no third-party analytics until the owner decides. Declare exactly this in Play Data safety and Apple privacy labels.
* Privacy policy URL, support contact, age rating (professional audience), content disclaimers ("education, not clinical decision support; follow local policy"), and a named responsible owner are store prerequisites.

## 10. Native functionality and review readiness
A store-ready app needs real native value beyond the prototype: authenticated learning, saved progress, offline sample study, accessible interactive diagrams and case play. The health-content rules mean no unreviewed clinical content ships; until clinical review completes, a public listing would contain only synthetic samples and is not recommended. Internal and closed testing (Play) and TestFlight (after approval) are the appropriate channels meanwhile.

## 11. Delivery plan and acceptance tests
| Phase | Work | Acceptance |
|---|---|---|
| M0 | Workspaces, shared schemas, CI for `mobile/` | Web tests unchanged; schema package type-checks in both apps |
| M1 | Web account-deletion feature (prerequisite) | DB and e2e tests; policy page live |
| M2 | Auth shell: secure session, CAPTCHA WebView bridge, deep links | Sign-in/up/reset on a device against the isolated Supabase stack with the Turnstile test key; link allow-list unit tests |
| M3 | Equipment and skills (synthetic), bookmarks/progress via RPCs, offline cache and outbox | Airplane-mode test; replay test; RTL screenshot test; accessibility audit (TalkBack, VoiceOver) |
| M4 | Question bank, study, cases | Same secrecy tests as the web (no keys before commit); resume after app restart |
| M5 | Release engineering | EAS profiles per environment, signing keys backed up, store listing assets; closed-test release only |

## 12. Owner decisions required before implementation
1. Confirm the Android package id (current: `com.criticalcarenursing.myapp`) and the Apple bundle id; confirm the developer-account owner for each store.
2. Approve the WebView-bridge CAPTCHA approach (or choose another).
3. Decide whether iOS is in scope now, which involves Apple Developer Program membership (a paid annual service; not purchased).
4. Approve building the account-deletion feature as the first work item.
5. Confirm the privacy/analytics stance (default: none).
