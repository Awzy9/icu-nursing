import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BillingError, subscriptionStateSchema, type BillingErrorCode, type BillingService } from "./types";

function fail(error: { code?: string; message?: string }): never {
  const map: Record<string, [BillingErrorCode, string]> = {
    "42501": ["auth", "Sign in to manage your plan."], "55000": ["disabled", "Payments are not enabled in this environment."],
    "23505": ["already_subscribed", "You already have a subscription."], P0002: ["no_subscription", "There is no active subscription."], "22023": ["invalid", "That request is not valid."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "Plans are temporarily unavailable."];
  throw new BillingError(code, message);
}
export function createSupabaseBillingService(supabase: SupabaseClient): BillingService {
  async function rpc(fn: string, args?: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return subscriptionStateSchema.parse(data);
  }
  return {
    mode: "database",
    state: () => rpc("sub_get_my"),
    subscribeMock: (plan, trial) => rpc("sub_mock_subscribe", { p_plan: plan, p_trial: trial }),
    cancel: () => rpc("sub_cancel"),
    resume: () => rpc("sub_resume"),
    advanceMock: (days, fails) => rpc("sub_mock_advance", { p_days: days, p_payment_fails: fails }),
  };
}
