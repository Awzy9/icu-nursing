# Mobile architecture audit (Phase 10)

Nothing here submits, publishes or deploys an app, and the prototype and its package identifier were not changed.

## 1. What the Expo prototype contains
* `mobile/`: Expo SDK 58 (React Native 0.88, React 19) TypeScript app. Dependencies: only `expo`, `expo-status-bar`, `react`, `react-native`.
* Two source files: `App.tsx` (70 lines: a permanent "prototype, nonclinical" banner, a list of three fictional equipment samples, a tap-to-explore parts view with a viewed counter, light/dark mode) and `src/samples.ts` (three synthetic modules).
* **No networking, no authentication, no Supabase client, no storage, no analytics, no permissions.** Its state is in memory and is lost on restart. It does not call the Next.js site and shares no code with it (the root `tsconfig` and ESLint exclude `mobile/`).
* Config: Android only (`platforms: ["android"]`, the iOS block was removed during scaffolding); `eas.json` has `preview` (APK) and `production` (AAB, auto-increment) profiles; the EAS project `icu-knowledge-map-prototype` exists under the account `awzy9s-team`; one production AAB was built (version 0.1.0, versionCode 2 remote). The signing keystore is held by Expo.
* Defaults left from the scaffold: Expo icon and splash images, `mobile/AGENTS.md` and `mobile/.claude/settings.json` (Claude/Expo tooling files; harmless but not app code and could be removed).

## 2. Package identifier
`com.criticalcarenursing.myapp` was set on the owner's explicit instruction (first `com.icunursing.myapp`, then corrected to this value). It is therefore intentional, and it was not changed. Points for the owner to confirm: it does not contain the product name "ICU Nurse Knowledge Map" and uses a brand/domain (`criticalcarenursing`) that the owner should control (reverse-domain convention; Play does not verify the domain, but a mismatch with the developer website and privacy policy URL invites questions); and Google Play locks the identifier after the first upload. iOS would need its own bundle identifier (not set); using the same string is conventional.

## 3. What can be reused securely from the website
| Asset | Reusable? | How and caveats |
|---|---|---|
| Supabase database, RLS, `SECURITY DEFINER` RPCs (`qb_`, `st_`, `cs_`, `sk_`, `md_`, `eq_`) | **Yes, directly** | A native client calls the same RPCs with the public anon key and the learner's JWT. All ownership, content-gate and fixture-isolation rules live in Postgres, so they apply unchanged. The service-role key must never be in the app. |
| Auth | Yes, with work | Supabase Auth with `@supabase/supabase-js` and `expo-secure-store` for tokens. The project enforces Cloudflare Turnstile on sign-in and sign-up: a native app needs a Turnstile challenge (WebView-hosted widget) or another approved path; the real Turnstile configuration must not be weakened. Email-link flows need deep links (`scheme`, intent filters, universal/app links). Staff MFA/admin stays web-only. |
| zod schemas and types (`src/lib/*/types.ts`) | Yes | Extract to a shared package (or workspace) so web and mobile validate the same RPC payloads. Currently they sit in the Next.js `src` tree. |
| UI components | No | The web UI is Tailwind/Radix/Next; React Native needs its own components. Design tokens and copy can be shared. |
| i18n messages (`src/messages/en.json`, `ar.json`) | Yes, partly | JSON strings can be reused; RTL needs `I18nManager`, mirrored layouts and a font/shaping check. |
| Server actions, rate limiting, fixture cookie | No | These are Next.js server concerns. Mobile would rely on database limits (existing ceilings) and Supabase auth rate limits; consider an API gateway only if business logic must run server-side. |
| Content | **No** | No unreviewed clinical draft may be shipped in a bundle or fetched. Synthetic fixtures only, until clinical review and publication gates are satisfied for real content. |
| Equipment diagram component | Rewrite | SVG schematics port to `react-native-svg`; the data model (parts, parameters, safety) is reusable. |

## 4. Work required for a future Android and iOS application
1. **Decide the architecture.** Recommended: a single Expo (React Native) app using Supabase directly, sharing schemas and messages through a small shared package. A WebView wrapper of the website is not recommended (see section 5).
2. **Foundation:** navigation (Expo Router), secure session storage, deep links, error and offline states, theming/RTL, accessibility labels and 48dp targets, crash and privacy-respecting diagnostics decisions.
3. **Auth and CAPTCHA** path agreed with the owner; account deletion in-app plus a web page (both stores require it when accounts can be created).
4. **Feature ports** in order: sign-in, learning hub, question bank, study mode, cases, skills, medications, equipment, bookmarks, with the same content gates (the RPCs already refuse to show clinical content that has not passed review).
5. **Release engineering:** EAS Build for both platforms, separate staging and production Supabase projects via EAS environment variables, EAS Update policy, version/codes, signing key backup, CI job for lint/typecheck/tests of `mobile/`, device test matrix.
6. **iOS specifics:** Apple Developer Program membership (a paid annual service; not purchased or requested here), bundle identifier, App Store Connect record, privacy nutrition labels, privacy manifest entries for required-reason APIs, TestFlight, `ios` block in `app.json` (currently removed), Sign in with Apple only if third-party social sign-in is added.
7. **Store assets:** real icon, splash, screenshots, feature graphic, store listing text in English and Arabic, privacy policy URL, support contact, content rating, data-safety form.

## 5. Will native functionality be enough for app-store review?
* **The current prototype alone: not for a public release.** It is a three-item static sample with no accounts, no real content, and a banner saying it is for testing. Apple's minimum-functionality rule (4.2) and Google's low-quality/minimum-functionality expectations make a public submission of it likely to be rejected; it is only suitable for a Play internal/closed test, which is what it was built for.
* **A WebView wrapper of the website:** high rejection risk on iOS (4.2) and weak value on Android; also bypasses native secure storage and complicates the Turnstile and CSP setup. Not recommended.
* **A real native client** with sign-in, saved progress, question bank, cases and skills, offline-tolerant behaviour and accessibility is substantive enough, provided the following are in place:
  * **Health and medical content policies** (Apple 1.4.1 and 5.1.3, Google "health content and services"): content must be accurate, sourced and not marketed as diagnosing or treating; medical-reference apps are scrutinised. Because all current clinical material is unreviewed AI-assisted drafts, it **cannot** be shipped; a public app today would contain only synthetic samples. Educational positioning, visible evidence/licensing labels, a clear "not a substitute for local policy or clinical judgement" statement and a named responsible clinical owner will matter once real content is approved.
  * **Account and privacy requirements:** privacy policy, data-safety/privacy labels matching actual collection (email, progress, bookmarks), in-app account deletion, minimal permissions, secure transport.
  * **Intellectual property:** licensed sources (RED/YELLOW register entries) must be cleared before reproduction; no manufacturer screens or alarm tables.
  * **Developer account requirements:** Google's current testing requirement for new personal accounts (closed test with a minimum number of testers for a set period) and identity verification; Apple's paid membership.
  * **Targeting and age rating:** adults/professionals; set the rating accordingly.

## 6. Recommendations
* Keep the current AAB for the closed-test requirement only; do not promote it to production.
* Owner decisions needed before any mobile build work: the package/bundle identifiers and developer-account entity, the Turnstile approach for native sign-in, whether iOS is in scope (and the Apple Developer cost), and who is the responsible clinical owner for medical-content disclosures.
* Remove scaffold tooling files (`mobile/AGENTS.md`, `mobile/.claude/`) only with the owner's approval, since the prototype was asked not to be altered.
