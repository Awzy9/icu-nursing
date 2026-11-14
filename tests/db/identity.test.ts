import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, uniqueEmail } from "./helpers";

let alice: string, bob: string, admin: string, author: string;

beforeAll(async () => {
  alice = await createUser(uniqueEmail("alice"), { display_name: "Alice" });
  bob = await createUser(uniqueEmail("bob"));
  admin = await createUser(uniqueEmail("admin"));
  author = await createUser(uniqueEmail("author"));
  await grantRole(admin, "admin");
  await grantRole(author, "author");
});
afterAll(closePool);

describe("new user bootstrap", () => {
  it("creates a profile and the learner role", async () => {
    const p = await owner.query("select display_name, email from public.profiles where id = $1", [alice]);
    expect(p.rows[0].display_name).toBe("Alice");
    const r = await owner.query("select role from public.user_roles where user_id = $1", [alice]);
    expect(r.rows.map((x) => x.role)).toEqual(["learner"]);
  });
  it("never takes roles from user-controlled metadata", async () => {
    const evil = await createUser(uniqueEmail("evil"), { display_name: "Evil", role: "admin", roles: ["admin"], app_metadata: { role: "admin" } });
    const r = await owner.query("select role from public.user_roles where user_id = $1", [evil]);
    expect(r.rows.map((x) => x.role)).toEqual(["learner"]);
  });
  it("truncates absurd display names instead of failing signup", async () => {
    const id = await createUser(uniqueEmail("long"), { display_name: "x".repeat(500) });
    const r = await owner.query("select char_length(display_name) as n from public.profiles where id = $1", [id]);
    expect(r.rows[0].n).toBe(80);
  });
});

describe("profile isolation", () => {
  it("lets a user read and update only their own profile", async () => {
    expect((await asUser({ id: alice }, "select id from public.profiles")).rows.map((r) => r.id)).toEqual([alice]);
    await asUser({ id: alice }, "update public.profiles set display_name = 'Alice B', country = 'GB' where id = $1", [alice]);
    const upd = await asUser({ id: alice }, "update public.profiles set display_name = 'hacked' where id = $1 returning id", [bob]);
    expect(upd.rowCount).toBe(0);
    expect((await owner.query("select display_name from public.profiles where id = $1", [bob])).rows[0].display_name).toBeNull();
  });
  it("blocks changing protected columns", async () => {
    await expectDenied(asUser({ id: alice }, "update public.profiles set email = 'x@y.z' where id = $1", [alice]));
    await expectDenied(asUser({ id: alice }, "update public.profiles set id = gen_random_uuid() where id = $1", [alice]));
  });
  it("validates profile fields", async () => {
    await expect(asUser({ id: alice }, "update public.profiles set country = 'gbr' where id = $1", [alice])).rejects.toThrow(/check/i);
    await expect(asUser({ id: alice }, "update public.profiles set experience_level = 'god' where id = $1", [alice])).rejects.toThrow(/check/i);
  });
  it("lets administrators (with MFA) read all profiles but not unauthenticated users", async () => {
    expect((await asUser({ id: admin, aal: "aal2" }, "select count(*)::int as n from public.profiles")).rows[0].n).toBeGreaterThanOrEqual(4);
    await expectDenied(asUser(null, "select * from public.profiles"));
  });
  it("hides all profiles from an administrator who has not completed MFA", async () => {
    expect((await asUser({ id: admin, aal: "aal1" }, "select count(*)::int as n from public.profiles")).rows[0].n).toBe(1);
  });
});

