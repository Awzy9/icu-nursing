import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, owner, setupDb } from "./helpers";

beforeAll(setupDb);
afterAll(closePool);

/**
 * The API surface is an allowlist. If a future migration exposes a new table, column privilege or function
 * to the API roles, these tests fail until the allowlist (and a security review) is updated deliberately.
 */
describe("API exposure allowlist", () => {
  it("exposes exactly these RPC functions (public schema) to authenticated users", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prokind='f' and has_function_privilege('authenticated', p.oid, 'execute') order by 1`);
    expect(r.rows.map((x) => x.proname)).toEqual([
      "adm_ai_evidence_list", "adm_ai_evidence_set", "adm_ai_evidence_summary", "adm_draft_notes", "adm_draft_notes_summary", "adm_set_draft_note", "adm_sub_list", "adm_sub_set", "admin_grant_role", "admin_revoke_role", "admin_set_specialty", "archive_topic", "assign_reviewer", "cs_choose", "cs_discard", "cs_get", "cs_list", "cs_progress", "cs_start", "delete_my_account", "eq_mark_viewed", "eq_reset_progress", "eq_set_bookmark", "eq_state", "md_get", "md_list", "md_progress", "md_set_bookmark", "publish_topic",
      "qb_discard_attempt", "qb_get_attempt", "qb_list_attempts", "qb_progress", "qb_set_bookmark", "qb_set_flag", "qb_set_position",
      "qb_start_attempt", "qb_submit_answer", "qb_submit_attempt", "record_review",
      "record_topic_view", "restore_topic", "rollback_topic", "set_required_roles", "set_topic_completion", "sk_complete_session", "sk_discard_session", "sk_get", "sk_get_session", "sk_list", "sk_mark", "sk_progress", "sk_set_bookmark", "sk_start_session", "st_history", "st_overview", "st_start_revision", "start_revision",
      "sub_cancel", "sub_get_my", "sub_mock_advance", "sub_mock_subscribe", "sub_resume", "submit_for_review",
      "validate_topic_for_review", "withdraw_submission",
    ]);
  });

  it("exposes no functions at all to anonymous users", async () => {
    const r = await owner.query(`select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname in ('public','private') and p.prokind='f' and has_function_privilege('anon', p.oid, 'execute') order by 1,2`);
    expect(r.rows).toEqual([]);
    expect((await owner.query("select has_schema_privilege('anon','private','usage') u")).rows[0].u).toBe(false);
  });

  it("keeps helper and trigger functions in the private schema, usable by policies but not by anon", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.prokind='f' order by 1`);
    expect(r.rows.map((x) => x.proname)).toEqual(expect.arrayContaining(["has_role", "has_staff_role", "is_aal2", "can_read_topic", "can_edit_topic", "write_audit", "audit_row", "_evaluate_version", "_topic_snapshot"]));
    expect((await owner.query("select has_schema_privilege('authenticated','private','usage') u")).rows[0].u).toBe(true);
    expect((await owner.query(`select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname in ('write_audit','audit_row','_evaluate_version','_topic_snapshot','_require_role','handle_new_user') and has_function_privilege('authenticated', p.oid, 'execute')`)).rows[0].n).toBe(0);
  });

  it("never lets a function fall back to PUBLIC execute", async () => {
    const r = await owner.query(`select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prokind='f' and p.proacl is null`);
    expect(r.rows).toEqual([]);
  });

  it("grants anonymous users read access to nothing but public views and domains", async () => {
    const r = await owner.query(`select table_name, privilege_type from information_schema.role_table_grants
      where table_schema='public' and grantee='anon' order by 1,2`);
    expect(r.rows).toEqual([
      { table_name: "nursing_domains", privilege_type: "SELECT" },
      { table_name: "public_domains", privilege_type: "SELECT" },
      { table_name: "public_topics", privilege_type: "SELECT" },
    ]);
  });

  it("never grants authenticated users write access to workflow tables", async () => {
    const r = await owner.query(`select table_name, privilege_type from information_schema.role_table_grants
      where table_schema='public' and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE')
        and table_name in ('content_versions','content_reviews','review_assignments','audit_log','user_roles','reviewer_specialties','learning_progress','app_settings')`);
    expect(r.rows).toEqual([]);
  });

  it("never grants authenticated users any write access to question-bank tables, nor read access to answer keys beyond staff RLS", async () => {
    const tables = ["question_items", "question_options", "question_answer_keys", "question_explanations", "quiz_attempts", "quiz_attempt_items", "quiz_answers", "learner_question_stats", "question_stats", "question_bookmarks", "learner_review_schedule", "case_items", "case_steps", "case_step_options", "case_option_keys", "case_attempts", "case_attempt_steps", "skill_items", "skill_checklist_items", "skill_revisions", "skill_bookmarks", "skill_sessions", "skill_session_items", "medication_items", "medication_monitoring_items", "medication_revisions", "medication_bookmarks"];
    const w = await owner.query(`select table_name, privilege_type from information_schema.role_table_grants
      where table_schema='public' and grantee in ('authenticated','anon') and privilege_type in ('INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER') and table_name = any($1)`, [tables]);
    expect(w.rows).toEqual([]);
    const a = await owner.query(`select table_name from information_schema.role_table_grants where table_schema='public' and grantee='anon' and table_name = any($1)`, [tables]);
    expect(a.rows).toEqual([]);
    const rls = await owner.query(`select relname from pg_class where relnamespace='public'::regnamespace and relname = any($1) and not relrowsecurity`, [tables]);
    expect(rls.rows).toEqual([]);
    // Question-bank helper/definer internals stay out of the API.
    const internals = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private'
      and p.proname in ('finalize_attempt','reveal_answer','qb_candidates','qb_create_attempt','st_revision_ids','own_attempt','own_case_attempt','own_skill_session','medication_card','medication_is_visible','medication_structure_errors','skill_card','skill_is_visible','skill_structure_errors','case_is_visible','case_structure_errors','expire_if_due','question_is_visible') and has_function_privilege('authenticated', p.oid, 'execute')`);
    expect(internals.rows).toEqual([]);
  });

  it("restricts writable topic columns to editorial fields", async () => {
    const r = await owner.query(`select column_name from information_schema.column_privileges
      where table_schema='public' and table_name='topics' and grantee='authenticated' and privilege_type='UPDATE' order by 1`);
    const cols = r.rows.map((x) => x.column_name);
    expect(cols).not.toEqual(expect.arrayContaining(["status"]));
    for (const forbidden of ["status", "kind", "author_id", "published_version_id", "first_published_at", "last_reviewed_at", "next_review_at", "archived_at", "id", "required_review_roles"]) expect(cols).not.toContain(forbidden);
    expect(cols).toEqual(expect.arrayContaining(["title", "summary", "origin"]));
  });

  it("pins search_path on every function in the public and private schemas", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname in ('public','private') and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`);
    expect(r.rows).toEqual([]);
  });
});
