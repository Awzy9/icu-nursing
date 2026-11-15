import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const secret = "route-secret-0123456789";
const sign = (b: string) => createHmac("sha256", secret).update(b).digest("hex");
const post = async (body: string, headers: Record<string, string> = {}) => { const { POST } = await import("@/app/api/billing/webhook/route"); return POST(new Request("http://x/api/billing/webhook", { method: "POST", body, headers })); };
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); delete (globalThis as { __mockProvider?: unknown }).__mockProvider; });

describe("billing mode and webhook route", () => {
  it("is off in production even if mock is requested, and the webhook answers 503 and does nothing", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production"); vi.stubEnv("BILLING_MODE", "mock"); vi.stubEnv("MOCK_BILLING_WEBHOOK_SECRET", secret);
    const { billingMode } = await import("@/lib/billing/mode"); expect(billingMode()).toBe("off");
    const b = JSON.stringify({ id: "evt_prod_001", type: "checkout.completed", plan: "premium" });
    expect((await post(b, { "x-mock-signature": sign(b) })).status).toBe(503);
  });
  it("answers 503 with no secret configured, even in mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development"); vi.stubEnv("BILLING_MODE", "mock"); vi.stubEnv("MOCK_BILLING_WEBHOOK_SECRET", "");
    expect((await post("{}")).status).toBe(503);
  });
  it("in mock mode verifies signatures, rejects replays and tampering, and acknowledges without applying when there is no matching fixture user", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development"); vi.stubEnv("BILLING_MODE", "mock"); vi.stubEnv("MOCK_BILLING_WEBHOOK_SECRET", secret);
    const b = JSON.stringify({ id: "evt_route_001", type: "checkout.completed", plan: "premium", userRef: "nobody" });
    expect((await post(b)).status).toBe(401);
    expect((await post(b, { "x-mock-signature": "00" })).status).toBe(401);
    const good = await post(b, { "x-mock-signature": sign(b) }); expect(good.status).toBe(202); expect(await good.json()).toEqual({ received: true, applied: false });
    expect((await post(b, { "x-mock-signature": sign(b) })).status).toBe(409);
    const bad = JSON.stringify({ id: "evt_route_002", type: "nope" }); expect((await post(bad, { "x-mock-signature": sign(bad) })).status).toBe(400);
    const { GET } = await import("@/app/api/billing/webhook/route"); expect(GET().status).toBe(405);
  });
});
