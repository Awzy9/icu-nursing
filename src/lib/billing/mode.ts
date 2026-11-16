import { isDemoMode, getEnv } from "@/lib/env";

/**
 * Billing mode. "mock" runs the test-only provider; "off" shows the plans but offers no subscription. There is no "live": a real provider needs the owner's
 * decision and a new code path. A production deployment is always "off" (the mock refuses to run there), whatever the environment says.
 */
export type BillingMode = "off" | "mock";
export function billingMode(): BillingMode {
  const env = getEnv();
  if (env.NEXT_PUBLIC_APP_ENV === "production") return "off";
  const wanted = process.env.BILLING_MODE;
  if (wanted === "off") return "off";
  if (wanted === "mock" || isDemoMode()) return "mock";
  return "off";
}
