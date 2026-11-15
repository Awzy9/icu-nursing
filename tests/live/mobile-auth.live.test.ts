/* eslint-disable @typescript-eslint/no-explicit-any -- SQL rows and RPC payloads are asserted structurally */
/**
 * ISOLATED STACK ONLY: the mobile app's real auth/session/RPC modules (mobile/src/auth, mobile/src/api) running against a local Supabase stack
 * with Cloudflare's test CAPTCHA keys. Proves: CAPTCHA is still enforced, tokens survive in a size-limited secure store, sessions refresh and
 * revoke, RPC contracts match the shared schemas, the published-content gate holds, learners are isolated, and account deletion works end to end.
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ISOLATED } from "../../scripts/live/target";
import { DUMMY_CAPTCHA, PASSWORD, PROJECT_URL, cleanup, makeUser, rawClient, sql, withMfa } from "./helpers";
import { createChunkedStorage, type SecureValueStore } from "../../mobile/src/auth/chunkedStorage";
import { createAppClient } from "../../mobile/src/auth/client";
import { readAuthConfig } from "../../mobile/src/auth/config";
import { createSessionManager } from "../../mobile/src/auth/session";
import { createRpc } from "../../mobile/src/api/rpc";

const ANON = process.env.LIVE_ANON_KEY ?? "";
const cfg = readAuthConfig({ EXPO_PUBLIC_SUPABASE_URL: PROJECT_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY: ANON, EXPO_PUBLIC_SITE_URL: "http://127.0.0.1:3100" });
const ids: string[] = [];

/** A secure store with the platform's value-size limit (2048 bytes) and key rules. */
function limitedStore() {
  const data = new Map<string, string>();
  const store: SecureValueStore = {
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => { if (v.length > 2048) throw new Error("value too large"); if (!/^[A-Za-z0-9._-]+$/.test(k)) throw new Error("bad key"); data.set(k, v); },
    remove: async (k) => void data.delete(k),
  };
  return { data, store };
}
function device(shared?: ReturnType<typeof limitedStore>, now?: () => number) {
  const s = shared ?? limitedStore();
  const client = createAppClient(cfg!, createChunkedStorage(s.store));
  return { s, client, manager: createSessionManager(client, now ? { now } : {}), rpc: createRpc(client) };
}

