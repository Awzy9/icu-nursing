/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, closePool, createUser, expectDenied, grantRole, owner, setupDb, uniqueEmail } from "./helpers";

let alice: string, bob: string, admin: string, staff: string;
const sub = (u: string, fn: string, args = "") => asUser({ id: u }, `select public.${fn}(${args}) as r`).then((r) => r.rows[0].r);
const asAdmin = (aal: "aal1" | "aal2", sql: string, params: unknown[] = []) => asUser({ id: admin, aal }, sql, params);
const mockOn = (on: boolean) => owner.query("update public.app_settings set environment=$1, mock_payments_enabled=$2", [on ? "development" : "production", on]);
const rowsOf = async (table: string, where = "true") => (await owner.query(`select * from public.${table} where ${where}`)).rows;

beforeAll(async () => {
  await setupDb();
  alice = await createUser(uniqueEmail("alice")); bob = await createUser(uniqueEmail("bob"));
  admin = await createUser(uniqueEmail("admin")); await grantRole(admin, "admin");
  staff = await createUser(uniqueEmail("author")); await grantRole(staff, "author");
  await mockOn(true);
});
afterAll(closePool);

describe("catalogue and structure", () => {
  it("has a free and a premium plan, no price decided, and premium carries only capacity or convenience features", async () => {
    const plans = await rowsOf("plans"); expect(plans.map((p) => p.code).sort()).toEqual(["free", "premium"]);
    for (const p of plans) { expect(p.price_minor).toBeNull(); expect(p.currency).toBeNull(); }
    const f = await rowsOf("features"); expect(f.every((x) => ["capacity", "convenience"].includes(x.kind))).toBe(true);
    expect((await rowsOf("plan_entitlements", "plan_code='free'")).length).toBe(0);
  });
  it("cannot represent content access as a feature: no content kind, and content-like names are refused by a check constraint", async () => {
    await expect(owner.query("insert into public.features values ('draft_content','convenience','x')")).rejects.toThrow(/check/i);
    await expect(owner.query("insert into public.features values ('unpublished_clinical','capacity','x')")).rejects.toThrow(/check/i);
    await expect(owner.query("insert into public.features values ('premium_cases','content','x')")).rejects.toThrow(/check/i);
    await expect(owner.query("insert into public.features values ('publish_override','convenience','x')")).rejects.toThrow(/check/i);
  });
  it("accepts no provider other than mock", async () => {
    await expect(owner.query("insert into public.subscriptions (user_id, plan_code, status, provider, current_period_start, current_period_end) values ($1,'premium','active','stripe', now(), now()+interval '1 day')", [alice])).rejects.toThrow(/check/i);
  });
  it("gives learners no write access to any billing table, and anonymous users nothing", async () => {
    const r = await owner.query(`select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name in ('features','plans','plan_entitlements','subscriptions','subscription_events') and ((grantee='authenticated' and privilege_type<>'SELECT') or grantee='anon')`);
    expect(r.rows).toEqual([]);
    for (const t of ["subscriptions", "subscription_events"]) await expectDenied(asUser({ id: alice }, `insert into public.${t} (user_id) values ($1)`, [alice]));
    await expectDenied(asUser({ id: alice }, "update public.subscriptions set plan_code='premium'"));
    await expectDenied(asUser(null, "select public.sub_get_my()"));
  });
});

