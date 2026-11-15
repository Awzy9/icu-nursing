/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, owner, setupDb, uniqueEmail } from "./helpers";

let alice: string, bob: string;
const rpc = async (who: string | null, text: string, params: unknown[] = []) => (await asUser(who ? { id: who } : null, text, params)).rows[0] as Record<string, any>;
const state = async (u: string) => (await rpc(u, "select public.eq_state() as s")).s as { fixtures: boolean; bookmarks: string[]; viewed: Record<string, string[]> };
const bookmark = (u: string, code: string, on: boolean) => rpc(u, "select public.eq_set_bookmark($1,$2)", [code, on]);
const view = (u: string, code: string, part: string) => rpc(u, "select public.eq_mark_viewed($1,$2)", [code, part]);

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice"));
  bob = await createUser(uniqueEmail("bob"));
});
afterAll(closePool);

describe("equipment persistence: fixture isolation", () => {
  it("is empty and refuses writes while fixtures are off, and on a non-development database", async () => {
    expect(await state(alice)).toEqual({ fixtures: false, bookmarks: [], viewed: {} });
    await expect(bookmark(alice, "SYN-EQ-001", true)).rejects.toThrow(/module not found/);
    await expect(view(alice, "SYN-EQ-001", "sensor")).rejects.toThrow(/module not found/);
    await owner.query("update public.app_settings set environment='development', question_fixtures_visible=true");
    expect((await state(alice)).fixtures).toBe(true);
    await owner.query("alter table public.app_settings drop constraint app_settings_fixtures_dev_only");
    await owner.query("update public.app_settings set environment='production'");
    expect((await state(alice)).fixtures).toBe(false);
    await expect(bookmark(alice, "SYN-EQ-001", true)).rejects.toThrow(/module not found/);
    await owner.query("update public.app_settings set environment='development'");
    await owner.query("alter table public.app_settings add constraint app_settings_fixtures_dev_only check (not question_fixtures_visible or environment = 'development')");
  });
  it("can never store a non-synthetic (clinical) module code, even for the table owner", async () => {
    for (const code of ["EQ-01", "SYN-EQ-1", "syn-eq-001", "SYN-EQ-0011", "ICU-VENT-01", "SYN-EQ-001; drop table x"]) {
      await expect(owner.query("insert into public.equipment_bookmarks (user_id, module_code) values ($1,$2)", [alice, code]), code).rejects.toThrow(/check constraint/);
      await expect(bookmark(alice, code, true), code).rejects.toThrow(/invalid module/);
    }
    await expect(view(alice, "SYN-EQ-001", "Bad Part")).rejects.toThrow(/invalid selection/);
    await expect(view(alice, "SYN-EQ-001", "")).rejects.toThrow(/invalid selection/);
  });
});

describe("equipment persistence: users, sessions and devices", () => {
  it("saves bookmarks and viewed parts per user and returns them in any later session or device", async () => {
    await bookmark(alice, "SYN-EQ-002", true);
    await bookmark(alice, "SYN-EQ-001", true);
    await bookmark(alice, "SYN-EQ-001", true); // idempotent
    await view(alice, "SYN-EQ-002", "peak");
    await view(alice, "SYN-EQ-002", "rise");
    await view(alice, "SYN-EQ-002", "peak"); // idempotent
    // a "second device" is simply another request by the same user: the state comes from the database, not the browser
    const s = await state(alice);
    expect(s.bookmarks).toEqual(["SYN-EQ-001", "SYN-EQ-002"]);
    expect(s.viewed["SYN-EQ-002"]).toEqual(["peak", "rise"]);
    await bookmark(alice, "SYN-EQ-001", false);
    expect((await state(alice)).bookmarks).toEqual(["SYN-EQ-002"]);
    await rpc(alice, "select public.eq_reset_progress($1)", ["SYN-EQ-002"]);
    expect((await state(alice)).viewed).toEqual({});
  });
  it("keeps one user's data invisible to and unchangeable by another", async () => {
    await bookmark(alice, "SYN-EQ-003", true);
    await view(alice, "SYN-EQ-003", "gauge");
    expect(await state(bob)).toEqual({ fixtures: true, bookmarks: [], viewed: {} });
    expect((await asUser({ id: bob }, "select * from public.equipment_bookmarks")).rows).toEqual([]);
    expect((await asUser({ id: bob }, "select * from public.equipment_progress")).rows).toEqual([]);
    await bookmark(bob, "SYN-EQ-003", false); // only ever deletes bob's own (nonexistent) row
    await rpc(bob, "select public.eq_reset_progress($1)", ["SYN-EQ-003"]);
    const s = await state(alice);
    expect(s.bookmarks).toContain("SYN-EQ-003");
    expect(s.viewed["SYN-EQ-003"]).toEqual(["gauge"]);
  });
  it("denies direct writes, writes as another user, and anonymous access", async () => {
    await expectDenied(asUser({ id: alice }, "insert into public.equipment_bookmarks (user_id, module_code) values ($1,'SYN-EQ-004')", [alice]));
    await expectDenied(asUser({ id: alice }, "insert into public.equipment_progress (user_id, module_code, part_id) values ($1,'SYN-EQ-004','pump')", [alice]));
    await expectDenied(asUser({ id: alice }, "delete from public.equipment_bookmarks"));
    await expectDenied(asUser({ id: alice }, "update public.equipment_progress set user_id = $1", [bob]));
    await expectDenied(asUser(null, "select public.eq_state()"));
    await expectDenied(asUser(null, "select * from public.equipment_bookmarks"));
    await expectDenied(asUser(null, "select public.eq_set_bookmark('SYN-EQ-001', true)"));
  });
  it("removes a user's rows when the account is deleted", async () => {
    const carol = await createUser(uniqueEmail("carol"));
    await bookmark(carol, "SYN-EQ-005", true);
    await view(carol, "SYN-EQ-005", "pads");
    await owner.query("delete from auth.users where id = $1", [carol]);
    expect((await owner.query("select 1 from public.equipment_bookmarks where user_id=$1", [carol])).rows).toEqual([]);
    expect((await owner.query("select 1 from public.equipment_progress where user_id=$1", [carol])).rows).toEqual([]);
  });
  it("enforces ceilings (50 bookmarks per learner, 8 parts per module)", async () => {
    const dan = await createUser(uniqueEmail("dan"));
    for (let i = 1; i <= 50; i++) await bookmark(dan, `SYN-EQ-${String(i).padStart(3, "0")}`, true);
    await expect(bookmark(dan, "SYN-EQ-051", true)).rejects.toThrow(/bookmark limit/);
    await bookmark(dan, "SYN-EQ-050", false);
    await bookmark(dan, "SYN-EQ-051", true);
    for (const p of ["a", "b", "c", "d", "e", "f", "g", "h"]) await view(dan, "SYN-EQ-001", p);
    await expect(view(dan, "SYN-EQ-001", "i")).rejects.toThrow(/progress limit/);
    await view(dan, "SYN-EQ-001", "h"); // already recorded: still fine
  });
});
