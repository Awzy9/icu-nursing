# Equipment independent-review handoff — 24 November 2026

Staff-only administrative continuation of the equipment evidence work. Snapshot: `99bb4949b036186d2f39a65dc9a66ba3a2c2f9a8`. Inspected all eight canonical equipment JSON drafts at this exact revision and the generated index. No new clinical claims, source verification, rights clearance, approvals or release actions. No existing requirement is closed by this document.

## Reconciled inventory

All eight drafts contain three required-source items each: (A) independent appraisal of existing parameter explanations and installed-device applicability, (B) exact installed model/software IFU, (C) unit policy. 24/100 current outstanding requirements are equipment-related. Across eight drafts there are 28 named parameters. The five drafts with manufacturer-document entries have device-specific comparators, not confirmed installed devices. EQ-03, EQ-04 and EQ-05 have empty manufacturer-document arrays. The index at the snapshot records 166 drafts, all unreviewed; zero UNVERIFIED licence-class references does not imply rights approval.

| ID | Parameters to appraise (A) | Existing device comparator / missing IFU (B) | Policy review scope (C) | Suggested reviewer roles |
|---|---|---|---|---|
| EQ-01 / SK-18 | Heart rhythm trace, heart rate, oxygen saturation, alarm priority (4) | Philips IntelliVue 6100/6300/6500, R.0 onwards (S-PHILIPS-INTELLIVUE-R0); confirm actual monitor and sensors | Alarm management, escalation, monitoring competence | ICU nurse educator + clinical engineering |
| EQ-02 / SK-07 | Pressure waveform, flow waveform, volume, respiratory rate, alarm limits (5) | HAMILTON-C1 software 2.2.x; Dräger Evita Infinity V500, version in source register; verify actual device/version | Ventilator alarm escalation, staff competency and authorised settings changes | Respiratory therapist/ventilation specialist + ICU nurse educator + clinical engineering |
| EQ-03 / SK-01 | Arterial pressure value, arterial waveform, zero and levelling (3) | No manufacturer document listed; request actual transducer, monitor and compatible components | Arterial pressure monitoring, contamination prevention and escalation | ICU nurse educator + clinical engineering |
| EQ-04 / SK-22 | Programmed rate, volume infused, occlusion and air alarms (3) | No manufacturer document listed; request exact pump type/model, software and drug-library revision if applicable | Pump competency, high-alert infusions, incident escalation and continuity | ICU nurse educator + pharmacist + clinical engineering |
| EQ-05 / SK-19 | Rhythm display, energy setting, charge state (3) | No manufacturer document listed; request exact defibrillator and configuration | Resuscitation equipment competency, shock safety and response protocol | Resuscitation lead + ICU nurse educator + clinical engineering |
| EQ-06 / SK-17 | Access and return pressures, blood flow, delivered dose against prescription, alarm state (4) | PrisMax comparator; software revision unspecified (S-VANTIVE-PRISMAX-PRESSURES, S-VANTIVE-PRISMAX-ACCESS; N-AHS-CRRT-ALARM-2025 is a local comparator) | CRRT alarms, circuit termination, anticoagulation and escalation responsibilities | Renal/ICU specialist + CRRT educator + clinical engineering; pharmacist where relevant |
| EQ-07 / SK-10 | Programmed rate, volume delivered, occlusion alarm (3) | Kangaroo OMNI comparator; software revision unspecified (S-CARDINAL-OMNI-RATE, S-CARDINAL-OMNI-ALARMS) | Enteral pump competency, tube-placement verification and feeding interruption | Nutrition support team + ICU nurse educator + clinical engineering |
| EQ-08 / SK-14 | Mode, air level or pressure state, alarm state (3) | Arjo Alpha Active 4 comparator; revision unspecified (S-ARJO-ALPHA-ACTIVE4) | Support-surface selection, fit, inspection, safe transfer and pressure-injury prevention | Tissue-viability specialist + ICU nurse educator + clinical engineering |

## Evidence appraisal queue

Inspect each parameter against its actual source IDs in the canonical JSON, including context, population, exact cited passage, date and device applicability. Prioritize these source-mapping checks; they are questions for the reviewer, not findings of incorrectness:
- EQ-01: distinguish clinical guidance on rhythm/oxygenation from monitor-specific display and alarm behaviour; confirm sensor-dependent limitations.
- EQ-02: distinguish general patient–ventilator assessment guidance from device-specific modes, labels and alarm displays.
- EQ-03: check measurement claims against S-ARTERIAL-MEASUREMENT-2020 and confirm compatibility with local hardware.
- EQ-04: S-FDA-PUMP and S-FDA-PUMP-OVERVIEW are general safety sources, not substitutes for installed-device IFUs or drug-library validation.
- EQ-05: S-ERC-ALS-2025 is clinical resuscitation guidance; it is not the operator's manual for the installed defibrillator.
- EQ-06: check software-version-specific pressure/alarm terminology separately from delivered-dose/prescription clinical guidance; the AHS pathway cannot validate another unit's policy.
- EQ-07: verify displayed delivered volume and alarms against the installed model and distinguish pump displays from nutrition/tube-placement guidance.
- EQ-08: verify general support-surface recommendations separately from device-specific pressure/indicator and alarm terminology.

## Required handoff record for each ID

1. Record canonical draft revision hash, parameter name and exact source passage/location, publication revision, applicability and independent reviewer disposition; record any correction against the same revision.
2. Record installed device manufacturer, model, software/firmware, accessories where relevant, IFU document revision and official document reference. Where this is an international device-neutral curriculum without a named installed device, keep the requirement open or obtain an explicit approved device-neutral scope decision; do not assume a comparator meets it.
3. Record local approved policy title/version, responsible service, geographic/facility applicability and competency requirements. Do not invent an institutional policy or universalise a comparator.
4. Obtain separate rights disposition (citation vs reproduction, translation and commercial distribution). Do not copy manufacturer screens or alarm tables without permission.
5. Record independent clinical/technical reviewer identity and date through the existing authorised review process only after the relevant checks. A later content change requires revision-specific reassessment under the release process.

Keep all 24 items open until actual evidence and review disposition exist. This plan does not alter canonical drafts, index/history, source registry, clinical flags, CI gates or production configuration. Remaining source requirement count stays 100 at this snapshot.