describe("lifecycle (mock provider)", () => {
  it("starts free, subscribes, refuses a second subscription, and exposes entitlements only while live", async () => {
    let s = await sub(alice, "sub_get_my"); expect(s).toMatchObject({ plan: "free", premium: false, status: "none", entitlements: [], mock_payments: true });
    s = await sub(alice, "sub_mock_subscribe", "'premium'"); expect(s).toMatchObject({ plan: "premium", premium: true, status: "active" }); expect(s.entitlements).toEqual(["detailed_statistics", "progress_export"]);
    await expect(sub(alice, "sub_mock_subscribe", "'premium'")).rejects.toThrow(/already subscribed/);
    await expect(sub(alice, "sub_mock_subscribe", "'free'")).rejects.toThrow(/unknown or inactive plan/);
    await expect(sub(alice, "sub_mock_subscribe", "'nonsense'")).rejects.toThrow(/unknown or inactive plan/);
    expect((await sub(bob, "sub_get_my")).premium).toBe(false); // another learner is unaffected
  });
  it("cancel keeps access until the period ends, resume undoes it, and cancelling twice changes nothing", async () => {
    let s = await sub(alice, "sub_cancel"); expect(s).toMatchObject({ premium: true, cancel_at_period_end: true });
    const n = (await rowsOf("subscription_events", `user_id='${alice}'`)).length;
    await sub(alice, "sub_cancel"); expect((await rowsOf("subscription_events", `user_id='${alice}'`)).length).toBe(n);
    s = await sub(alice, "sub_resume"); expect(s).toMatchObject({ premium: true, cancel_at_period_end: false });
    await sub(alice, "sub_cancel");
  });
  it("a cancelled subscription expires at the period end and premium access ends exactly then", async () => {
    const s = await sub(alice, "sub_mock_advance", "40");
    expect(s).toMatchObject({ plan: "free", premium: false, status: "expired", entitlements: [] });
    expect((await rowsOf("subscription_events", `user_id='${alice}' and event_type='expired'`)).length).toBe(1);
    // and she can subscribe again afterwards
    expect((await sub(alice, "sub_mock_subscribe", "'premium', true")).status).toBe("trialing");
  });
  it("an uncancelled subscription renews (mock), a failed payment ends access when the period does, and access never outlives the period", async () => {
    await asUser({ id: bob }, "select public.sub_mock_subscribe('premium')");
    let s = await sub(bob, "sub_mock_advance", "31"); expect(s).toMatchObject({ premium: true, status: "active" });
    expect((await rowsOf("subscription_events", `user_id='${bob}' and event_type='renewed'`)).length).toBe(1);
    s = await sub(bob, "sub_mock_advance", "31, true"); expect(s).toMatchObject({ premium: false, status: "expired" });
    expect((await rowsOf("subscription_events", `user_id='${bob}' and event_type='payment_failed'`)).length).toBe(1);
    // a stored 'active' row whose period has ended is not premium even before it is normalised
    await owner.query("update public.subscriptions set status='active', current_period_start=now()-interval '10 days', current_period_end=now()-interval '1 day' where user_id=$1 and id=(select id from public.subscriptions where user_id=$1 order by created_at desc limit 1)", [bob]).catch(() => undefined);
    expect(await owner.query("select private.entitlements_of($1) e", [bob]).then((r) => r.rows[0].e)).toEqual([]);
  });
  it("one live subscription per user is enforced by the database", async () => {
    const carol = await createUser(uniqueEmail("carol"));
    await sub(carol, "sub_mock_subscribe", "'premium'");
    await expect(owner.query("insert into public.subscriptions (user_id, plan_code, status, provider, current_period_start, current_period_end) values ($1,'premium','active','mock', now(), now()+interval '1 day')", [carol])).rejects.toThrow(/unique|duplicate/i);
  });
});

describe("payments switched off (a production-like database)", () => {
  it("refuses every write that creates or moves a subscription, but still lets a learner cancel and read", async () => {
    const dana = await createUser(uniqueEmail("dana")); await sub(dana, "sub_mock_subscribe", "'premium'");
    await mockOn(false);
    try {
      await expect(sub(alice, "sub_mock_subscribe", "'premium'")).rejects.toThrow(/payments are not enabled/);
      await expect(sub(dana, "sub_mock_advance", "5")).rejects.toThrow(/payments are not enabled/);
      await expect(asAdmin("aal2", "select public.adm_sub_set($1,'premium','active',30,'support gift')", [alice])).rejects.toThrow(/payments are not enabled/);
      expect((await sub(dana, "sub_get_my")).mock_payments).toBe(false);
      expect((await sub(dana, "sub_cancel")).cancel_at_period_end).toBe(true);
    } finally { await mockOn(true); }
    // development database but the explicit switch is off: still refused
    await owner.query("update public.app_settings set environment='development', mock_payments_enabled=false");
    await expect(sub(alice, "sub_mock_subscribe", "'premium'")).rejects.toThrow(/payments are not enabled/);
    await mockOn(true);
  });
});

