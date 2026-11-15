export * from "@icu/schemas/subscription";
import type { SubscriptionState } from "@icu/schemas/subscription";

export type BillingErrorCode = "auth" | "disabled" | "already_subscribed" | "no_subscription" | "invalid" | "unavailable" | "forbidden";
export class BillingError extends Error { constructor(public code: BillingErrorCode, message: string) { super(message); } }
/** One interface for the in-memory fixtures and the Supabase RPCs, so the pages never know which backend they use. */
export interface BillingService {
  mode: "fixtures" | "database";
  state(): Promise<SubscriptionState>;
  subscribeMock(plan: string, trial: boolean): Promise<SubscriptionState>;
  cancel(): Promise<SubscriptionState>;
  resume(): Promise<SubscriptionState>;
  advanceMock(days: number, paymentFails: boolean): Promise<SubscriptionState>;
}
