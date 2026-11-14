# Clinical Governance

## Publication workflow

`DRAFT → CLINICAL_REVIEW → APPROVED → PUBLISHED → PERIODIC_REVIEW` (plus `ARCHIVED`, and `CHANGES_REQUESTED` returning to DRAFT).

Enforced in the database (a state-transition function + trigger), not just the UI:

- Only `author` can move DRAFT → CLINICAL_REVIEW.
- Only a `clinical_reviewer` (never the author) can move CLINICAL_REVIEW → APPROVED or → CHANGES_REQUESTED.
- Only `publisher/admin` can move APPROVED → PUBLISHED. **AI-generated or AI-assisted drafts have no path to PUBLISHED without a named human reviewer.**
- Any edit to a PUBLISHED item creates a new version in DRAFT; the live version stays visible until the new one is approved.
- Every transition writes `audit_log` (who, when, from/to, comment) and a `content_versions` row.
- Periodic review: default 12 months (medication, emergency, resuscitation: 6 months or on guideline change). Overdue items show an "under review" flag to admins; learners see the last-reviewed date.

## Roles (separate from learner role)

| Role | Can |
|---|---|
| learner | read published content; own progress only |
| author | create/edit drafts |
| clinical_reviewer | review/approve within declared specialties; cannot approve own work |
| pharmacist_reviewer | required sign-off for any medication content |
| publisher | publish approved items, archive |
| admin | manage users/roles/config; no implicit clinical approval |

## Review requirements by content type

| Type | Minimum reviewers |
|---|---|
| Topic | 1 nurse educator/ICU clinician + specialty reviewer per `clinical_reviewer_specialty` column |
| Medication entry | Critical-care pharmacist **and** nurse reviewer |
| Skill / checklist | ICU nurse educator + relevant specialist |
| MCQ | 1 clinician; item analysis after launch |
| Scenario | Nurse educator + intensivist/specialty; check nursing-vs-prescriber boundaries |
| Emergency/resuscitation | Resuscitation lead; versioned to guideline year |

## Medication-specific rules

- Dose, concentration, infusion rate and preparation fields are **blocked from publication** unless `pharmacist_reviewed = true` and a local-protocol disclaimer is attached.
- The default product ships general pharmacology, monitoring and safety content without doses. Doses/concentrations are added only after pharmacist review, labelled "example — follow local protocol".
- Never invent concentrations.

## Scope-of-practice rule

Each topic labels actions as **Nursing action**, **Collaborative (per order/protocol)**, or **Prescriber/RT decision**. Jurisdiction-variable items carry a note. Example: the nurse does not change ventilator settings outside approved protocol.

## Evidence rules

- Prefer guidelines → systematic reviews → major RCTs → established textbooks.
- Pin guideline **version/date** on each reference; draft guidelines (e.g., KDIGO 2026 AKI/AKD draft) are never cited as final.
- Blogs, commercial sites and AI output are not primary evidence.
- Broken-link and source-update checks run quarterly; new guideline editions trigger topic review.

## Medical safety statements shown to learners

Educational use only; not a clinical decision-support tool; follow local protocols; online checklists do not replace supervised practical competency validation; no accreditation or CPD/CME recognition claims until formally granted (including SCFHS).

## Incident handling

Learners can report a content error from any page; reports go to a triage queue with a 5-working-day target for clinical acknowledgement, and immediate unpublish for credible patient-safety errors.


## Phase 1 status: what is now enforced by software

Implemented in `supabase/migrations/0003_workflow.sql` and covered by `tests/db/workflow.test.ts` (see `docs/IMPLEMENTATION.md`):

- Publication is possible only from a version approved by **assigned human clinical reviewers with MFA**, who are not the author, covering **every required reviewer role** with **distinct people** (`app_settings.require_distinct_reviewers`, default on).
- **AI-assisted/generated content** needs at least two reviewer roles at submission and at least two distinct approving humans at approval — regardless of settings. Nothing in the system can mark content approved except `record_review`.
- Reviews are immutable; every transition is written to an append-only audit log with the acting user.
- Editing is blocked while a topic is in review/approved; a published topic is revised via `start_revision`; the live version is unchanged until the new one is approved and published; rollback to an earlier published version requires a reason.
- **Draft guidelines** (e.g., KDIGO 2026 AKI/AKD) can be cited only with an explicit acknowledgement and are always rendered with a "DRAFT guideline — not final" label.
- RED-licensed sources require an "independently written" note; images need alt text and a reusable licence.
- Medication dose/concentration fields are **not implemented** in Phase 1 (the medication library is a later phase and will require pharmacist sign-off by design).

**Still human decisions (not automatable):** appointing named reviewers and their credentials; deciding the reviewer roles required per topic (default `NE`; see `curriculum/master_curriculum.csv` → `required_reviewer_roles` / `multidisciplinary_review_required`); periodic-review ownership; any licence/permission decisions.
