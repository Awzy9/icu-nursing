# Critical Care Nursing (native app)

Native iOS/Android companion to the ICU Nursing website (https://icu-nursing.vercel.app). It reads the same real, published learner-facing catalog as the website (topics, skills, medications, equipment, clinical scenarios, question bank) through the content API in `src/app/api/content/*`, not hardcoded content. Bookmarks, checklist ticks, quiz/case progress and resume state are stored on-device; sign-in uses the website's existing Supabase auth.

The original, deliberately-tiny prototype (fictional harbour/bakery/ferry equipment samples) has been removed from the shipped app. Those fixtures (`packages/fixtures/`) are kept for the automated test suite only - `core/content.ts` is never imported from `app/`, enforced by a guard test, and the bundle-leak scanner (`scripts/check-mobile-bundle.ts`) fails the build if any of that sample text reaches a release bundle.

## Before the first upload (these cannot easily be changed later)
* `app.json` -> `android.package` is `com.nursingmastery.app` (matching iOS `bundleIdentifier`). Play locks the package name once the first build is uploaded, so it cannot be changed afterwards.
* The store listing name, icon (`assets/`) and privacy policy URL are set separately in App Store Connect / Google Play Console - changing `app.json`'s `name` only changes the installed app's home-screen label, not the store listing.

## Run it
```
cd mobile && npm install
npx expo start        # scan the QR code with Expo Go
```

## Build
```
npm i -g eas-cli && eas login
eas build -p android --profile preview      # installable APK
eas build -p android --profile production   # .aab for Google Play
eas build -p ios --profile preview           # iOS Simulator build, no Apple Developer account needed
eas build -p ios --profile production         # needs an enrolled Apple Developer account for TestFlight/App Store signing
eas submit -p ios --latest                    # upload the most recent iOS build to TestFlight
```
`production` auto-increments `versionCode`. First upload to Play must be done through the Play Console (Internal or Closed testing track); EAS can submit later with a Play service-account key (`eas submit -p android`).

## The 14 days
Google's closed-testing requirement for new personal developer accounts (at least 12 testers opted in for 14 continuous days) starts when testers join a **Closed testing** track release, not Internal testing. Internal testing is for up to 100 quick testers and does not count toward that requirement. Check the current rules in Play Console, as they change.

## Accounts in the native application

The app has six **always-visible** navigation tabs, including **Account**. New learners can create an account or sign in from either Home or the Account screen. Email/password authentication uses the **same production Supabase Auth project as the ICU Nursing website**, with an Expo-compatible public publishable key only (configured under both EAS profiles in `eas.json`; never use a secret server key in a mobile bundle).

Registration uses the existing first-party Turnstile CAPTCHA page, then sends an email verification link with redirect `nursingmastery://auth/callback`. Password recovery uses `nursingmastery://auth/callback?type=recovery` and the in-app **Set a new password** form. A dedicated callback route prevents unmatched-route errors. To enable real email confirmation/password recovery, verify in **Supabase Authentication → URL Configuration** that these scheme-based redirect URLs are allowed in the appropriate project and that email delivery works. This dashboard setting cannot be checked by source code or Metro export.

Local testing:
- Use `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or compatible legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY`), and optionally `EXPO_PUBLIC_SITE_URL` in `mobile/.env`.
- Expo only substitutes **static** expressions such as `process.env.EXPO_PUBLIC_SUPABASE_URL` during bundling. Do not use dynamic `process.env` spreads as the native auth configuration.
- EAS preview and production builds already declare the **public project URL and publishable key** in their profile `env` sections. If the web production project changes or rotates keys, update these public values together.
- Only guest progress stays in the existing guest on-device storage. Authenticated progress is cached separately by Supabase user ID; guest history is **not silently uploaded to or shown in another account**. Existing supported saved data (bookmarks, completed lessons, attempt history and sessions) is synchronized through the website's current account-owned RPCs and RLS.

### Required device verification before TestFlight
1. Install the latest native build. Ensure all six tabs are visible on an iPhone without opening a More menu, and that Home > Account opens the right screen.
2. Create a learner account, complete Turnstile, receive the email, open confirmation on that same device, and verify the email appears in Account.
3. Sign out, reopen the app and confirm guest progress is separate. Sign back in, then verify account progress in the app and website. Test a second account and ensure there is no cross-account progress leakage.
4. Trigger password reset, open the recovery email on the same iPhone, choose a new password, sign out and sign in with the new password.
5. Test offline guest mode, wrong credentials, expired link, email not confirmed, Arabic/RTL, large text and VoiceOver.
6. Confirm website production, EAS project, Supabase Auth redirect allow-list and email sender are aligned. A green GitHub CI/Expo export is not proof of successful email delivery, RLS sync or TestFlight availability.

**Status:** Code must pass CI, builds, and on-device acceptance; no TestFlight submission is implied by committing this change.