describe("roles", () => {
  it("shows users only their own roles", async () => {
    const r = await asUser({ id: alice }, "select user_id, role from public.user_roles");
    expect(r.rows.every((x) => x.user_id === alice)).toBe(true);
  });
  it("cannot be self-granted through the API", async () => {
    await expectDenied(asUser({ id: alice }, "insert into public.user_roles (user_id, role) values ($1, 'admin')", [alice]));
    await expectDenied(asUser({ id: alice }, "update public.user_roles set role = 'admin' where user_id = $1", [alice]));
    await expectDenied(asUser({ id: alice }, "delete from public.user_roles where user_id = $1", [alice]));
    await expectDenied(asUser({ id: alice }, "select public.admin_grant_role($1, 'admin')", [alice]));
  });
  it("requires administrator + MFA to grant roles", async () => {
    await expectDenied(asUser({ id: admin, aal: "aal1" }, "select public.admin_grant_role($1, 'author')", [bob]));
    await asUser({ id: admin, aal: "aal2" }, "select public.admin_grant_role($1, 'author')", [bob]);
    expect((await owner.query("select 1 from public.user_roles where user_id=$1 and role='author'", [bob])).rowCount).toBe(1);
  });
  it("records role changes in the audit log with the actor", async () => {
    const a = await owner.query("select actor, action, details->'new'->>'role' as role from public.audit_log where entity_type='user_roles' and entity_id=$1 and action='INSERT' and details->'new'->>'role'='author'", [bob]);
    expect(a.rows[0].actor).toBe(admin);
  });
  it("refuses to revoke the learner role or the last administrator", async () => {
    await expect(asUser({ id: admin, aal: "aal2" }, "select public.admin_revoke_role($1, 'learner')", [bob])).rejects.toThrow(/learner/);
    await expect(asUser({ id: admin, aal: "aal2" }, "select public.admin_revoke_role($1, 'admin')", [admin])).rejects.toThrow(/last administrator/);
  });
  it("revokes a normal staff role", async () => {
    await asUser({ id: admin, aal: "aal2" }, "select public.admin_revoke_role($1, 'author')", [bob]);
    expect((await owner.query("select 1 from public.user_roles where user_id=$1 and role='author'", [bob])).rowCount).toBe(0);
  });
});

describe("staff MFA enforcement", () => {
  it("treats staff roles as inactive without aal2", async () => {
    expect((await asUser({ id: author, aal: "aal1" }, "select public.has_staff_role('author') as ok")).rows[0].ok).toBe(false);
    expect((await asUser({ id: author, aal: "aal2" }, "select public.has_staff_role('author') as ok")).rows[0].ok).toBe(true);
  });
  it("never requires MFA for plain learners", async () => {
    expect((await asUser({ id: alice, aal: "aal1" }, "select public.has_staff_role('learner') as ok")).rows[0].ok).toBe(true);
  });
});

describe("audit log", () => {
  it("is readable only by administrators with MFA", async () => {
    expect((await asUser({ id: admin, aal: "aal2" }, "select count(*)::int as n from public.audit_log")).rows[0].n).toBeGreaterThan(0);
    expect((await asUser({ id: alice }, "select count(*)::int as n from public.audit_log")).rows[0].n).toBe(0);
    expect((await asUser({ id: admin, aal: "aal1" }, "select count(*)::int as n from public.audit_log")).rows[0].n).toBe(0);
  });
  it("is append-only, even for the database owner", async () => {
    await expect(owner.query("update public.audit_log set action = 'x'")).rejects.toThrow(/append-only/);
    await expect(owner.query("delete from public.audit_log")).rejects.toThrow(/append-only/);
    await expect(owner.query("truncate public.audit_log")).rejects.toThrow(/append-only/);
    await expectDenied(asUser({ id: admin, aal: "aal2" }, "insert into public.audit_log (action, entity_type) values ('forged','x')"));
  });
});

describe("default deny", () => {
  it("gives anonymous users no access to private tables", async () => {
    for (const t of ["profiles", "user_roles", "audit_log", "reviewer_specialties", "app_settings"]) {
      await expectDenied(asUser(null, `select * from public.${t}`));
    }
  });
  it("gives authenticated users no access to app_settings", async () => {
    await expectDenied(asUser({ id: admin, aal: "aal2" }, "select * from public.app_settings"));
  });
  it("has row level security enabled on every public table", async () => {
    const r = await owner.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity");
    expect(r.rows).toEqual([]);
  });
});

describe("sign-up metadata hardening", () => {
  it("accepts only whitelisted profile fields and ignores invalid values", async () => {
    const ok = await createUser(uniqueEmail("meta"), { display_name: " Dana ", experience_level: "advanced", country: "SA", preferred_locale: "ar" });
    const bad = await createUser(uniqueEmail("meta2"), { experience_level: "wizard", country: "Saudi", preferred_locale: "'; drop table x;--" });
    const a = (await owner.query("select display_name, experience_level, country, preferred_locale from public.profiles where id=$1", [ok])).rows[0];
    expect(a).toEqual({ display_name: "Dana", experience_level: "advanced", country: "SA", preferred_locale: "ar" });
    const b = (await owner.query("select experience_level, country, preferred_locale from public.profiles where id=$1", [bad])).rows[0];
    expect(b).toEqual({ experience_level: null, country: null, preferred_locale: "en" });
  });
});
