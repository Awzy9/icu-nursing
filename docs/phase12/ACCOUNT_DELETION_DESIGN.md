# Account deletion (Phase 12): design, data review and recovery implications

## 1. Data review (live schema, migrations 0001 to 0016)
Every table that references a user, and what deleting the user does:
| Group | Tables | On delete of the auth user |
|---|---|---|
| Profile and roles | `profiles`, `user_roles` (`user_id`), `reviewer_specialties` (`user_id`) | **CASCADE**: erased |
| Learner state | `bookmarks`, `learning_progress`, `quiz_attempts`, `quiz_attempt_items`, `quiz_answers`, `learner_question_stats`, `question_bookmarks`, `learner_review_schedule`, `case_attempts`, `case_attempt_steps`, `skill_bookmarks`, `skill_sessions`, `skill_session_items`, `medication_bookmarks`, `equipment_bookmarks`, `equipment_progress` | **CASCADE**: erased |
| Staff authorship links | `topics.author_id`, `content_versions.submitted_by`, `review_assignments.assigned_by`, `question_items`/`case_items`/`skill_items`/`medication_items` `created_by`/`approved_by`/`reviewed_by`/`pharmacist_reviewed_by`, `user_roles.granted_by`, `reviewer_specialties.granted_by`, `skill_sessions.assessor_id`, `draft_notes.updated_by`, `draft_note_revisions.changed_by` | **SET NULL**: content stays, the person is detached |
| Review accountability | `review_assignments.reviewer_id` (CASCADE), **`content_reviews.reviewer_id` (NO ACTION)** | Review records are immutable accountability records and are **retained**; the deletion function refuses an account that holds one |
| No foreign key | `audit_log.actor`, `storage.objects.owner` | The audit log is append-only by design. Learners upload nothing |
A database test fails if a future migration adds a foreign key to `auth.users` that is neither CASCADE nor SET NULL (other than the documented `content_reviews.reviewer_id`), so deletion cannot silently become impossible.

## 2. What is deleted, what is retained
* Deleted: profile (name, email, country, language, experience), roles, progress, bookmarks, review schedule, every attempt and result in the question bank, study, case and skills areas, equipment state, and all sign-in sessions and refresh tokens.
* Retained: (a) one audit entry, `account_deleted`, with **no actor, no email, no name**, only a one-way hash of the id, the method and the time; (b) earlier security-log entries made while the account existed (for example the creation of the learner role) which hold only the opaque user id, never a name or email; (c) for staff accounts, authored content and review records (see below).
* The generic row-audit trigger would have logged the cascaded deletion of the person's own role rows with their user id. During self-service deletion it is suppressed (`app.account_deletion` flag); administrators revoking a role are audited as before (tested).

## 3. Who may self-delete
* **Learners:** yes.
* **Staff (author, clinical reviewer, publisher, administrator):** no. Their records are professional accountability records and removing the last administrator would lock the system. An administrator revokes the role first (an audited action that already exists); the person can then delete the account themselves, unless they hold review records that must be kept, in which case an administrator handles it. The page and the public information page say this clearly.

## 4. Safeguards (all enforced in the database function `delete_my_account(p_email)`)
1. Acts only on `auth.uid()`; there is no user-id parameter, so another person's account cannot be addressed (tested, including by passing another user's email).
2. Recent authentication: the newest authentication-method timestamp in the JWT `amr` claim must be within 10 minutes (future, missing or malformed stamps are refused). The page checks the same claim (`getClaims()`, verified) only to explain; the database decides.
3. A user with a verified second factor must be at aal2.
4. The caller types their own email (case-insensitive), ticks "I understand" and confirms a browser dialog.
5. Staff roles and retained review records are refused (section 3).
6. Server action: validated input, per-user (5 per 10 minutes) and per-IP throttling, no service-role key anywhere in the web app (a unit test asserts it), cookie clean-up and redirect after success.
7. Audit entry without personal data (section 2).

## 5. Sessions
Deleting the `auth.users` row cascades to `auth.sessions` and `auth.refresh_tokens`, so refresh and password sign-in fail immediately. An already-issued access token (up to its remaining lifetime, at most one hour) can still be presented but can act on nothing: the user row and every owned row are gone, writes fail on foreign keys and reads return nothing. The action also clears the browser's session cookies. The isolated-stack test checks all of this against the real Auth service.

## 6. Recovery implications
Deletion is irreversible by design. The hosting provider's encrypted backups may hold the data for a limited time; they are not used to restore individual accounts. The pages say so. There is no "undo" and no soft delete: a soft delete would keep personal data the person asked us to remove, and a grace period would need a scheduled job and a second source of truth. If the owner later wants a 7-day grace period, it should be added as a separate, explicit decision.

## 7. Web routes (store compliance)
* `/{en,ar}/account-deletion`: public, no sign-in, linked from every page footer: how to delete, what is erased, what is kept, staff note. This is the URL to give Google Play's Data safety form and Apple's review.
* `/{en,ar}/account/delete`: signed-in flow (re-sign-in prompt, warnings, form).
* `/{en,ar}/account-deleted`: confirmation. It is deliberately outside `/account/`, because the middleware protects that prefix and the person is signed out by then (found by the isolated-stack UI test).
* Link "Delete your account" on the profile page.

## 8. Tests
Database (`tests/db/account-deletion.test.ts`, 10 tests): recent-sign-in matrix, confirmation, own-account only, staff and review-record refusal, second factor, cascade erasure and isolation of other users, audit content, dead-token behaviour, role-revocation audit unchanged, foreign-key design guard; plus the function-catalogue tests. Unit (`tests/unit/account-deletion.test.ts`): recency logic, error mapping, form schema, English/Arabic key parity, no service-role use. Integration (isolated Supabase, `tests/live/isolated.live.test.ts`): deletion over real Auth and PostgREST with two sessions, refresh-token revocation, sign-in failure, other user untouched, audit entry. End to end: public pages in English and Arabic with accessibility checks (`tests/e2e/account-deletion.spec.ts`, runs everywhere) and the live UI flow (`tests/live-e2e/ui.live.spec.ts`: wrong email refused, correct deletion, signed out, cannot sign in again, staff notice).

## 9. Limits and follow-ups
* Staff self-service deletion is intentionally not available; an administrator-assisted path exists through role revocation. A dedicated admin "remove user" function is not built.
* The 10-minute window is a constant in the migration; changing it needs a new migration.
* The `amr` claim format is that of Supabase Auth (GoTrue) at the time of writing; the isolated-stack test would fail if it changed.
* Email notification of deletion is not sent (no custom SMTP is configured).
