import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EquipmentError, equipmentStateSchema, type EquipmentStateService } from "./state";
import type { QuestionBankErrorCode } from "@/lib/question-bank/types";

function fail(error: { code?: string }): never {
  const map: Record<string, [QuestionBankErrorCode, string]> = {
    "42501": ["auth", "Sign in to use equipment learning."],
    P0002: ["not_found", "That module was not found or is not available."],
    "22023": ["invalid", "That selection is not valid."],
    "54000": ["limit", "Too many bookmarks or recorded parts."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "Equipment learning is temporarily unavailable."];
  throw new EquipmentError(code, message);
}

export function createSupabaseEquipmentService(supabase: SupabaseClient): EquipmentStateService {
  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
  }
  return {
    mode: "database",
    async get() { return equipmentStateSchema.parse(await rpc("eq_state")); },
    async setBookmark(code, on) { await rpc("eq_set_bookmark", { p_code: code, p_on: on }); },
    async markViewed(code, part) { await rpc("eq_mark_viewed", { p_code: code, p_part: part }); },
    async resetProgress(code) { await rpc("eq_reset_progress", { p_code: code }); },
  };
}
