# Critical Care Nursing (native app)

Native iOS/Android companion to the ICU Nursing website (https://icu-nursing.vercel.app). It reads the same real, published learner-facing catalog as the website (topics, skills, medications, equipment, clinical scenarios, question bank) through the content API in `src/app/api/content/*`, not hardcoded content. Bookmarks, checklist ticks, quiz/case progress and resume state are stored on-device; sign-in uses the website's existing Supabase auth.

The original, deliberately-tiny prototype (fictional harbour/bakery/ferry equipment samples) has been removed from the shipped app. Those fixtures (`packages/fixtures/`) are kept for the automated test suite only - `core/content.ts` is never imported from `app/`, enforced by a guard test, and the bundle-leak scanner (`scripts/check-mobile-bundle.ts`) fails the build if any of that sample text reaches a release bundle.

## Before the first upload (these cannot easily be changed later)
* `app.json` -> `android.package` is `com.criticalcarenursing.myapp`. Play locks the package name once the first build is uploaded, so it cannot be changed afterwards.
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
