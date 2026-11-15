# Skills library architecture (Phase 7)

## Scope
The authoritative scope is Part 6 of the original master prompt: **25 ICU nursing skills** (arterial line care ... pain assessment). `src/lib/skill-draft-validator.ts` embeds the list and fails if a draft is missing or off-scope. Nothing in this module issues certificates, competency approvals or qualifications.

## Data model (migration 0012, manual rollback in `supabase/rollback/0012_skills_down.sql`)
| Table | Purpose |
|---|---|
| `skill_items` | one row per skill version: category, localized title/summary/objectives/prerequisites, `sections` (14 fixed keys of localized lists), `section_support` (full / partial / local_protocol / permission_required per section), `evidence_status`, `license_status`, `evidence_date`, `references`, review/approval/publish metadata |
| `skill_checklist_items` | ordered checklist steps: phase (preparation, assessment, procedure, monitoring, escalation, documentation), `critical`, and per-step `support` (sourced / partial / local_protocol) |
| `skill_revisions` | learner-visible revision history (one note per version) |
| `skill_bookmarks` | per-learner bookmarks |
| `skill_sessions` + `skill_session_items` | **competency model**: one practice session per learner per attempt, with a self-reported result (done / unsure / not_done) per checklist step |

### Competency model: what exists now and what is reserved
* Now: `mode = 'self_study'` only. A learner's ticks are self-report; completion stores counts (steps ticked, critical steps ticked). There is no pass/fail, score, certificate or "competent" state anywhere in the schema, API or UI (tests assert the absence of verdict wording).
* Reserved for a future clinical-review phase: `mode = 'observed_assessment'`, `assessor_id`, `assessor_name`, `assessor_credential`, `verified_at`. A named CHECK (`skill_sessions_self_study_only`) forbids any non-self-study row today; a second CHECK forbids assessor fields on self-study rows. Enabling observed assessment later is a deliberate migration (drop that one constraint, add an assessor-only function guarded by a staff role and MFA, add an immutable assessor signature), not a flag flip. Assessment history already exists as `skill_sessions` rows per learner and skill version.

## Content gate and publication safety
`private.skill_is_visible()` shows a skill only when it is published, not retired and
* `demo_synthetic`: labelled `SYNTHETIC FIXTURE`, fixtures switched on, development database; or
* `clinical`: named approver, independent reviewer holding `clinical_reviewer`, **`evidence_status = 'supported'`**, **`license_status` original or cleared**.

A guard trigger rejects publishing a clinical skill without those, without references and an evidence date, with a reviewer equal to the author, or with an invalid structure (3+ checklist items; indications, safety, escalation and documentation sections; a revision note). Published skills are immutable. **All 25 clinical drafts live outside the database** (`content/drafts/skills/*.json`) and cannot satisfy the gate (their evidence is partial/unsupported and licensing is unresolved).

## API surface (9 SECURITY DEFINER functions, all `auth.uid()`-checked; learners have no table access)
`sk_list(query, category, bookmarked_only)` (search is parameterised, `%`/`_` escaped, 80 characters max), `sk_get(code)`, `sk_progress()`, `sk_set_bookmark`, `sk_start_session` (resumes an open session; cap of 10 open sessions and 60 starts per rolling hour), `sk_get_session`, `sk_mark`, `sk_complete_session`, `sk_discard_session`. The privileged-function catalogue test now covers 44 functions.

## Application
* `src/lib/skills`: zod schemas, service interface, Supabase service, in-memory fixture engine (same secrecy and isolation rules), synthetic fixtures (`SYN-SKILL-001..004`, nonclinical, two with Arabic text), seed generator (`supabase/seed_skill_fixtures.sql`).
* Pages: `/skills` (search, category browsing, bookmarked filter, progress counts), `/skills/[code]` (sections with evidence badges, checklist, evidence/licensing panel, revision history, own history), `/skills/session/[id]` (checklist runner). Learning hub card and main navigation entry added.
* Accessibility and i18n: labelled search form that works without JavaScript, `aria-current` filters, radio groups per step with 44px targets, English fallback marked `lang="en" dir="ltr"` inside Arabic pages, RTL verified, axe clean in English, Arabic and dark mode at three viewports.

## Importing a clinical skill in a future phase
1. Source gaps closed and licences cleared; a pharmacist/clinical reviewer signs the reviewed content.
2. A reviewed JSON is converted by a reviewed import script (not written in this phase) into draft rows, never `published`.
3. Independent review, approver and `evidence_status = 'supported'` recorded by staff functions; only then can the publish guard pass.
