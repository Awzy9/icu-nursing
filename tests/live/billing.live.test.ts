/* eslint-disable @typescript-eslint/no-explicit-any -- RPC payloads are asserted structurally */
/**
 * ISOLATED STACK ONLY: the subscription functions over the real supabase-js / PostgREST transport with real Auth sessions (and real TOTP MFA for the
 * administrator). Mock payments only: nothing here contacts a payment provider.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ISOLATED } from "../../scripts/live/target";
import { PROJECT_URL, actor, cleanup, makeUser, sql } from "./helpers";

const ANON = process.env.LIVE_ANON_KEY ?? "";
const ids: string[] = [];
const rest = (path: string, token: string, init: RequestInit = {}) => fetch(`${PROJECT_URL}/rest/v1${path}`, { ...init, headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers as Record<string, string>) } });
const tokenOf = async (c: Awaited<ReturnType<typeof actor>>["c"]) => (await c.auth.getSession()).data.session!.access_token;

describe.skipIf(!ISOLATED)("isolated stack: subscriptions (mock provider) over PostgREST", () => {
  let a: Awaited<ReturnType<typeof actor>>, b: Awaited<ReturnType<typeof actor>>, adm: Awaited<ReturnType<typeof actor>>;
  beforeAll(async () => {
    await sql("update public.app_settings set environment='development', mock_payments_enabled=true");
    const ua = await makeUser("bill-a", "Billing A"), ub = await makeUser("bill-b", "Billing B"), ud = await makeUser("bill-admin", "Billing Admin");
    ids.push(ua.id, ub.id, ud.id);
    await sql(`insert into public.user_roles (user_id, role) values ('${ud.id}', 'admin') on conflict do nothing`);
    a = await actor(ua.email, ua.id); b = await actor(ub.email, ub.id); adm = await actor(ud.email, ud.id, true);
  });
  afterAll(async () => { await sql("update public.app_settings set mock_payments_enabled=false"); await cleanup(ids); });

  it("anonymous callers and unsigned tokens cannot reach any subscription function", async () => {
    const r = await fetch(`${PROJECT_URL}/rest/v1/rpc/sub_get_my`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: "{}" });
    expect(r.ok).toBe(false);
  });
  it("a learner subscribes (test), is premium, cancels, resumes, and sees only their own plan", async () => {
    expect(((await a.c.rpc("sub_get_my")).data as any).premium).toBe(false);
    const s = (await a.c.rpc("sub_mock_subscribe", { p_plan: "premium" })).data as any; expect(s).toMatchObject({ premium: true, status: "active" });
    expect((await a.c.rpc("sub_mock_subscribe", { p_plan: "premium" })).error?.message).toMatch(/already subscribed/);
    expect(((await a.c.rpc("sub_cancel")).data as any).cancel_at_period_end).toBe(true);
    expect(((await a.c.rpc("sub_resume")).data as any).cancel_at_period_end).toBe(false);
    expect(((await b.c.rpc("sub_get_my")).data as any).premium).toBe(false);
    const mine = (await (await rest("/subscriptions?select=user_id", await tokenOf(a.c))).json()) as { user_id: string }[]; expect(mine.every((x) => x.user_id === a.id)).toBe(true);
    const others = (await (await rest(`/subscriptions?user_id=eq.${a.id}&select=id`, await tokenOf(b.c))).json()) as unknown[]; expect(others).toEqual([]);
  });
  it("the table API cannot be written by a learner (no insert, update or delete), and the plan cannot be changed through it", async () => {
    const t = await tokenOf(a.c);
    for (const [method, path, body] of [["POST", "/subscriptions", { user_id: a.id, plan_code: "premium", status: "active", provider: "mock", current_period_start: new Date().toISOString(), current_period_end: new Date(Date.now() + 864e5).toISOString() }], ["PATCH", `/subscriptions?user_id=eq.${a.id}`, { plan_code: "free" }], ["DELETE", `/subscriptions?user_id=eq.${a.id}`, undefined]] as const)
      expect((await rest(path, t, { method, body: body ? JSON.stringify(body) : undefined })).ok, `${method} ${path}`).toBe(false);
  });
  it("time travel shows renewal and expiry, and an administrator with MFA can list and end access with a reason (audited), while learners cannot", async () => {
    expect(((await a.c.rpc("sub_mock_advance", { p_days: 31 })).data as any).status).toBe("active"); // renewed
    expect((await a.c.rpc("adm_sub_list", { p_query: null })).error).toBeTruthy();
    const list = (await adm.c.rpc("adm_sub_list", { p_query: a.email })).data as any[]; expect(list.map((x) => x.email)).toContain(a.email);
    expect((await adm.c.rpc("adm_sub_set", { p_user: a.id, p_plan: "premium", p_status: "canceled", p_days: 30, p_reason: "x" })).error?.message).toMatch(/reason/);
    const ended = (await adm.c.rpc("adm_sub_set", { p_user: a.id, p_plan: "premium", p_status: "canceled", p_days: 30, p_reason: "isolated stack test: end access" })).data as any;
    expect(ended).toMatchObject({ premium: false, status: "canceled" });
    expect(((await a.c.rpc("sub_get_my")).data as any).premium).toBe(false);
    const audit = (await sql("select count(*)::int n from public.audit_log where action='adm_sub_set'"))[0] as any; expect(audit.n).toBeGreaterThanOrEqual(1);
  });
  it("with payments switched off the same calls are refused, but a learner can still cancel", async () => {
    const c = await makeUser("bill-c", "Billing C"); ids.push(c.id); const u = await actor(c.email, c.id);
    await u.c.rpc("sub_mock_subscribe", { p_plan: "premium" });
    await sql("update public.app_settings set mock_payments_enabled=false");
    try {
      expect((await b.c.rpc("sub_mock_subscribe", { p_plan: "premium" })).error?.message).toMatch(/not enabled/);
      expect(((await u.c.rpc("sub_cancel")).data as any).cancel_at_period_end).toBe(true);
    } finally { await sql("update public.app_settings set mock_payments_enabled=true"); }
  });
});
