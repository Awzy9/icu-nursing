/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";
import { caseSeedSql, loadCaseFixtures } from "../../src/lib/cases/fixtures";

const now = () => Math.floor(Date.now() / 1000);
const fresh = (method = "password") => [{ method, timestamp: now() - 30 }];
const stale = [{ method: "password", timestamp: now() - 3600 }];
const del = (id: string, email: string, amr: { method: string; timestamp: number }[] | undefined, aal: "aal1" | "aal2" = "aal1") =>
  asUser({ id, aal, amr }, "select public.delete_my_account($1) as r", [email]);
const exists = async (id: string) => (await owner.query("select 1 from auth.users where id=$1", [id])).rowCount === 1;
const count = async (table: string, id: string) => (await owner.query(`select count(*)::int n from public.${table} where user_id=$1`, [id])).rows[0].n as number;

const emailOf: Record<string, string> = {};
const mk = async (p: string, role?: string) => { const e = uniqueEmail(p); const id = await createUser(e); emailOf[id] = e; if (role) await grantRole(id, role); return id; };
let alice: string, bob: string;
const caseId = loadCaseFixtures()[0]!.id;

beforeAll(async () => {
  await setupDb();
  await owner.query(caseSeedSql());
  await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
  alice = await mk("alice"); bob = await mk("bob");
});
afterAll(closePool);

describe("self-service account deletion: authorization", () => {
  it("refuses anonymous callers and callers without a recent sign-in, whatever else is right", async () => {
    await expectDenied(asUser(null, "select public.delete_my_account('x@example.test')"));
    for (const amr of [undefined, [], stale, [{ method: "password", timestamp: now() + 3600 }], [{ method: "password" }], [{ method: "password", timestamp: "now" as unknown as number }]])
      await expect(del(alice, emailOf[alice]!, amr as any)).rejects.toThrow(/recent sign-in required/);
    expect(await exists(alice)).toBe(true);
  });
  it("accepts the newest of several authentication methods and rejects a confirmation that is not the caller's email", async () => {
    await expect(del(alice, emailOf[bob]!, fresh())).rejects.toThrow(/confirmation does not match/); // another person's email does not work
    await expect(del(alice, "", fresh())).rejects.toThrow(/confirmation does not match/);
    await expect(del(alice, "someone@else.test", fresh())).rejects.toThrow(/confirmation does not match/);
    expect(await exists(alice)).toBe(true); expect(await exists(bob)).toBe(true);
  });
  it("cannot be pointed at another user: the function has no user parameter and only ever deletes the caller", async () => {
    const fn = (await owner.query("select pg_get_function_arguments(p.oid) a from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='delete_my_account'")).rows;
    expect(fn).toEqual([{ a: "p_email text" }]);
    const carol = await mk("carol"); const dave = await mk("dave");
    await del(carol, emailOf[carol]!, fresh());
    expect(await exists(carol)).toBe(false); expect(await exists(dave)).toBe(true); expect(await exists(alice)).toBe(true);
  });
  it("is closed to staff and to anyone holding retained clinical review records", async () => {
    for (const role of ["author", "clinical_reviewer", "publisher", "admin"]) {
      const s = await mk(`staff-${role}`, role);
      await expect(del(s, emailOf[s]!, fresh(), "aal2")).rejects.toThrow(/staff accounts are removed by an administrator/);
      expect(await exists(s)).toBe(true);
    }
    // a former reviewer: role revoked, but the review record remains and must not be erased
    const rev = await mk("former-reviewer", "clinical_reviewer");
    const topic = (await owner.query("insert into public.topics (slug, domain_id, title, summary) select 'del-test-' || substr(md5(random()::text),1,6), id, '{\"en\":\"t\"}', '{\"en\":\"s\"}' from public.nursing_domains limit 1 returning id")).rows[0].id;
    const ver = (await owner.query("insert into public.content_versions (topic_id, version_no, status, snapshot, required_review_roles, origin) values ($1, 1, 'in_review', '{}', '{NE}', 'human') returning id", [topic])).rows[0].id;
    await owner.query("insert into public.content_reviews (version_id, reviewer_id, specialty, decision) values ($1,$2,'NE','approve')", [ver, rev]);
    await owner.query("delete from public.user_roles where user_id=$1 and role='clinical_reviewer'", [rev]);
    await expect(del(rev, emailOf[rev]!, fresh())).rejects.toThrow(/retained clinical review records/);
    expect(await exists(rev)).toBe(true);
  });
  it("needs a second factor for a user who has one enrolled (when the auth schema has factors)", async () => {
    const has = (await owner.query("select to_regclass('auth.mfa_factors') is not null as t")).rows[0].t;
    if (!has) { await owner.query("create table auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, status text not null)"); }
    const e = await mk("mfa-learner");
    await owner.query("insert into auth.mfa_factors (user_id, status) values ($1, 'verified')", [e]);
    await expect(del(e, emailOf[e]!, fresh(), "aal1")).rejects.toThrow(/second-factor verification required/);
    await del(e, emailOf[e]!, fresh("totp"), "aal2");
    expect(await exists(e)).toBe(false);
  });
});

