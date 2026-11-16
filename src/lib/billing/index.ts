import "server-only";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFixtureKey, resolveMode } from "@/lib/question-bank";
import { billingMode } from "./mode";
import { BillingError, type BillingService } from "./types";

/** Same backend selection and production refusal as the learning modules; in addition billing must be switched to mock (it is always off in production). */
export async function getBillingService(opts: { create?: boolean } = {}): Promise<BillingService | null> {
  const mode = resolveMode();
  if (mode === "disabled" || billingMode() === "off") return null;
  if (mode === "database") {
    const user = await getSessionUser();
    const supabase = await createClient();
    if (!user || !supabase) throw new BillingError("auth", "Sign in to manage your plan.");
    const { createSupabaseBillingService } = await import("./supabase-service");
    return createSupabaseBillingService(supabase);
  }
  const key = await getFixtureKey(opts.create ?? false);
  const { createBillingFixtureService } = await import("./fixture-service");
  return createBillingFixtureService(key ?? "anonymous-empty");
}
export { billingMode } from "./mode";
