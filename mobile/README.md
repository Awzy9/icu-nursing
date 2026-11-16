# ICU Knowledge Map: Android prototype (internal testing)

A deliberately tiny Expo app so a Google Play testing track can be started. It shows three **fictional, nonclinical** equipment samples (harbour display panel, garden drip pump, bench cushion) with a parts explorer. It contains **no ICU, patient or medication content**; nothing from the unreviewed clinical drafts is included.

## Before the first upload (these cannot easily be changed later)
* `app.json` -> `android.package` is `com.criticalcarenursing.myapp`. Play locks the package name once the first build is uploaded, so it cannot be changed afterwards.
* Decide the store listing name, icon (`assets/`) and privacy policy URL (Play requires one even for testing).

## Run it
```
cd mobile && npm install
npx expo start        # scan the QR code with Expo Go on an Android phone
```

## Build for Play (needs your Expo account; EAS has a free tier)
```
npm i -g eas-cli && eas login
eas build:configure                      # once, links the project
eas build -p android --profile preview   # installable APK for your own phone
eas build -p android --profile production  # .aab to upload to Google Play
```
`production` auto-increments `versionCode`. First upload to Play must be done through the Play Console (Internal or Closed testing track); EAS can submit later with a Play service-account key (`eas submit -p android`).

## The 14 days
Google's closed-testing requirement for new personal developer accounts (at least 12 testers opted in for 14 continuous days) starts when testers join a **Closed testing** track release, not Internal testing. Internal testing is for up to 100 quick testers and does not count toward that requirement. Check the current rules in Play Console, as they change.