describe("self-service account deletion: data handling", () => {
  it("erases the learner's rows everywhere, keeps other users' data, and leaves an audit entry with no personal data", async () => {
    const eve = await mk("eve"), frank = await mk("frank");
    for (const u of [eve, frank]) {
      const att = (await asUser({ id: u }, "select public.cs_start($1) as id", [caseId])).rows[0].id;
      expect(att).toBeTruthy();
      await asUser({ id: u }, "select public.eq_set_bookmark('SYN-EQ-001', true)");
      await asUser({ id: u }, "select public.eq_mark_viewed('SYN-EQ-001', 'peak')");
    }
    expect(await count("case_attempts", eve)).toBe(1); expect(await count("equipment_bookmarks", eve)).toBe(1);
    const before = (await owner.query("select count(*)::int n from public.audit_log")).rows[0].n;
    await del(eve, emailOf[eve]!, fresh());
    for (const t of ["case_attempts", "case_attempt_steps", "equipment_bookmarks", "equipment_progress", "bookmarks", "learning_progress", "quiz_attempts", "question_bookmarks", "skill_sessions", "skill_bookmarks", "medication_bookmarks", "learner_review_schedule"])
      expect(await count(t, eve), t).toBe(0);
    expect((await owner.query("select 1 from public.profiles where id=$1", [eve])).rowCount).toBe(0);
    expect((await owner.query("select 1 from public.user_roles where user_id=$1", [eve])).rowCount).toBe(0);
    expect(await count("case_attempts", frank)).toBe(1); expect(await count("equipment_progress", frank)).toBe(1); expect(await exists(frank)).toBe(true);
    const audit = (await owner.query("select actor, action, entity_type, entity_id, details::text d from public.audit_log order by id desc limit 1")).rows[0];
    expect((await owner.query("select count(*)::int n from public.audit_log")).rows[0].n).toBe(before + 1);
    expect(audit.actor).toBeNull(); expect(audit.action).toBe("account_deleted"); expect(audit.entity_id).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.parse(audit.d)).toEqual({ method: "self_service" });
    expect(JSON.stringify(audit)).not.toContain(emailOf[eve]!); expect(JSON.stringify(audit)).not.toContain(eve);
    // no audit row written during the deletion mentions the deleted user's id (the cascaded role rows are not logged)
    expect((await owner.query("select count(*)::int n from public.audit_log where id > (select max(id) from public.audit_log) - 1 and (details::text like '%'||$1||'%' or entity_id=$1)", [eve])).rows[0].n).toBe(0);
  });
  it("signed-in tokens of a deleted user can no longer act: nothing is readable or writable for them", async () => {
    const gina = await mk("gina");
    await asUser({ id: gina }, "select public.eq_set_bookmark('SYN-EQ-002', true)");
    await del(gina, emailOf[gina]!, fresh());
    await expect(asUser({ id: gina }, "select public.eq_set_bookmark('SYN-EQ-002', true)")).rejects.toThrow(); // foreign key: the user no longer exists
    expect((await asUser({ id: gina }, "select * from public.equipment_bookmarks")).rows).toEqual([]);
    await expect(del(gina, emailOf[gina]!, fresh())).rejects.toThrow(/confirmation does not match/); // a second call cannot match a vanished email
  });
  it("other role deletions are still audited (administrator revoking a role)", async () => {
    const hank = await mk("hank", "author"); const before = (await owner.query("select count(*)::int n from public.audit_log")).rows[0].n;
    await owner.query("delete from public.user_roles where user_id=$1 and role='author'", [hank]);
    expect((await owner.query("select count(*)::int n from public.audit_log")).rows[0].n).toBe(before + 1);
  });
  it("design guard: every foreign key to auth.users cascades or sets null, except the documented retained review records", async () => {
    const r = (await owner.query(`
      select c.conrelid::regclass::text as tbl, a.attname as col, c.confdeltype as act
      from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum = any(c.conkey)
      where c.contype='f' and c.confrelid='auth.users'::regclass and c.confdeltype not in ('c','n')`)).rows;
    expect(r.map((x: any) => `${x.tbl}.${x.col}`)).toEqual(["content_reviews.reviewer_id"]);
  });
});
