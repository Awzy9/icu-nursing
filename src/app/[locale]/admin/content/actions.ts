"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { NOTE_FIELDS, setNote, type NoteField } from "@/lib/admin/draft-notes";
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
  revalidatePath(`/admin/content/drafts/${parsed.data.key}`);
  return { ok: true, message: "Saved." };
}
