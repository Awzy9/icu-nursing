"use server";
import { z } from "zod";
import { getActorKey } from "@/lib/question-bank";
import { getMedicationService } from "@/lib/medications";
import { MedicationError } from "@/lib/medications/types";
import { rateLimit } from "@/lib/rate-limit";

export type MedicationActionResult<T> = { ok: true; data: T } | { ok: false; code: string; error: string };

export async function setMedicationBookmarkAction(medicationId: string, on: boolean): Promise<MedicationActionResult<void>> {
  if (!z.string().uuid().safeParse(medicationId).success) return { ok: false, code: "invalid", error: "That request is not valid." };
  const svc = await getMedicationService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the medication library." };
  if (!rateLimit(`md-bm:${await getActorKey()}`, 60, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  try {
    return { ok: true, data: await svc.setBookmark(medicationId, Boolean(on)) };
  } catch (e) {
    if (e instanceof MedicationError) return { ok: false, code: e.code, error: e.message };
    return { ok: false, code: "unavailable", error: "The medication library is temporarily unavailable." };
  }
}
