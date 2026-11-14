# Independent security audit: definer views and privileged functions

Date: 2026-11-14 · Scope: the two `SECURITY DEFINER`-owned public views, every function callable by `authenticated` through the API (now **16** RPCs: the original 15 plus `set_required_roles`, added by this audit), and every table privilege/policy. Target: migrations 0001-0005 on PostgreSQL 16 (local) and the live dev project (PostgreSQL 17).

**Honest statement of what "prove" means here.** This is an adversarial test-based audit, not a formal verification. The evidence is (1) a line-by-line review, (2) an *exhaustive* authorization matrix, (3) a *seeded randomized* invariant search over 16,500 steps with a self-tested checker, (4) catalog audits, and (5) live replay on the real project. Together they show that **no identity we modelled (anonymous, learner, authors, reviewers, publisher, administrator, each at both MFA levels) could change workflow, role, audit or published state except through the intended path.** Not covered: bugs in PostgreSQL/Supabase themselves, the PostgREST/GoTrue layers (the PostgREST binary could not be run here), a malicious database owner/project owner, and compromised staff accounts holding real permissions.

## Findings

| # | Severity | Finding | Fix |
|---|---|---|---|
| A1 | Medium (hardening) | `public_topics` / `public_domains` were not `security_barrier`. PostgreSQL may evaluate a caller-supplied predicate on base-table rows *before* the view's own filter; a failing cast then puts the offending value in the error message. I could **not** reproduce a leak on small data (planner-dependent), but safety must not depend on the planner | `alter view ... set (security_barrier = true)`; regression tests include error-oracle probes |
| A3 | **High (governance bypass)** | Authors could edit `topics.required_review_roles`, so they could shrink their own review requirements (e.g. a medication topic to a single `OTHER` reviewer) | Column privilege revoked; new `set_required_roles()` for MFA publishers/administrators only; CMS moved the control |
| A4 | **High (governance bypass)** | Authors could insert sources and self-certify `licence_class = GREEN` / `is_draft_guideline = false`, defeating the RED-licence and draft-guideline checks | Source register insert/update restricted to MFA publishers/administrators; authors can only read and cite |
| A2 | Low (defence in depth) | Nothing prevented granting `CREATE` on the app schemas in future | Explicit `revoke create` on `public` and `private` for PUBLIC/anon/authenticated (live catalog already showed no CREATE) |
| A5 | Info (design clarification) | `publish_topic`, `rollback_topic`, `archive_topic` require the **publisher** role; an administrator alone cannot publish (separation of duties). The CMS showed these buttons to administrators | UI aligned with the database; documented and tested |

Fixed earlier by tests (kept as regression): internal helpers/`write_audit` executable via default privileges; publishers unable to list reviewers; unverified JWT decode for the MFA gate.

## Static review of the privileged functions (all `SECURITY DEFINER`, `search_path = public, pg_temp`, owner `postgres`)

| Function | Gate inside the function | Cannot be bypassed because |
|---|---|---|
| `admin_grant_role`, `admin_revoke_role`, `admin_set_specialty` | `has_staff_role('admin')` (role + aal2); revoke refuses `learner` and the last admin | `user_roles` / `reviewer_specialties` have no API write grants; the functions are the only writers |
| `set_required_roles` | publisher/admin + aal2; topic must be a clinical draft/changes-requested; roles from a fixed list | column privilege removed from `authenticated` |
| `submit_for_review` | author (own topic) + aal2, or admin + aal2; state `draft/changes_requested`; validation list must be empty | topic/version state columns are not API-writable; snapshot built server-side |
| `withdraw_submission`, `start_revision` | same author/admin gate; state checks | same |
| `assign_reviewer` | publisher/admin + aal2; reviewer must hold role **and** specialty, ≠ author/submitter, role must be required | assignments table has no API write grant |
| `record_review` | `clinical_reviewer` + aal2; **assigned for that exact role**; ≠ author/submitter; version in review; comments for non-approvals | reviews table has no API write grant and is immutable (trigger) |
| `_evaluate_version` (private) | not callable from the API; approves only when every required role is covered by distinct approvers (and ≥2 for AI-assisted) | only `record_review` calls it |
| `publish_topic` | **publisher** + aal2; version and topic both `approved` | only path that sets `published_version_id` |
| `rollback_topic`, `archive_topic` | **publisher** + aal2; reason ≥10 chars; target must be a previously published version | same |
| `restore_topic` | admin + aal2; topic must be archived | same |
| `validate_topic_for_review` | caller must be able to read the topic | read-only |
| `record_topic_view`, `set_topic_completion` | signed-in; topic must be published; writes only `auth.uid()`'s row | progress has no API write grant |

