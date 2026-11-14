import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, owner, setupDb } from "./helpers";

beforeAll(setupDb);
afterAll(closePool);

/**
 * The API surface is an allowlist. If a future migration exposes a new table, column privilege or function
 * to the API roles, these tests fail until the allowlist (and a security review) is updated deliberately.
 */
describe("API exposure allowlist", () => {
  it("exposes exactly these functions to authenticated users", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prokind='f' and has_function_privilege('authenticated', p.oid, 'execute') order by 1`);
    expect(r.rows.map((x) => x.proname)).toEqual([
      "admin_grant_role", "admin_revoke_role", "admin_set_specialty", "archive_topic", "assign_reviewer", "can_edit_topic", "can_read_topic", "can_read_version",
      "has_role", "has_staff_role", "is_aal2", "is_published_topic", "is_staff", "publish_topic", "record_review", "record_topic_view", "restore_topic",
      "rollback_topic", "set_topic_completion", "start_revision", "submit_for_review", "try_uuid", "validate_topic_for_review", "withdraw_submission",
    ]);
  });

  it("exposes only visibility predicates to anonymous users", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prokind='f' and has_function_privilege('anon', p.oid, 'execute') order by 1`);
    expect(r.rows.map((x) => x.proname)).toEqual(["can_edit_topic", "can_read_topic", "can_read_version", "is_published_topic", "try_uuid"]);
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

  it("restricts writable topic columns to editorial fields", async () => {
    const r = await owner.query(`select column_name from information_schema.column_privileges
      where table_schema='public' and table_name='topics' and grantee='authenticated' and privilege_type='UPDATE' order by 1`);
    const cols = r.rows.map((x) => x.column_name);
    expect(cols).not.toEqual(expect.arrayContaining(["status"]));
    for (const forbidden of ["status", "kind", "author_id", "published_version_id", "first_published_at", "last_reviewed_at", "next_review_at", "archived_at", "id"]) expect(cols).not.toContain(forbidden);
    expect(cols).toEqual(expect.arrayContaining(["title", "summary", "required_review_roles", "origin"]));
  });

  it("keeps SECURITY DEFINER functions on a fixed search_path", async () => {
    const r = await owner.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`);
    expect(r.rows).toEqual([]);
  });
});
