# ICU Nursing iOS/Android mobile acceptance checklist
**Scope:** visual restoration, parity, simplified navigation, enhanced visuals and safe learning tools.  
**Branch/PR:** `fix/mobile-visuals-and-infusion-calculator-20261121` / PR #84  
**Prepared:** 2026-11-21

## Verification rules

**A GitHub green check is not a TestFlight device pass.** Neither TypeScript nor Metro bundling validates iPhone rendering, network access, screen reader use, actual FPS, screenshots or store availability. Do not declare release ready or submit to TestFlight until the relevant device checks are recorded.

### Automated acceptance gates
- [ ] `Mobile acceptance` CI succeeds on the **final commit** (mobile unit + content-photo provenance + waveform tests, mobile TypeScript, iOS/Android Metro bundle exports, secrets/content bundle guard).
- [ ] Main CI succeeds on the **final commit** (lint, unit, DB/RLS, draft validation, web build and browser accessibility).
- [ ] Learning workflow succeeds on the **final commit**.
- [ ] No unresolved high-severity CI findings or unsafe clinical content.
- [ ] Check that each referenced `/images/equipment/...` exists in `public/images/equipment` and license, source, credit and EN/AR alt/caption fields are populated.
- [ ] Check ICU Nursing content labels remain clearly **draft, not clinical guidance**. A successful unit test is not a clinical approval.

### New-user onboarding acceptance
- [ ] On a fresh install with no learning history, a six-step tutorial appears automatically from Home once device settings have loaded.
- [ ] The first-use tutorial shows the same current app destinations: Learn, Practice, Clinical Tools, Visual Library and Account.
- [ ] All six steps are readable in English and Arabic, including large text and VoiceOver narration. The progress indicator updates and Back/Next controls work.
- [ ] Skip dismisses the tutorial and enters Home; the tutorial does not reappear on the next app launch.
- [ ] Completing the tour via Learning Path, Practice, Visual Library or Home opens that destination and does not reappear.
- [ ] Existing local learning history is preserved and bypasses automatic onboarding. Bookmarks, attempts, case scores, progress and signed-in data are not modified by the tutorial.
- [ ] The user can replay the tutorial from Home and Account without clearing progress or signing in.
- [ ] The tutorial loads while offline (copy and illustrative icons are bundled; no photos or accounts are required).
- [ ] No medical competence claims, patient instructions, sensitive permission prompts or mandatory sign-up appear in onboarding.

### iPhone TestFlight smoke test — human tester required
1. Home: five tabs `Learn / Practice / Tools / Visuals / Account`, accessible Learn library and search, Continue Learning and progress.
2. Tools: infusion calculator visible, mL/h 150 mL/2 h = 75 mL/h; 120 mL at 60 mL/h = 2 h; 0.2 mcg/kg/min at 50 kg and 100 mcg/mL = 6 mL/h. Verify zero/negative/empty fields do not produce a rate. Use fictional examples only.
3. Visuals: switch Equipment / Imaging / Waveforms / Nursing skills; open EQ-02, EQ-03, EQ-04, EQ-05 and EQ-06 one at a time and confirm actual image, title, text alternatives and credits.
4. Imaging: selectable anatomy landmarks render with warning that the illustration **is not a diagnostic radiograph**; bladder ultrasound existing credited image loads.
5. Native waveform rendering: ECG-01/02 and ECG-07 (asystole low-amplitude baseline), WV-01, WV-02, defibrillator rhythm and ALINE waveform/Square-wave test. Screens must show nonblank waveforms, except genuine authored near-flat asystole, and no hidden content under the home indicator.
6. Compare: Waveform comparison flow/pressure/volume traces share x- and y-axis scales; narrative/explanation only after choice; chart remains legible on both light and dark themes.
7. Equipment lessons: EQ-01 monitor, EQ-02 ventilator, EQ-03 arterial line, EQ-04 infusion pump, EQ-05 defibrillator, EQ-06 CRRT; relevant photos and teaching panels appear.
8. CRRT: labels and flow pathway schematic visible, tapping component changes highlight and displayed explanation. Confirm annotations against the published content.
9. Nursing Lab: shift simulator, high-alert drug checks, visual skills images before answer without revealing the correct choice; explanation after checking. Review mistakes stores and reopens incorrect decisions.
10. Skills: SK-02/04/05/22 photos, privacy cover on central line, step ordering, quiz and lesson links.
11. Cases: numerical monitor and physiological trends; neurological/perfusion observations compared with earlier case steps; photo/ECG not missing.
12. Learning: bookmarks, completion progress, quiz/step ordering, review mistakes and resume across navigation.
13. Accessibility: VoiceOver reads buttons, photos/diagrams and summary labels; controls at least 48dp; no color-only instruction; external links and retry keyboard/control behavior; verify dynamic text sizes and Arabic/RTL.
14. Offline and unreliable network: established cached content available when the server cannot be reached; **clinical photos load from website and may not be available offline**. The UI must display a retry action instead of an unexplained blank area. Do not advertise fully offline imaging.
15. Cross-device sync: signed-in user studies on phone, signs in on second device, and sees expected supported progress. Guest vs account separation and merge behavior must match established sync policy. Do not infer successful sync from local-only storage.
16. Performance: navigate rapidly between gallery selections, leave/reenter labs, rotate if enabled; check for crashes, hangs, excessive memory, dropped frames and image layout overflow.

### Release decision
**Status: Not yet cleared for TestFlight production distribution.** Re-evaluate after final-commit CI and device checks. iOS Metro export != signed IPA and no TestFlight submission is implied here.

The original schematic illustrations supplement, rather than replace, licensed clinical imaging. Any future real clinical radiograph used in the app needs documented source permission, independent clinical accuracy review and a non-identifying example.
