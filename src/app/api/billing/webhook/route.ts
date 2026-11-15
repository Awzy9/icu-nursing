import { NextResponse } from "next/server";
import { billingMode } from "@/lib/billing/mode";
import { MockPaymentProvider, MAX_WEBHOOK_BYTES } from "@/lib/billing/provider";
import { cancel, subscribe } from "@icu/schemas/subscription";
import { sharedBillingStore } from "@/lib/billing/fixture-service";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";
const json = (body: Record<string, unknown>, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Payment-provider webhook (MOCK only). With no provider configured, and always in production, it answers 503 and does nothing. In mock mode it verifies an
 * HMAC signature in constant time, bounds the body, rejects replays, and applies the event to the in-memory fixture store only: a database deployment has no
 * server-side credential for applying provider events, so it acknowledges the event and applies nothing (a real provider will need its own reviewed path).
 */
export async function POST(req: Request) {
  const secret = process.env.MOCK_BILLING_WEBHOOK_SECRET;
  if (billingMode() !== "mock" || !secret || secret.length < 16) return json({ error: "no payment provider is configured" }, 503);
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_WEBHOOK_BYTES) return json({ error: "payload too large" }, 413);
  const raw = await req.text();
  const g = globalThis as unknown as { __mockProvider?: MockPaymentProvider };
  const provider = (g.__mockProvider ??= new MockPaymentProvider(secret));
  const r = provider.verifyWebhook(raw, req.headers.get("x-mock-signature"));
  if (!r.ok) return json({ error: r.reason }, r.reason === "too_large" ? 413 : r.reason === "replay" ? 409 : r.reason === "bad_body" ? 400 : 401);
  let applied = false;
  if ((isDemoMode() || process.env.QUESTION_BANK_MODE === "fixtures") && process.env.QUESTION_BANK_MODE !== "database" && r.event.userRef) {
    const store = sharedBillingStore(); const sim = store.get(r.event.userRef);
    if (sim) {
      const res = r.event.type === "checkout.completed" ? subscribe(sim, r.event.plan ?? "premium", false, Date.now()) : r.event.type === "subscription.canceled" ? cancel(sim, Date.now()) : null;
      if (res?.ok) { store.set(r.event.userRef, res.sim); applied = true; }
    }
  }
  return json({ received: true, applied }, 202);
}
export function GET() { return json({ error: "method not allowed" }, 405); }
