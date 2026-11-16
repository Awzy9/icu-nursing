"use server";
import { getEquipment } from "@/lib/equipment";
import { EquipmentError } from "@/lib/equipment/state";
import { getEquipmentStateService } from "@/lib/equipment/state-index";
import { getActorKey } from "@/lib/question-bank";
import { rateLimit } from "@/lib/rate-limit";

export type EquipmentActionResult = { ok: true } | { ok: false; code: string; error: string };
const bad = (): EquipmentActionResult => ({ ok: false, code: "invalid", error: "That request is not valid." });

async function run(kind: string, max: number, fn: (svc: NonNullable<Awaited<ReturnType<typeof getEquipmentStateService>>>) => Promise<void>): Promise<EquipmentActionResult> {
  const svc = await getEquipmentStateService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to save your progress." };
  if (!rateLimit(`eq-${kind}:${await getActorKey()}`, max, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  try { await fn(svc); return { ok: true }; }
  catch (e) { return e instanceof EquipmentError ? { ok: false, code: e.code, error: e.message } : { ok: false, code: "unavailable", error: "Equipment learning is temporarily unavailable." }; }
}

export async function setEquipmentBookmarkAction(code: string, on: boolean): Promise<EquipmentActionResult> {
  if (!getEquipment(code)) return bad();
  return run("bm", 60, (s) => s.setBookmark(code, Boolean(on)));
}
/** The part must exist in the (synthetic) module being viewed: the database only checks the shape. */
export async function markEquipmentPartViewedAction(code: string, part: string): Promise<EquipmentActionResult> {
  const m = getEquipment(code);
  if (!m || !m.diagram.parts.some((p) => p.id === part)) return bad();
  return run("view", 120, (s) => s.markViewed(code, part));
}
