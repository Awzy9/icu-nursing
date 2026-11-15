import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QuestionBankError, type QuestionBankErrorCode } from "@/lib/question-bank/types";
import { medicationDetailSchema, medicationListSchema, medicationProgressSchema, type MedicationService } from "./types";

function fail(error: { code?: string }): never {
  const map: Record<string, [QuestionBankErrorCode, string]> = {
    "42501": ["auth", "Sign in to use the medication library."],
    P0002: ["not_found", "That item was not found or is not available."],
    "22023": ["invalid", "That selection is not valid."],
    "54000": ["limit", "Bookmark limit reached."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "The medication library is temporarily unavailable."];
  throw new QuestionBankError(code, message);
}

export function createSupabaseMedicationService(supabase: SupabaseClient): MedicationService {
  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
  }
  return {
    mode: "database",
    async progress() { return medicationProgressSchema.parse(await rpc("md_progress")); },
    async list(f = {}) { return medicationListSchema.parse(await rpc("md_list", { p_query: f.query ?? null, p_category: f.category ?? null, p_bookmarked: f.bookmarked ?? false, p_high_alert: f.highAlert ?? false })); },
    async get(code) {
      try { return medicationDetailSchema.parse(await rpc("md_get", { p_code: code })); }
      catch (e) { if (e instanceof QuestionBankError && e.code === "not_found") return null; throw e; }
    },
    async setBookmark(id, on) { await rpc("md_set_bookmark", { p_med: id, p_on: on }); },
  };
}
