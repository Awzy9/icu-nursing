import "server-only";
import { BillingError, type BillingService } from "./types";
import { advance, cancel, newSim, normalise, resume, stateOf, subscribe, type Sim, type SimResult } from "@icu/schemas/subscription";

/** In-memory mock billing for fixture mode (development, demonstration and end-to-end tests). Mirrors the sub_* database functions; never persisted, never real. */
const g = globalThis as unknown as { __billingFixtureStore?: Map<string, Sim> };
export const sharedBillingStore = (): Map<string, Sim> => (g.__billingFixtureStore ??= new Map());

export function createBillingFixtureService(userKey: string, opts: { store?: Map<string, Sim>; now?: () => number } = {}): BillingService {
  const store = opts.store ?? sharedBillingStore();
  const now = opts.now ?? (() => Date.now());
  if (!store.has(userKey)) { if (store.size >= 200) store.delete(store.keys().next().value as string); store.set(userKey, newSim()); }
  const apply = (r: SimResult) => {
    if (!r.ok) throw new BillingError(r.error === "already_subscribed" ? "already_subscribed" : r.error === "no_subscription" ? "no_subscription" : "invalid", r.error);
    store.set(userKey, r.sim); return stateOf(r.sim, now(), true);
  };
  return {
    mode: "fixtures",
    async state() { const s = normalise(store.get(userKey)!, now()); store.set(userKey, s); return stateOf(s, now(), true); },
    async subscribeMock(plan, trial) { return apply(subscribe(store.get(userKey)!, plan, trial, now())); },
    async cancel() { return apply(cancel(store.get(userKey)!, now())); },
    async resume() { return apply(resume(store.get(userKey)!, now())); },
    async advanceMock(days, fails) { return apply(advance(store.get(userKey)!, days, fails, now())); },
  };
}
