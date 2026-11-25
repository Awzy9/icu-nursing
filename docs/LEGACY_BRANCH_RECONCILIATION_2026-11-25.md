# Historical branch reconciliation — 25 November 2026

Base: 3a186bc (#115).

- #3: compared the 13 files changed relative to the merge base of its current head (2d23e97) and main. Ten are identical, and the three changed sign-in, auth provider and translations retain the added lines from that comparison. The original PR targets staging and has a much larger diff; GitHub refused a full unified diff (>300 files). This is not an exhaustive staging-to-main equivalence claim. Do not merge the old staging branch into main blindly.
- #61: bedside AKI examples are present in main, with subsequent more precise escalation and diagnostic-duration wording.
- #89 and #90: intentionally reapplied in merged #109, including their audit reports.
- #107 (closed without merge): intentionally reapplied in merged #108.
- #21 and #29: restored four missing historical evidence reports. They retain original findings and limitations and are labelled historical, not current approvals.
- #29: restored ALN-01 dynamic-response interpretation (not proof of accurate pressures), GCS-01 two-part command and GCS-03 central pressure localization scenario. Existing answer keys unchanged. Removed falsely reassuring statement that GCS 15 is fully normal. Other GCS / arterial trace content not comprehensively re-reviewed.
- #29: current ECG test already checks strict chronological ordering; current CRRT access-alarm exercise already includes patient-first assessment and device-specific limits. Current ABG answer labels and other lab wording diverge from old patch; do not replace wholesale. Further content-level reconciliation is needed for ABG, ECG, waveform, transfusion, remaining #21/#29 files, and any differences outside the inspected subset.
- #12 and #13 were closed unmerged, not proven equivalent in this pass; investigate current CI and parser before reapplying any old changes.

No clinical approval, source-rights clearance, publication flags, database settings or production environment changed. The release blocker #114 remains open. This is a partial reconciliation, not a declaration that every historical branch has been merged.
