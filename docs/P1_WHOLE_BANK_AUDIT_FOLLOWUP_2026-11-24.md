# Whole-bank audit follow-up — 24 November 2026

Rewrote the five stems identified by the static audit: D01-T12 Q5, D04-T03 Q5, D01-T19 Q4, D07-T01 Q4, D01-T06 Q5. All are now applied clinical or source-applicability scenarios rather than short generic recall. Existing source content was reused; this is not a new evidence appraisal. All 30 question IDs and keys across affected sets remain unchanged, and affected sets have zero stems under 60 characters. Prior revision hashes checked, index and history synchronized. Added a full-bank regression test comparing all 306 items (46,665 unordered pairs, Jaccard >= 0.70) and the existing stricter expansion check (>= 0.50), as well as normalized duplicate-option detection. The audit script now uses the run date and supports non-writing `--check` mode with a failing exit status for duplicate findings. Full tests have not been executed locally; results require CI. No new clinical sign-off, publication or deployment.

- D01-T12: 6 items; keys BDCADB; short stems 1 → 0; uniquely longest correct answers 1 → 1.
- D04-T03: 6 items; keys CADBBC; short stems 1 → 0; uniquely longest correct answers 1 → 1.
- D01-T19: 6 items; keys DDBCAB; short stems 1 → 0; uniquely longest correct answers 1 → 1.
- D07-T01: 6 items; keys ADBCCB; short stems 1 → 0; uniquely longest correct answers 1 → 1.
- D01-T06: 6 items; keys BDACCD; short stems 1 → 0; uniquely longest correct answers 1 → 1.
