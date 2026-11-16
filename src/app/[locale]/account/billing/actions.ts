"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getBillingService } from "@/lib/billing";
import { BillingError } from "@/lib/billing/types";
import { rateLimit } from "@/lib/rate-limit";

export interface BillingActionState { error?: string; ok?: boolean }
async function run(fn: (svc: NonNullable<Awaited<ReturnType<typeof getBillingService>>>) => Promise<unknown>): Promise<BillingActionState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  if (!rateLimit(`billing:${ip}`, 60, 60_000)) return { error: "rate" };
  try {
    const svc = await getBillingService({ create: true });
    if (!svc) return { error: "disabled" };
    await fn(svc);
    revalidatePath("/[locale]/account/billing", "page");
    return { ok: true };
  } catch (e) { return { error: e instanceof BillingError ? e.code : "unavailable" }; }
}
export async function subscribeAction(_p: BillingActionState, form: FormData): Promise<BillingActionState> {
  return run((s) => s.subscribeMock(String(form.get("plan") ?? ""), form.get("trial") === "on"));
}
export async function cancelAction(): Promise<BillingActionState> { return run((s) => s.cancel()); }
export async function resumeAction(): Promise<BillingActionState> { return run((s) => s.resume()); }
export async function advanceAction(_p: BillingActionState, form: FormData): Promise<BillingActionState> {
  const days = Number(form.get("days")); return run((s) => s.advanceMock(days, form.get("fails") === "on"));
}
