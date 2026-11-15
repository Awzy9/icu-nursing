"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getActorKey } from "@/lib/question-bank";
import { getCaseService } from "@/lib/cases";
import { CaseError, type CaseAttemptView } from "@/lib/cases/types";
import { rateLimit } from "@/lib/rate-limit";

export type CaseActionResult<T> = { ok: true; data: T } | { ok: false; code: string; error: string };
const uuid = z.string().uuid();

async function run<T>(fn: () => Promise<T>): Promise<CaseActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof CaseError) return { ok: false, code: e.code, error: e.message };
    return { ok: false, code: "unavailable", error: "Case-based learning is temporarily unavailable." };
  }
}
const bad = (): CaseActionResult<never> => ({ ok: false, code: "invalid", error: "That request is not valid." });
const noAuth = (): CaseActionResult<never> => ({ ok: false, code: "auth", error: "Sign in to use case-based learning." });

export async function startCaseAction(caseId: string): Promise<CaseActionResult<never>> {
  if (!uuid.safeParse(caseId).success) return bad();
  const svc = await getCaseService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  if (!rateLimit(`cs-start:${await getActorKey()}`, 30, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  const r = await run(() => svc.start(caseId));
  if (r.ok) {
    revalidatePath("/", "layout");
    redirect({ href: `/cases/attempt/${r.data}`, locale: await getLocale() });
  }
  return r as CaseActionResult<never>;
}

export async function chooseCaseAction(attemptId: string, position: number, optionId: string): Promise<CaseActionResult<CaseAttemptView>> {
  if (!uuid.safeParse(attemptId).success || !uuid.safeParse(optionId).success || !Number.isInteger(position) || position < 1 || position > 8) return bad();
  const svc = await getCaseService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  const r = await run(() => svc.choose(attemptId, position, optionId));
  if (r.ok && r.data.status === "completed") revalidatePath("/", "layout");
  return r;
}

export async function discardCaseAction(attemptId: string): Promise<CaseActionResult<void>> {
  if (!uuid.safeParse(attemptId).success) return bad();
  const svc = await getCaseService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  const r = await run(() => svc.discard(attemptId));
  if (r.ok) revalidatePath("/", "layout");
  return r;
}
