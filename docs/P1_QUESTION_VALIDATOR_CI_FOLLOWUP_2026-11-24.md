# Question-bank validation and CI follow-up — 24 November 2026

CI for ccc8512 failed at ESLint parsing tests/unit/working-infusion-calculator.test.tsx (line 25), before the full unit suite ran. Mobile acceptance and Learning experience were successful. Replaced the malformed regex with the exact existing invalid-input message assertion.

The 306-question draft bank has already had targeted reference review. This pass strengthens automated integrity: duplicate option labels, duplicate answer-key lines, repeated explanation lines, duplicate question identifiers and case/whitespace-equivalent options can no longer pass through the parser silently. Option parsing now requires the literal period. Tests cover both core and expansion drafts. No clinical answer keys, scoring policy or review status changed. Full CI must rerun; this is not a new independent clinical review of 306 questions. No publication.