describe.skipIf(!ISOLATED)("isolated stack: mobile authentication, session lifecycle, RPC contracts and account deletion", () => {
  let a: { email: string; id: string }, b: { email: string; id: string };
  beforeAll(async () => {
    expect(cfg).not.toBeNull();
    for (const f of ["question", "case", "skill", "medication"]) await sql(readFileSync(`supabase/seed_${f}_fixtures.sql`, "utf8"));
    await sql("update public.app_settings set environment='development', question_fixtures_visible=true");
    a = await makeUser("mob-a", "Mobile A"); b = await makeUser("mob-b", "Mobile B"); ids.push(a.id, b.id);
  });
  afterAll(async () => { await cleanup(ids); });

  it("the server still insists on a CAPTCHA token, and the app's client never signs in without one", async () => {
    const { error } = await rawClient().auth.signInWithPassword({ email: a.email, password: PASSWORD });
    expect(error?.message ?? "").toMatch(/captcha/i);
    const d = device();
    expect(await d.manager.signIn(a.email, PASSWORD, "")).toEqual({ ok: false, error: "input" });
    expect(await d.manager.current()).toBeNull();
  });

  it("signs in with a token, stores the session in chunks that fit the secure store, restores it on a new launch, and refuses bad passwords", async () => {
    const d = device();
    expect(await d.manager.signIn(a.email, "wrong-password-123", DUMMY_CAPTCHA)).toEqual({ ok: false, error: "invalid" });
    expect(await d.manager.signIn(a.email, PASSWORD, DUMMY_CAPTCHA)).toEqual({ ok: true });
    expect(d.s.data.size).toBeGreaterThan(1);
    for (const v of d.s.data.values()) expect(v.length).toBeLessThanOrEqual(2048);
    const relaunch = device(d.s); // same secure store, brand-new client = app restart
    expect((await relaunch.manager.current())?.user.email).toBe(a.email);
    expect(await relaunch.manager.recentlyAuthenticated()).toBe(true);
  });

  it("refreshes a session that is close to expiry when the app returns to the foreground, and ends a revoked one", async () => {
    const d = device(); await d.manager.signIn(a.email, PASSWORD, DUMMY_CAPTCHA);
    const before = (await d.manager.current())!;
    const soon = device(d.s, () => before.expires_at! - 10); // the clock says 10 s before expiry
    await soon.manager.onForeground();
    const after = (await soon.manager.current())!;
    expect(after.access_token).not.toBe(before.access_token);
    await sql(`delete from auth.sessions where user_id='${a.id}'`); // revoked on the server
    const late = device(d.s, () => after.expires_at! - 10);
    await late.manager.onForeground();
    expect(await late.manager.current()).toBeNull();
    expect(d.s.data.size).toBe(0); // nothing left on the device
  });

  it("global sign-out revokes the other device's session as well", async () => {
    const phone = device(), tablet = device();
    await phone.manager.signIn(a.email, PASSWORD, DUMMY_CAPTCHA); await tablet.manager.signIn(a.email, PASSWORD, DUMMY_CAPTCHA);
    await phone.manager.signOut();
    expect(await phone.manager.current()).toBeNull(); expect(phone.s.data.size).toBe(0);
    expect((await tablet.client.auth.refreshSession()).error).toBeTruthy();
  });

  it("RPC contracts parse against the shared schemas, learners are isolated, and the published-content gate holds", async () => {
    const da = device(), db = device();
    await da.manager.signIn(a.email, PASSWORD, DUMMY_CAPTCHA); await db.manager.signIn(b.email, PASSWORD, DUMMY_CAPTCHA);
    expect((await da.rpc.equipmentState()).fixtures).toBe(true);
    expect((await da.rpc.caseList()).length).toBeGreaterThan(0);
    expect((await da.rpc.skillList()).length).toBeGreaterThan(0);
    await da.rpc.setEquipmentBookmark("SYN-EQ-001", true); await da.rpc.markEquipmentViewed("SYN-EQ-001", "sensor");
    expect((await da.rpc.equipmentState()).bookmarks).toContain("SYN-EQ-001");
    const bs = await db.rpc.equipmentState(); expect(bs.bookmarks).not.toContain("SYN-EQ-001"); expect(Object.keys(bs.viewed)).not.toContain("SYN-EQ-001");
    await da.rpc.resetEquipmentProgress("SYN-EQ-001");
    // gate: with fixtures hidden (as on any non-development database) a learner sees nothing
    await sql("update public.app_settings set question_fixtures_visible=false");
    try {
      expect((await da.rpc.equipmentState()).fixtures).toBe(false);
      expect(await da.rpc.caseList()).toEqual([]); expect(await da.rpc.skillList()).toEqual([]);
    } finally { await sql("update public.app_settings set question_fixtures_visible=true"); }
    // signed out: every learner function refuses
    await expect(device().rpc.equipmentState()).rejects.toMatchObject({ code: "auth" });
  });

  it("account deletion through the app's session manager: wrong email refused, MFA enforced, then the account and every device session are gone and others untouched", async () => {
    const doomed = await makeUser("mob-del", "Mobile Deletion"); ids.push(doomed.id);
    const phone = device(), tablet = device(), keeper = device();
    await phone.manager.signIn(doomed.email, PASSWORD, DUMMY_CAPTCHA); await tablet.manager.signIn(doomed.email, PASSWORD, DUMMY_CAPTCHA); await keeper.manager.signIn(b.email, PASSWORD, DUMMY_CAPTCHA);
    expect(await phone.manager.deleteAccount(b.email)).toEqual({ ok: false, error: "mismatch" });
    expect(await device().manager.deleteAccount(doomed.email)).toMatchObject({ ok: false }); // not signed in
    // MFA: once a verified factor exists, an aal1 session may not delete
    await withMfa(phone.client, doomed.email);
    expect(await tablet.manager.deleteAccount(doomed.email)).toEqual({ ok: false, error: "secondFactor" });
    expect(await phone.manager.deleteAccount(doomed.email)).toEqual({ ok: true });
    expect(phone.s.data.size).toBe(0);
    expect(((await sql(`select count(*)::int n from auth.users where id='${doomed.id}'`))[0] as any).n).toBe(0);
    expect((await tablet.client.auth.refreshSession()).error).toBeTruthy();
    expect((await keeper.rpc.equipmentState()).fixtures).toBe(true);
    expect(((await sql(`select count(*)::int n from auth.users where id='${b.id}'`))[0] as any).n).toBe(1);
  });
});
