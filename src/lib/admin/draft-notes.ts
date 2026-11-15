import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

export const NOTE_FIELDS = [
  ["owner_note", "Owner note"], ["evidence_note", "Evidence note"], ["licensing_note", "Licensing note"], ["status_note", "Status note"],
] as const;
export type NoteField = (typeof NOTE_FIELDS)[number][0];
const notesSchema = z.object({
  notes: z.record(z.string(), z.object({ value: z.string(), updated_at: z.string(), updated_by: z.string() })),
  revisions: z.array(z.object({ field: z.string(), old: z.string().nullable(), new: z.string().nullable(), at: z.string(), by: z.string() })),
});
export type DraftNotes = z.infer<typeof notesSchema>;
const summarySchema = z.record(z.string(), z.object({ fields: z.number(), updated_at: z.string() }));

export async function notesSummary(db: SupabaseClient): Promise<Record<string, { fields: number; updated_at: string }>> {
  const { data, error } = await db.rpc("adm_draft_notes_summary");
  if (error) return {};
  return summarySchema.parse(data);
}
export async function notesFor(db: SupabaseClient, key: string): Promise<DraftNotes> {
  const { data, error } = await db.rpc("adm_draft_notes", { p_draft: key });
  if (error) return { notes: {}, revisions: [] };
  return notesSchema.parse(data);
}
export async function setNote(db: SupabaseClient, key: string, field: NoteField, value: string): Promise<{ error: { message: string } | null }> {
  const { error } = await db.rpc("adm_set_draft_note", { p_draft: key, p_field: field, p_value: value });
  return { error };
}
