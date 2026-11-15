import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MockPaymentProvider, MAX_WEBHOOK_BYTES } from "@/lib/billing/provider";
import { createBillingFixtureService } from "@/lib/billing/fixture-service";
import { BillingError } from "@/lib/billing/types";
import { FEATURES, FEATURE_KINDS, FREE_STATE, PLAN_CATALOG, advance, cancel, hasEntitlement, newSim, normalise, resume, stateOf, subscribe, subscriptionStateSchema, type Sim } from "@icu/schemas/subscription";

const DAY = 86_400_000; const T0 = Date.UTC(2026, 0, 1);
const ok = (r: { ok: boolean; sim?: Sim }) => { if (!r.ok) throw new Error("expected ok"); return r.sim!; };

describe("subscription model (pure simulation that mirrors the database functions)", () => {
  it("starts free with no entitlements and a schema-valid state", () => {
    const s = stateOf(newSim(), T0, true);
    expect(s).toMatchObject({ plan: "free", premium: false, status: "none", entitlements: [] }); expect(subscriptionStateSchema.safeParse(s).success).toBe(true);
    expect(subscriptionStateSchema.safeParse(FREE_STATE).success).toBe(true);
  });
  it("subscribes once, premium carries the catalogue's features, and a second subscription is refused", () => {
    const a = ok(subscribe(newSim(), "premium", false, T0));
    expect(stateOf(a, T0, true)).toMatchObject({ plan: "premium", premium: true, status: "active", entitlements: [...PLAN_CATALOG.premium.features] });
    expect(subscribe(a, "premium", false, T0)).toEqual({ ok: false, error: "already_subscribed" });
    expect(subscribe(newSim(), "free", false, T0)).toEqual({ ok: false, error: "invalid" });
    expect(subscribe(newSim(), "gold", false, T0)).toEqual({ ok: false, error: "invalid" });
    expect(stateOf(ok(subscribe(newSim(), "premium", true, T0)), T0, true).status).toBe("trialing");
  });
  it("cancel keeps access to the period end, is idempotent, can be resumed, and expires exactly at the end", () => {
    let a = ok(subscribe(newSim(), "premium", false, T0)); a = ok(cancel(a, T0 + DAY));
    expect(stateOf(a, T0 + DAY, true)).toMatchObject({ premium: true, cancel_at_period_end: true });
    const n = a.events.length; a = ok(cancel(a, T0 + 2 * DAY)); expect(a.events.length).toBe(n);
    a = ok(resume(a, T0 + 3 * DAY)); expect(stateOf(a, T0 + 3 * DAY, true).cancel_at_period_end).toBe(false);
    a = ok(cancel(a, T0 + 4 * DAY));
    expect(stateOf(normalise(a, T0 + 30 * DAY - 1), T0 + 30 * DAY - 1, true).premium).toBe(true); // one millisecond before the end
    const after = normalise(a, T0 + 30 * DAY); expect(stateOf(after, T0 + 30 * DAY, true)).toMatchObject({ premium: false, status: "expired", entitlements: [] });
    expect(after.events.filter((e) => e.type === "expired")).toHaveLength(1);
  });
  it("an uncancelled subscription renews, and a failed payment ends access when the period ends", () => {
    let a = ok(subscribe(newSim(), "premium", false, T0));
    a = ok(advance(a, 31, false, T0)); expect(stateOf(a, T0, true)).toMatchObject({ premium: true, status: "active" }); expect(a.events.some((e) => e.type === "renewed")).toBe(true);
    a = ok(advance(a, 31, true, T0)); expect(stateOf(a, T0, true)).toMatchObject({ premium: false, status: "expired" }); expect(a.events.some((e) => e.type === "payment_failed")).toBe(true);
  });
  it("refuses out-of-range time travel and operations with no subscription", () => {
    expect(advance(newSim(), 5, false, T0)).toEqual({ ok: false, error: "no_subscription" });
    const a = ok(subscribe(newSim(), "premium", false, T0));
    for (const d of [0, -1, 401, 1.5, NaN]) expect(advance(a, d, false, T0)).toEqual({ ok: false, error: "invalid" });
    expect(cancel(newSim(), T0)).toEqual({ ok: false, error: "no_subscription" }); expect(resume(newSim(), T0)).toEqual({ ok: false, error: "no_subscription" });
  });
  it("entitlements are capacity or convenience only: no feature can stand for content access", () => {
    for (const f of FEATURES) { expect(["capacity", "convenience"]).toContain(FEATURE_KINDS[f]); expect(f).not.toMatch(/draft|unpublished|clinical|content|review|publish/); }
    expect(PLAN_CATALOG.free.features).toEqual([]);
    expect(hasEntitlement(FREE_STATE, "progress_export")).toBe(false);
  });
});

