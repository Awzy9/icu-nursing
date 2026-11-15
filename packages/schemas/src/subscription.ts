import { z } from "zod";

/**
 * Subscription and entitlement model (MOCK payments only: no provider is chosen and nothing is ever charged).
 * Premium covers capacity and convenience features only. There is deliberately no feature that represents content access, so a subscription can never
 * open an unpublished clinical item or stand in for a publication gate (the database enforces the same rule on the features catalogue).
 */
export const PLAN_CODES = ["free", "premium"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];
export const FEATURES = ["progress_export", "detailed_statistics"] as const;
export type Feature = (typeof FEATURES)[number];
export const SUBSCRIPTION_STATUSES = ["none", "trialing", "active", "past_due", "canceled", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export const EVENT_TYPES = ["created", "renewed", "canceled", "resumed", "expired", "payment_failed", "admin_change"] as const;

/** Mirrors public.plans and public.plan_entitlements. No price: the owner has not decided one. */
export const PLAN_CATALOG: Record<PlanCode, { tier: number; features: readonly Feature[] }> = {
  free: { tier: 0, features: [] },
  premium: { tier: 1, features: ["progress_export", "detailed_statistics"] },
};
export const FEATURE_KINDS: Record<Feature, "capacity" | "convenience"> = { progress_export: "convenience", detailed_statistics: "convenience" };

export const subscriptionStateSchema = z.object({
  plan: z.enum(PLAN_CODES),
  premium: z.boolean(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  period_end: z.string().nullable().optional(),
  cancel_at_period_end: z.boolean(),
  entitlements: z.array(z.enum(FEATURES)),
  mock_payments: z.boolean(),
  history: z.array(z.object({ type: z.enum(EVENT_TYPES), at: z.string(), detail: z.record(z.string(), z.unknown()) })).max(20),
});
export type SubscriptionState = z.infer<typeof subscriptionStateSchema>;
export const FREE_STATE: SubscriptionState = { plan: "free", premium: false, status: "none", period_end: null, cancel_at_period_end: false, entitlements: [], mock_payments: false, history: [] };

export const hasEntitlement = (s: Pick<SubscriptionState, "entitlements">, f: Feature): boolean => s.entitlements.includes(f);
export const isFeature = (v: unknown): v is Feature => (FEATURES as readonly unknown[]).includes(v);

// ---------------------------------------------------------------- pure simulation (the in-memory fixture service; mirrors the SQL functions)
const DAY = 86_400_000;
export interface SimSub { plan: PlanCode; status: Exclude<SubscriptionStatus, "none">; start: number; end: number; cancelAtEnd: boolean; canceledAt: number | null }
export interface SimEvent { type: (typeof EVENT_TYPES)[number]; at: number; detail: Record<string, unknown> }
export interface Sim { sub: SimSub | null; events: SimEvent[] }
export const newSim = (): Sim => ({ sub: null, events: [] });
const LIVE = new Set(["trialing", "active", "past_due"]);
const isLive = (s: SimSub | null): s is SimSub => !!s && LIVE.has(s.status);

/** Moves a live subscription whose period has ended to its next state (renew, or expire when cancelled or unpaid). */
export function normalise(sim: Sim, now: number): Sim {
  const out: Sim = { sub: sim.sub ? { ...sim.sub } : null, events: [...sim.events] };
  let guard = 0;
  while (isLive(out.sub) && out.sub.end <= now && guard++ < 24) {
    const s = out.sub;
    if (s.cancelAtEnd || s.status === "past_due") { s.status = "expired"; out.events.push({ type: "expired", at: now, detail: { reason: s.cancelAtEnd ? "cancelled_at_period_end" : "payment_not_recovered" } }); }
    else { s.status = "active"; s.start = s.end; s.end = s.end + 30 * DAY; out.events.push({ type: "renewed", at: now, detail: { provider: "mock" } }); }
  }
  return out;
}
export function stateOf(sim: Sim, now: number, mockPayments: boolean): SubscriptionState {
  const live = isLive(sim.sub) && sim.sub.end > now;
  const plan: PlanCode = live ? sim.sub!.plan : "free";
  return {
    plan, premium: plan !== "free", status: sim.sub?.status ?? "none", period_end: sim.sub ? new Date(sim.sub.end).toISOString() : null,
    cancel_at_period_end: !!sim.sub?.cancelAtEnd, entitlements: [...PLAN_CATALOG[plan].features], mock_payments: mockPayments,
    history: [...sim.events].reverse().slice(0, 20).map((e) => ({ type: e.type, at: new Date(e.at).toISOString(), detail: e.detail })),
  };
}
export type SimResult = { ok: true; sim: Sim } | { ok: false; error: "already_subscribed" | "no_subscription" | "invalid" };
export function subscribe(sim: Sim, plan: string, trial: boolean, now: number): SimResult {
  if (plan !== "premium") return { ok: false, error: "invalid" };
  const n = normalise(sim, now);
  if (isLive(n.sub)) return { ok: false, error: "already_subscribed" };
  n.sub = { plan: "premium", status: trial ? "trialing" : "active", start: now, end: now + (trial ? 7 : 30) * DAY, cancelAtEnd: false, canceledAt: null };
  n.events.push({ type: "created", at: now, detail: { plan, trial, provider: "mock", test_transaction: true } });
  return { ok: true, sim: n };
}
export function cancel(sim: Sim, now: number): SimResult {
  const n = normalise(sim, now);
  if (!isLive(n.sub)) return { ok: false, error: "no_subscription" };
  if (!n.sub.cancelAtEnd) { n.sub.cancelAtEnd = true; n.sub.canceledAt = now; n.events.push({ type: "canceled", at: now, detail: { access_until: new Date(n.sub.end).toISOString() } }); }
  return { ok: true, sim: n };
}
export function resume(sim: Sim, now: number): SimResult {
  const n = normalise(sim, now);
  if (!isLive(n.sub)) return { ok: false, error: "no_subscription" };
  if (n.sub.cancelAtEnd) { n.sub.cancelAtEnd = false; n.sub.canceledAt = null; n.events.push({ type: "resumed", at: now, detail: {} }); }
  return { ok: true, sim: n };
}
/** Test-only time travel: the period appears `days` older; a failed payment ends access when the period ends. */
export function advance(sim: Sim, days: number, paymentFails: boolean, now: number): SimResult {
  if (!Number.isInteger(days) || days < 1 || days > 400) return { ok: false, error: "invalid" };
  const n: Sim = { sub: sim.sub ? { ...sim.sub } : null, events: [...sim.events] };
  if (!isLive(n.sub)) return { ok: false, error: "no_subscription" };
  n.sub.start -= days * DAY; n.sub.end -= days * DAY;
  if (paymentFails && !n.sub.cancelAtEnd && n.sub.end <= now) { n.sub.status = "past_due"; n.events.push({ type: "payment_failed", at: now, detail: { provider: "mock", test_transaction: true } }); }
  return { ok: true, sim: normalise(n, now) };
}
