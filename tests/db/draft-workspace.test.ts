/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

let author: string, reviewer: string, learner: string, admin: string;
const A = (id: string) => ({ id, aal: "aal2" as const });
const call = async (id: string | null, sql: string, p: unknown[] = []) => (await asUser(id ? A(id) : null, sql, p)).rows[0] as Record<string, any>;
const set = (id: string | null, key: string, field: string, v: string) => call(id, "select public.adm_set_draft_note($1,$2,$3)", [key, field, v]);
const notes = async (id: string, key: string) => (await call(id, "select public.adm_draft_notes($1) as n", [key])).n as { notes: Record<string, any>; revisions: any[] };

beforeAll(async () => {
  await setupDb();
  author = await createUser(uniqueEmail("author")); await grantRole(author, "author");
  reviewer = await createUser(uniqueEmail("reviewer")); await grantRole(reviewer, "clinical_reviewer");
  admin = await createUser(uniqueEmail("admin")); await grantRole(admin, "admin");
  learner = await createUser(uniqueEmail("learner"));
});
afterAll(closePool);

describe("draft workspace: authorization", () => {
  it("refuses learners and anonymous callers everywhere, and everyone any direct table access", async () => {
    for (const who of [learner, null]) {
      await expectDenied(call(who, "select public.adm_draft_notes_summary()"));
      await expectDenied(call(who, "select public.adm_draft_notes('SK-01')"));
      await expectDenied(set(who, "SK-01", "owner_note", "x"));
    }
    for (const who of [learner, author, admin, reviewer]) {
      await expectDenied(asUser(A(who), "select * from public.draft_notes"));
      await expectDenied(asUser(A(who), "select * from public.draft_note_revisions"));
      await expectDenied(asUser(A(who), "insert into public.draft_notes (draft_key, field, value, updated_by) values ('SK-01','owner_note','x',$1)", [who]));
    }
  });
  it("needs MFA (aal2) for staff reads and writes", async () => {
    await expectDenied(asUser({ id: author, aal: "aal1" as const }, "select public.adm_draft_notes_summary()"));
    await expectDenied(asUser({ id: author, aal: "aal1" as const }, "select public.adm_set_draft_note('SK-01','owner_note','x')"));
  });
  it("lets a clinical reviewer read but not write (nothing here assigns or records reviews)", async () => {
    await set(author, "SK-02", "owner_note", "Needs a current source for suctioning.");
    expect((await notes(reviewer, "SK-02")).notes.owner_note.value).toMatch(/suctioning/);
    await expectDenied(set(reviewer, "SK-02", "owner_note", "changed"));
  });
});

describe("draft workspace: notes, revisions and audit", () => {
  it("stores a note, keeps revision history, ignores no-op edits and records clears", async () => {
    await set(author, "MD-05", "evidence_note", "Label only.");
    await set(author, "MD-05", "evidence_note", "Label only.");
    await set(admin, "MD-05", "evidence_note", "Label and one UK guideline read in part.");
    await set(admin, "MD-05", "evidence_note", "");
    const n = await notes(admin, "MD-05");
    expect(n.notes).toEqual({});
    expect(n.revisions.map((r) => [r.old, r.new])).toEqual([["Label and one UK guideline read in part.", null], ["Label only.", "Label and one UK guideline read in part."], [null, "Label only."]]);
    const sum = (await call(admin, "select public.adm_draft_notes_summary() as s")).s;
    expect(sum["SK-02"].fields).toBe(1);
    expect(sum["MD-05"]).toBeUndefined();
  });
  it("audits every change with lengths only, never the text, and the revision table is append-only", async () => {
    await set(author, "EQ-01", "status_note", "Parameter explanations need a source.");
    const a = (await owner.query("select actor, action, details::text d from public.audit_log where entity_type='draft_note' and entity_id='EQ-01:status_note'")).rows;
    expect(a).toHaveLength(1);
    expect(a[0].actor).toBe(author); expect(a[0].action).toBe("draft_note_set");
    expect(a[0].d).not.toMatch(/Parameter explanations/); expect(JSON.parse(a[0].d)).toEqual({ old_length: 0, new_length: "Parameter explanations need a source.".length });
    await expect(owner.query("update public.draft_note_revisions set new_value='x'")).rejects.toThrow(/append-only/);
    await expect(owner.query("delete from public.draft_note_revisions")).rejects.toThrow(/append-only/);
  });
  it("validates keys and fields, caps the length, and refuses doses and rates", async () => {
    await expect(set(author, "NOPE-01", "owner_note", "x")).rejects.toThrow(/invalid draft key/);
    await expect(set(author, "SK-01'; drop table x", "owner_note", "x")).rejects.toThrow(/invalid draft key/);
    await expect(set(author, "SK-01", "approved", "yes")).rejects.toThrow(/invalid field/);
    await expect(set(author, "SK-01", "owner_note", "x".repeat(1001))).rejects.toThrow(/refused/);
    for (const t of ["give 5 mg per hour", "run at 10 units/hour", "0.1 mcg/kg/min", "500 ml bolus"]) await expect(set(author, "MD-01", "owner_note", t), t).rejects.toThrow(/dose or a rate|refused/);
    await set(author, "MD-01", "owner_note", "Check the label version before the next update.");
  });
  it("has no approval, review or publication capability: no function or table here touches roles, reviews or learner content", async () => {
    const fns = (await owner.query("select proname, prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'adm_%draft%'")).rows;
    expect(fns.map((f) => f.proname).sort()).toEqual(["adm_draft_notes", "adm_draft_notes_summary", "adm_set_draft_note"]);
    for (const f of fns) expect(f.prosrc).not.toMatch(/user_roles|review_assignments|content_reviews|published|approved/i);
    const others = (await owner.query("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and prosrc ilike '%draft_notes%' and proname not like 'adm_%draft%' and proname not like 'draft_note%'")).rows;
    expect(others).toEqual([]);
  });
  it("never blocks account deletion: deleting the staff member keeps the note and revisions with no author", async () => {
    const temp = await createUser(uniqueEmail("temp")); await grantRole(temp, "author");
    await set(temp, "XQ-02", "owner_note", "Left a note before leaving.");
    await owner.query("delete from auth.users where id = $1", [temp]);
    const n = await notes(admin, "XQ-02");
    expect(n.notes.owner_note.updated_by).toBe("former staff member");
    expect(n.revisions[0].by).toBe("former staff member");
  });
  it("limits changes to 40 per user per hour", async () => {
    const bob = await createUser(uniqueEmail("bob")); await grantRole(bob, "author");
    for (let i = 0; i < 40; i++) await set(bob, "XQ-01", "owner_note", `note ${i}`);
    await expect(set(bob, "XQ-01", "owner_note", "one too many")).rejects.toThrow(/too many changes/);
  });
});