`search_path` ends with `pg_temp`, `CREATE` on the schemas is denied to every API role, and all object references inside use schema-qualified names, so search-path hijacking is not possible. User-controlled strings are only ever passed as parameters.

## The two definer views
Both are the *only* public read surface and are owned by `postgres` deliberately (the base tables are not readable by `anon`). They expose published, non-archived snapshots, joined only to `nursing_domains.slug`; no author id, status, reviewer identities, comments or working-copy text is selected. They are `security_barrier` (A1). The Supabase advisor lists them as `ERROR security_definer_view`; this is the **accepted, documented** configuration. The 16 RPCs appear as `WARN authenticated_security_definer_function_executable`; each is gated as above and covered by the matrix.

## Evidence

| Evidence | Size | Result |
|---|---|---|
| **Function matrix** (`tests/db/audit-matrix.test.ts`) | 17 scenarios × 14 identities (anon, learner, 2 authors, 2 reviewers, publisher, admin × aal1/aal2) = 238 attempts | Allowed set equals the specification exactly; **every refused attempt left the database byte-identical** (global counts + topic/versions/sections/roles dumps) |
| **Write matrix** | 39 write scenarios × 14 identities = 546 attempts (every table incl. forged status, pointers, roles, reviews, audit, settings, progress, protected columns) | Only the specified identities can write; refusals leave state unchanged |
| **Read matrix** | 5 scenarios × 14 identities | Drafts visible only to author/publisher/admin with MFA; in-review adds the *assigned* reviewer; audit log only admin with MFA; profiles/roles own-only (+ admin, + publisher→reviewers) |
| **Randomized invariant audit** (`audit-fuzz.test.ts`, seeds 20261114, 11, 22, 33, 44, 55) | 1,500 + 5×3,000 = **16,500 steps**, interleaving legitimate progress with ~40 abuse action types from random identities/MFA levels/ids | **Zero violations.** Coverage per 1,500-step run: 88 topics, 77 submissions, 55 approvals, 33 publications, 15 revisions, 7 change requests, 6 rejections, 2 rollbacks, archives/restores, AI-origin topics published only with ≥2 distinct human approvers |
| **Checker self-tests** | 4 forged violations (approval-less version, author-approved version, rogue role, weakened settings) | Each is detected, so the invariants have teeth |
| **Invariants** | every approved/published/ever-published version has human approvals covering all required roles from distinct reviewers, none being the author/submitter, none dissenting; pointers/status consistent; public view ≡ live topics; every staff role/specialty traces to an administrator grant; audit and reviews append-only; snapshots and authorship immutable; progress only for published topics; MFA/distinct-reviewer settings intact | hold after every checked step |
| **Catalog audit** (live) | schema CREATE, owners, PUBLIC grants, TRUNCATE/REFERENCES/TRIGGER, sequences, role membership | no CREATE for API roles; owners `postgres`; no PUBLIC grants; none of the others |
| **Live replay** | 45 API tests + 10 UI tests on `icu-nursing-dev`, including the new findings | pass |

## Residual risks (not eliminated)
- Staff are trusted humans: a *real* publisher with MFA could publish content that reviewers approved; a real administrator can grant roles. The audit log records it; process controls (appointments, periodic review) remain essential.
- `origin` (human / AI-assisted) is an author's attestation; reviewers and publishers must challenge it.
- The project owner/database owner bypasses every control (by definition). Protect the Supabase account (MFA) and revoke tokens after use.
- Platform layers (Supabase gateway, GoTrue, PostgREST, Storage) were exercised through the live suites but not independently audited.
- Re-run `npm run test:audit` (5 seeds × 3,000 steps + matrix) after any migration; CI runs the matrix and one fuzz seed.
