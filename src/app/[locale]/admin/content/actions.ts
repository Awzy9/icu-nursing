"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { NOTE_FIELDS, setNote, type NoteField } from "@/lib/admin/draft-notes";
import { GUIDELINE_CURRENCY, RECOMMENDATIONS, setAiEvidence, type GuidelineCurrency, type Recommendation } from "@/lib/admin/ai-evidence";
import { DRAFTS } from "@/lib/admin/drafts";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { AdminState } from "../actions";

const schema = z.object({
  key: z.string().regex(/^[A-Z0-9-]{4,12}$/),
  field: z.enum(NOTE_FIELDS.map((f) => f[0]) as [NoteField, ...NoteField[]]),
  value: z.string().max(1000),
});

/** Saves one workflow note about an unpublished draft. The database enforces who may write and refuses doses/rates; this layer validates the key against the draft index and throttles. */
export async function saveDraftNoteAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  if (!rateLimit(`draftnote:${ip}`, 60, 60_000)) return { error: "Too many actions in a short time. Please wait a moment." };
  const parsed = schema.safeParse({ key: form.get("key"), field: form.get("field"), value: String(form.get("value") ?? "") });
  if (!parsed.success) return { error: "That request is not valid." };
  if (!DRAFTS.entries.some((e) => e.key === parsed.data.key)) return { error: "Unknown draft." };
  const { error } = await setNote(db, parsed.data.key, parsed.data.field, parsed.data.value);
  if (error) return { error: error.message };
  revalidatePath(`/admin/content/register/${parsed.data.key}`);
  return { ok: true, message: "Saved." };
}

const aiEvidenceSchema = z.object({
  key: z.string().regex(/^[A-Z0-9-]{4,12}$/),
  tool: z.string().trim().min(1).max(200),
  sources: z.string().trim().min(1).max(4000),
  currency: z.enum(GUIDELINE_CURRENCY as unknown as [GuidelineCurrency, ...GuidelineCurrency[]]),
  discrepancies: z.enum(["yes", "no"]),
  summary: z.string().trim().min(1).max(2000),
  recommendation: z.enum(RECOMMENDATIONS as unknown as [Recommendation, ...Recommendation[]]),
});

/**
 * Records one AI-assisted evidence check (ChatGPT or similar, used by a person) against an unpublished draft. This is a log entry, never an
 * approval: it cannot and does not mark anything "clinically reviewed" - the database has no path from this action to that state.
 */
export async function saveAiEvidenceAction(_prev: AdminState, form: FormData): Promise<AdminState> {
  const db = await createClient();
  if (!db) return { error: "Backend not configured (demonstration mode)." };
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  if (!rateLimit(`aievidence:${ip}`, 20, 60_000)) return { error: "Too many actions in a short time. Please wait a moment." };
  const parsed = aiEvidenceSchema.safeParse({
    key: form.get("key"), tool: form.get("tool"), sources: form.get("sources"), currency: form.get("currency"),
    discrepancies: form.get("discrepancies"), summary: form.get("summary"), recommendation: form.get("recommendation"),
  });
  if (!parsed.success) return { error: "That request is not valid. Check that every field is filled in." };
  if (!DRAFTS.entries.some((e) => e.key === parsed.data.key)) return { error: "Unknown draft." };
  const sources = parsed.data.sources.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 20);
  if (sources.length === 0) return { error: "List at least one source checked, one per line." };
  const { error } = await setAiEvidence(db, parsed.data.key, {
    tool: parsed.data.tool, sources, currency: parsed.data.currency, discrepancies: parsed.data.discrepancies === "yes",
    summary: parsed.data.summary, recommendation: parsed.data.recommendation,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/content/register/${parsed.data.key}`);
  return { ok: true, message: "AI evidence check recorded. This is not a clinical review." };
}
