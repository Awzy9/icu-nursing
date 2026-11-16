import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * AI-assisted evidence verification log for unpublished drafts (migration 0019_ai_evidence_review.sql). A staff member runs the check outside this
 * app (typically ChatGPT, with web browsing, checking a draft's claims against current guidelines, systematic reviews, trials or regulatory
 * sources) and records the outcome here by hand. This is a history of checks, never an approval: nothing in this module can mark a draft
 * "clinically reviewed", and the UI that renders it always pairs it with a banner saying so.
 */
export const GUIDELINE_CURRENCY = ["current", "superseded", "unclear"] as const;
export type GuidelineCurrency = (typeof GUIDELINE_CURRENCY)[number];
export const RECOMMENDATIONS = ["no_action", "minor_update_suggested", "major_gap_flagged"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

const entrySchema = z.object({
  id: z.number(), tool: z.string(), sources_checked: z.array(z.string()), guideline_currency: z.enum(GUIDELINE_CURRENCY),
  discrepancies_found: z.boolean(), summary: z.string(), recommendation: z.enum(RECOMMENDATIONS), reviewed_at: z.string(), reviewed_by: z.string(),
});
export type AiEvidenceEntry = z.infer<typeof entrySchema>;
const listSchema = z.array(entrySchema);
const summarySchema = z.record(z.string(), z.object({ count: z.number(), last_at: z.string(), last_recommendation: z.enum(RECOMMENDATIONS), ever_flagged: z.boolean() }));
export type AiEvidenceSummary = z.infer<typeof summarySchema>;

export async function aiEvidenceSummary(db: SupabaseClient): Promise<AiEvidenceSummary> {
  const { data, error } = await db.rpc("adm_ai_evidence_summary");
  if (error) return {};
  return summarySchema.parse(data);
}
export async function aiEvidenceFor(db: SupabaseClient, key: string): Promise<AiEvidenceEntry[]> {
  const { data, error } = await db.rpc("adm_ai_evidence_list", { p_draft: key });
  if (error) return [];
  return listSchema.parse(data);
}
export async function setAiEvidence(
  db: SupabaseClient, key: string, input: { tool: string; sources: string[]; currency: GuidelineCurrency; discrepancies: boolean; summary: string; recommendation: Recommendation },
): Promise<{ error: { message: string } | null }> {
  const { error } = await db.rpc("adm_ai_evidence_set", {
    p_draft: key, p_tool: input.tool, p_sources: input.sources, p_currency: input.currency,
    p_discrepancies: input.discrepancies, p_summary: input.summary, p_recommendation: input.recommendation,
  });
  return { error };
}
