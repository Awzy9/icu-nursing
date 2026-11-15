# Administration and publication workflow audit (Phase 10)

Scope: topics, skills, medications, MCQs, scenarios and equipment modules. Clinical review, reviewer recruitment and publication of unreviewed content remain **off**; nothing below activates them.

## Findings by content type
| Type | Where it lives | Authoring | Draft validation | Version history | Licensing tracking | Review-state controls | Publication gate |
|---|---|---|---|---|---|---|---|
| Topics | DB (`topics`, `content_versions`) + 40 clinical drafts as markdown files | Admin UI (`/admin/topics`), author role | DB readiness checks; `validate:drafts` for the files | **Yes**: immutable `content_versions`, rollback/restore functions | Source register (`sources`) + `topic_references`; UI at `/admin/sources` | **Yes**: reviewer assignment, per-version reviews, approver, independent publisher | Yes, role- and MFA-gated, audit-logged |
| MCQs | DB (`question_items`, fixtures only) + 306 drafts as markdown | **None in the UI** (seed/SQL only) | DB structure checks; `validate:drafts`, `validate:mcq`, `audit-mcqs` | `version` column and freeze trigger (edit = retire + new version); **no history table** | `source_note` text only | DB guard needs approver + independent reviewer for clinical items; **no UI to assign or record** | Yes (publish guard, fixtures dev-only) |
| Cases / scenarios | DB (`case_items`, fixtures only) + 20 scenario drafts as JSON | **None in the UI** | DB `case_structure_errors`; `validate:scenarios` (+ round-trip tests) | `version` column; **no history table** | `source_note` only | As above | Yes |
| Skills | DB (`skill_items`, fixtures only) + 25 drafts as JSON | **None in the UI** | DB structure checks; `validate:skills` | `skill_revisions` (one note per version) | `license_status` column (original/cleared/unassessed...) | Approver, independent reviewer and `evidence_status = supported` required | Yes |
| Medications | DB (`medication_items`, fixtures only) + 50 drafts as JSON | **None in the UI** | DB no-dosing trigger; `validate:medications` | `medication_revisions` | `license_status`; label provenance in `LABEL_SOURCES.csv` (files) | Pharmacist reviewer columns reserved and inactive | Yes |
| Equipment | Bundled synthetic fixtures; 8 drafts as JSON; per-user state in DB (0015) | **None** | `validate:equipment` | none | none | none | Cannot be persisted or served unless synthetic (`SYN-EQ-nnn` CHECK) |

## Gaps identified
1. Only topics have an authoring and review UI. Questions, cases, skills and medications can be changed only by SQL or seed scripts. This is deliberate for now (no clinical content may be imported) but means a reviewer in a future phase has no screen to work in.
2. No unified view of what exists, where, and in what state. The clinical drafts are files outside the database and were visible only through reports.
3. Version history is complete for topics, partial for skills and medications (one note per version), and absent as a table for questions and cases.
4. Licensing is tracked in three places that are not reconciled: the `sources` table (topics), file registers (`LICENSING_REGISTER.md`, `sources/source_register.csv`, `NEW_SOURCES.csv`, `LABEL_SOURCES.csv`) and per-item `license_status`/`source_note`. The `sources` table had no staleness signal.
5. Drafts could drift from their validators without anyone noticing (no single command, nothing in CI that ran all of them).
6. Review-state controls for non-topic content exist only as database guards; there is no assignment, queue or review record for them.

## Implemented in Phase 10 (safe, read-only or build-time; no review or publication enabled)
* **`/admin/content` (staff only, read-only):** database item counts by status and fixture kind for topics, questions, cases, skills and medications with the publication gate that protects each; counts-only register of the unpublished drafts (total, validator issues, clinically reviewed = 0, evidence status); a licensing summary (sources by class, how many need attention). Linked from the admin navigation.
* **Draft register:** `scripts/build-draft-register.ts` writes `src/content/draft-register.json` (counts only, no titles or clinical text) from the actual validators. A unit test fails if it is stale or contains prose; CI regenerates it and fails on a diff.
* **`npm run validate:all`:** runs the six draft validators in one command; CI now runs it on every push.
* **Source licensing health:** `src/lib/admin/source-health.ts` flags never-checked, not-checked-in-180-days, RED/UNVERIFIED, draft-guideline and URL-less sources; the source register page shows "Never checked" and "Not checked in 180 days" badges.
* **Tests:** DB test that the overview queries work for staff and return nothing to a learner and that no `clinical` row exists in any content table; unit tests for the register and source-health logic.

## Recommended next steps (not done, need owner decisions)
* Revision tables for questions and cases; a staff-only draft-import preview that validates and reports but never writes.
* An assignment and review-record model for skills, medications and cases that mirrors `review_assignments`/`content_reviews`, built dormant behind the existing publish guards.
* Reconcile the file licensing registers with the `sources` table (import as UNVERIFIED rows) so licence status is queryable in one place.
* Staff authoring screens for questions and cases only after clinical review is approved to start.