describe("fixture billing service", () => {
  it("keeps users apart, never lets premium outlive its period, and reports typed errors", async () => {
    let now = T0; const store = new Map<string, Sim>(); const mk = (k: string) => createBillingFixtureService(k, { store, now: () => now });
    const a = mk("a"), b = mk("b");
    expect((await a.state()).premium).toBe(false);
    await a.subscribeMock("premium", false);
    expect((await a.state()).premium).toBe(true); expect((await b.state()).premium).toBe(false);
    await expect(a.subscribeMock("premium", false)).rejects.toMatchObject({ code: "already_subscribed" });
    await expect(b.cancel()).rejects.toMatchObject({ code: "no_subscription" }); await expect(a.advanceMock(0, false)).rejects.toBeInstanceOf(BillingError);
    await a.cancel(); now = T0 + 31 * DAY;
    expect(await a.state()).toMatchObject({ premium: false, status: "expired" });
    expect(createBillingFixtureService("x", { store, now: () => now }).mode).toBe("fixtures");
  });
});

describe("mock payment provider", () => {
  const secret = "test-secret-0123456789"; const body = (o: object) => JSON.stringify(o);
  const sign = (b: string, s = secret) => createHmac("sha256", s).update(b).digest("hex");
  it("is never live, takes no card, and refuses a weak secret", async () => {
    const p = new MockPaymentProvider(secret); expect(p.live).toBe(false); expect(p.id).toBe("mock");
    const c = await p.createCheckout({ plan: "premium", userRef: "u1" }); expect(c).toMatchObject({ url: null, testTransaction: true }); expect(c.reference).toMatch(/^mock_[0-9a-f]{12}$/);
    await expect(p.createCheckout({ plan: "free", userRef: "u1" })).rejects.toThrow();
    expect(() => new MockPaymentProvider("short")).toThrow();
  });
  it("accepts a correctly signed event once, and rejects bad signatures, bad bodies, oversized bodies and replays", () => {
    const p = new MockPaymentProvider(secret); const b = body({ id: "evt_000001", type: "checkout.completed", plan: "premium", userRef: "u1" });
    expect(p.verifyWebhook(b, null)).toEqual({ ok: false, reason: "no_signature" });
    expect(p.verifyWebhook(b, sign(b, "another-secret-0123456789"))).toEqual({ ok: false, reason: "bad_signature" });
    expect(p.verifyWebhook(b, "zz")).toEqual({ ok: false, reason: "bad_signature" });
    expect(p.verifyWebhook(b + " ", sign(b))).toEqual({ ok: false, reason: "bad_signature" }); // tampered body
    const junk = body({ id: "evt_000002", type: "refund.issued" }); expect(p.verifyWebhook(junk, sign(junk))).toEqual({ ok: false, reason: "bad_body" });
    const extra = body({ id: "evt_000003", type: "checkout.completed", plan: "premium", admin: true }); expect(p.verifyWebhook(extra, sign(extra))).toEqual({ ok: false, reason: "bad_body" });
    const big = "x".repeat(MAX_WEBHOOK_BYTES + 1); expect(p.verifyWebhook(big, sign(big))).toEqual({ ok: false, reason: "too_large" });
    expect(p.verifyWebhook(b, sign(b))).toMatchObject({ ok: true });
    expect(p.verifyWebhook(b, sign(b))).toEqual({ ok: false, reason: "replay" });
  });
});
