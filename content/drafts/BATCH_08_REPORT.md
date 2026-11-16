# Batch 8 report (2026-11-14)
AI-generated DRAFT, **not clinically reviewed**, unpublished, not imported. Clinical review and AI-assistant development remain postponed. Internal checks are technical, evidence and educational-quality checks, not clinical approval. No new curriculum batch was opened after this one.

## Four remaining topics drafted (24 MCQs)
| Topic | Draft | Sources read and status | Coverage |
|---|---|---|---|
| D01-T06 Mechanical ventilation fundamentals and modes | batch-08/D01-T06 | JICS 2026 educational review PMC13427949 (main text read; EDUCATIONAL REVIEW, not a guideline; supplement and series parts 2-4 not read); AARC PVA 2024 guideline | PARTIAL |
| D01-T09 Ventilator alarms and nursing response | batch-08/D01-T09 | HAMILTON-C1 Operator's Manual 2.2.x (624326/05, 2020): chapters 4.7, 8, 9.3, 9.4, appendix J.5 read; alarm table and figures not used or reproduced; AARC PVA principle | THIN (one manufacturer, one model; all device statements labelled; no cross-device guidance; Joint Commission page 403) |
| D03-T03 ICP and cerebral perfusion pressure | batch-08/D03-T03 | BTF Severe TBI 4th ed (Sept 2016): web index of all topics, full PDF downloaded, monitoring and thresholds sections read; population labelled severe TBI in adults throughout | PARTIAL (no nursing technique; non-TBI not covered) |
| D08-T02 Coagulation tests | batch-08/D08-T02 | UHS Sussex NHS Pathology Coagulation screen page (modified 2025-12-24; very short); ARUP Consult DIC (updated Jan 2025) and anticoagulant-effects page (Feb 2024); Open RN 6.12 | THIN (laboratory handbook and educational pages, not guidelines; reference ranges stated as local) |

Evidence integrity: sections, dates, licensing and access status recorded in `sources/source_register.csv` (10 new entries; statuses enforced by unit tests) and `SOURCE_AUDIT.csv`; each draft section 9 records source, location, level, population and limits; section 20 states coverage limits. Educational reviews, manufacturer manuals and laboratory handbooks are not presented as universal guidelines. Doses and treatment thresholds beyond what a guideline states are omitted; BTF thresholds are stated for severe TBI only.

## Curriculum-wide assessment and inventory
- `TOPIC_INVENTORY.csv` now has `coverage_level`, `comprehensively_covered` and `key_coverage_gaps` for all 40 topics: **DRAFTED 40/40; CORE COVERED 9; PARTIAL 22; THIN 9** (AI judgement, provisional; no topic is marked unqualified "YES"; unit tests enforce this).
- `CURRICULUM_GAP_ASSESSMENT.md` covers the seven focus areas (hypokalaemia, extubation, CRRT equipment and alarms, RASS/SAS/CPOT/BPS, transfusion and enteral-feeding safety, vasopressor extravasation and administration safety, contradictions and superseded guidance).
- `FIRST_RELEASE_CONTENT_GAP_REPORT.md` is the comprehensive first-release gap report requested for planning the next phase.

## Totals
Unique drafted topics **40 of 40**; MCQs **240** (720 wrong-option explanations); traced statements **502** (wording matches only); sources registered **83**.

## Unresolved clinical risks introduced or retained
Ventilator alarm response beyond one device; ventilator-mode interpretation for nurses (no nursing source); nursing neuro-monitoring technique; coagulation test pre-analytical effects and local pathways; every gap in the gap report.

## Tests (this commit)
| Suite | Result |
|---|---|
| Lint, typecheck | pass |
| Unit | 213 passed (includes the new coverage-level tests) |
| Content validation | 40 of 40 drafts pass |
| Database | 170 passed |
| E2E and accessibility | 127 passed, 2 skipped |
| Real-CAPTCHA live checks | 5 passed |
| Live API suite (50) and live UI suite (11) | Not run: the real Turnstile secret rejects the test token; secret and authentication left unchanged |
