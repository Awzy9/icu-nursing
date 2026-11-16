import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/**
 * Payment provider abstraction. NO real provider exists and none may be added without the owner's decision: the only implementation is the mock, which never
 * contacts any network, takes no card and moves no money. A future provider implements PaymentProvider; the application only ever talks to this interface.
 */
export interface CheckoutSession { reference: string; url: string | null; testTransaction: boolean }
export const providerEventSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/), type: z.enum(["checkout.completed", "payment.failed", "subscription.canceled"]), plan: z.enum(["premium"]).optional(), userRef: z.string().max(64).optional() }).strict();
export type ProviderEvent = z.infer<typeof providerEventSchema>;
export type WebhookResult = { ok: true; event: ProviderEvent } | { ok: false; reason: "no_signature" | "bad_signature" | "too_large" | "bad_body" | "replay" };
export interface PaymentProvider {
  readonly id: string;
  /** True only for a provider that moves real money. Always false here. */
  readonly live: boolean;
  createCheckout(input: { plan: string; userRef: string }): Promise<CheckoutSession>;
  verifyWebhook(rawBody: string, signature: string | null): WebhookResult;
}
export const MAX_WEBHOOK_BYTES = 4096;

export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock"; readonly live = false;
  private seen = new Set<string>();
  constructor(private secret: string) { if (secret.length < 16) throw new Error("the mock webhook secret must be at least 16 characters"); }
  async createCheckout(input: { plan: string; userRef: string }): Promise<CheckoutSession> {
    if (input.plan !== "premium") throw new Error("unknown plan");
    return { reference: `mock_${createHmac("sha256", this.secret).update(`${input.userRef}:${input.plan}`).digest("hex").slice(0, 12)}`, url: null, testTransaction: true };
  }
  sign(rawBody: string): string { return createHmac("sha256", this.secret).update(rawBody).digest("hex"); }
  verifyWebhook(rawBody: string, signature: string | null): WebhookResult {
    if (Buffer.byteLength(rawBody) > MAX_WEBHOOK_BYTES) return { ok: false, reason: "too_large" };
    if (!signature) return { ok: false, reason: "no_signature" };
    const want = Buffer.from(this.sign(rawBody), "hex"); let got: Buffer;
    try { got = Buffer.from(signature, "hex"); } catch { return { ok: false, reason: "bad_signature" }; }
    if (got.length !== want.length || !timingSafeEqual(got, want)) return { ok: false, reason: "bad_signature" };
    let parsed: unknown; try { parsed = JSON.parse(rawBody); } catch { return { ok: false, reason: "bad_body" }; }
    const e = providerEventSchema.safeParse(parsed); if (!e.success) return { ok: false, reason: "bad_body" };
    if (this.seen.has(e.data.id)) return { ok: false, reason: "replay" };
    if (this.seen.size > 5000) this.seen.clear();
    this.seen.add(e.data.id);
    return { ok: true, event: e.data };
  }
}
