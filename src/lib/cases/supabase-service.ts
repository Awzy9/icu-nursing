import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QuestionBankError, type QuestionBankErrorCode } from "@/lib/question-bank/types";
import { caseAttemptSchema, caseListSchema, caseProgressSchema, type CaseService } from "./types";

function fail(error: { code?: string }): never {
  const map: Record<string, [QuestionBankErrorCode, string]> = {
    "42501": ["auth", "Sign in to use case-based learning."],
    P0002: ["not_found", "That item was not found or is not available."],
    "55000": ["conflict", "That action is not allowed in the case's current state."],
    "22023": ["invalid", "That selection is not valid."],
    "54000": ["limit", "Too many unfinished cases."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "Case-based learning is temporarily unavailable."];
  throw new QuestionBankError(code, message);
}

export function createSupabaseCaseService(supabase: SupabaseClient): CaseService {
  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
  }
  return {
    mode: "database",
    async progress() { return caseProgressSchema.parse(await rpc("cs_progress")); },
    async list() { return caseListSchema.parse(await rpc("cs_list")); },
    async start(caseId) { return rpc<string>("cs_start", { p_case: caseId }); },
    async get(id) {
      try { return caseAttemptSchema.parse(await rpc("cs_get", { p_attempt: id })); }
      catch (e) { if (e instanceof QuestionBankError && e.code === "not_found") return null; throw e; }
    },
    async choose(id, position, optionId) { return caseAttemptSchema.parse(await rpc("cs_choose", { p_attempt: id, p_position: position, p_option: optionId })); },
    async discard(id) { await rpc("cs_discard", { p_attempt: id }); },
  };
}