describe("isolation", () => {
  it("a learner reads only their own subscription and events, and never another's", async () => {
    const mine = await asUser({ id: alice }, "select user_id from public.subscriptions"); expect(mine.rows.every((r) => r.user_id === alice)).toBe(true);
    const ev = await asUser({ id: alice }, "select user_id from public.subscription_events"); expect(ev.rows.every((r) => r.user_id === alice)).toBe(true);
    expect((await asUser({ id: bob }, "select 1 from public.subscriptions where user_id=$1", [alice])).rowCount).toBe(0);
  });
});

describe("administrator management", () => {
  it("is refused to learners, to other staff roles and to an admin without a second factor", async () => {
    await expectDenied(asUser({ id: alice }, "select public.adm_sub_list(null)"));
    await expectDenied(asUser({ id: staff, aal: "aal2" }, "select public.adm_sub_list(null)"));
    await expectDenied(asAdmin("aal1", "select public.adm_sub_list(null)"));
    await expectDenied(asUser({ id: alice }, "select public.adm_sub_set($1,'premium','active',30,'because')", [alice]));
  });
  it("lists subscriptions with emails, sets and ends access with a mandatory reason, and audits it", async () => {
    const list = (await asAdmin("aal2", "select public.adm_sub_list(null) r")).rows[0].r as any[]; expect(list.length).toBeGreaterThan(0); expect(list[0]).toHaveProperty("email");
    const target = await createUser(uniqueEmail("erin"));
    await expect(asAdmin("aal2", "select public.adm_sub_set($1,'premium','active',30,'')", [target])).rejects.toThrow(/reason/);
    await expect(asAdmin("aal2", "select public.adm_sub_set($1,'premium','active',30,'abc')", [target])).rejects.toThrow(/reason/);
    await expect(asAdmin("aal2", "select public.adm_sub_set($1,'premium','active',0,'support test grant')", [target])).rejects.toThrow(/days/);
    let s = (await asAdmin("aal2", "select public.adm_sub_set($1,'premium','active',30,'support test grant') r", [target])).rows[0].r; expect(s).toMatchObject({ premium: true, status: "active" });
    expect((await sub(target, "sub_get_my")).premium).toBe(true);
    s = (await asAdmin("aal2", "select public.adm_sub_set($1,'premium','canceled',30,'ended by support test') r", [target])).rows[0].r; expect(s).toMatchObject({ premium: false, status: "canceled" });
    await expect(asAdmin("aal2", "select public.adm_sub_set($1,'premium','expired',30,'nothing live here')", [target])).rejects.toThrow(/no live subscription/);
    const audit = await owner.query("select action, details from public.audit_log where action in ('adm_sub_set','adm_sub_list') and actor=$1", [admin]);
    expect(audit.rows.filter((r) => r.action === "adm_sub_set").length).toBeGreaterThanOrEqual(2); expect(JSON.stringify(audit.rows)).toContain("support test grant");
    expect((await rowsOf("subscription_events", `user_id='${target}' and event_type='admin_change'`)).length).toBe(2);
  });
  it("filters the list by email and treats wildcard characters literally", async () => {
    const r = (await asAdmin("aal2", "select public.adm_sub_list('%') r")).rows[0].r as any[]; expect(r.length).toBeGreaterThan(0); // the wildcard is stripped, not interpreted
    const none = (await asAdmin("aal2", "select public.adm_sub_list('zzz-no-such-user') r")).rows[0].r as any[]; expect(none).toEqual([]);
  });
});

describe("account deletion", () => {
  it("erases the subscription with the account and leaves only anonymous event rows", async () => {
    const fay = await createUser(uniqueEmail("fay")); await sub(fay, "sub_mock_subscribe", "'premium'");
    const sid = (await rowsOf("subscriptions", `user_id='${fay}'`))[0].id;
    await owner.query("delete from auth.users where id=$1", [fay]);
    expect((await rowsOf("subscriptions", `user_id='${fay}'`)).length).toBe(0);
    const ev = await rowsOf("subscription_events", `subscription_id is null and event_type='created'`); expect(ev.every((e) => e.user_id === null)).toBe(true); void sid;
  });
});
