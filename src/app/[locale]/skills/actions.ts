"use server";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getActorKey } from "@/lib/question-bank";
import { getSkillService } from "@/lib/skills";
import { RESULTS, SkillError, type SkillSessionView } from "@/lib/skills/types";
import { rateLimit } from "@/lib/rate-limit";

export type SkillActionResult<T> = { ok: true; data: T } | { ok: false; code: string; error: string };
const uuid = z.string().uuid();

async function run<T>(fn: () => Promise<T>): Promise<SkillActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof SkillError) return { ok: false, code: e.code, error: e.message };
    return { ok: false, code: "unavailable", error: "The skills library is temporarily unavailable." };
  }
}
const bad = (): SkillActionResult<never> => ({ ok: false, code: "invalid", error: "That request is not valid." });
const noAuth = (): SkillActionResult<never> => ({ ok: false, code: "auth", error: "Sign in to use the skills library." });

export async function startSkillSessionAction(skillId: string): Promise<SkillActionResult<never>> {
  if (!uuid.safeParse(skillId).success) return bad();
  const svc = await getSkillService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  if (!rateLimit(`sk-start:${await getActorKey()}`, 30, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  const r = await run(() => svc.start(skillId));
  if (r.ok) redirect({ href: `/skills/session/${r.data}`, locale: await getLocale() });
  return r as SkillActionResult<never>;
}

export async function setSkillBookmarkAction(skillId: string, on: boolean): Promise<SkillActionResult<void>> {
  if (!uuid.safeParse(skillId).success) return bad();
  const svc = await getSkillService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  if (!rateLimit(`sk-bm:${await getActorKey()}`, 60, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  return run(() => svc.setBookmark(skillId, Boolean(on)));
}

export async function markSkillItemAction(sessionId: string, itemId: string, result: string): Promise<SkillActionResult<void>> {
  if (!uuid.safeParse(sessionId).success || !uuid.safeParse(itemId).success || !(RESULTS as readonly string[]).includes(result)) return bad();
  const svc = await getSkillService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  return run(() => svc.mark(sessionId, itemId, result as (typeof RESULTS)[number]));
}

export async function completeSkillSessionAction(sessionId: string): Promise<SkillActionResult<SkillSessionView>> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const svc = await getSkillService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  return run(() => svc.complete(sessionId));
}

export async function discardSkillSessionAction(sessionId: string): Promise<SkillActionResult<void>> {
  if (!uuid.safeParse(sessionId).success) return bad();
  const svc = await getSkillService({ create: true }).catch(() => null);
  if (!svc) return noAuth();
  return run(() => svc.discard(sessionId));
}
