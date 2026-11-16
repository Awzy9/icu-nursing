import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { QuestionBankError, type QuestionBankErrorCode } from "@/lib/question-bank/types";
import { skillDetailSchema, skillListSchema, skillProgressSchema, skillSessionSchema, type SkillService } from "./types";

function fail(error: { code?: string }): never {
  const map: Record<string, [QuestionBankErrorCode, string]> = {
    "42501": ["auth", "Sign in to use the skills library."],
    P0002: ["not_found", "That item was not found or is not available."],
    "55000": ["conflict", "That action is not allowed in the session's current state."],
    "22023": ["invalid", "That selection is not valid."],
    "54000": ["limit", "Too many unfinished or recent practice sessions."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "The skills library is temporarily unavailable."];
  throw new QuestionBankError(code, message);
}

export function createSupabaseSkillService(supabase: SupabaseClient): SkillService {
  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
  }
  const notFoundToNull = async <T,>(f: () => Promise<T>): Promise<T | null> => {
    try { return await f(); } catch (e) { if (e instanceof QuestionBankError && e.code === "not_found") return null; throw e; }
  };
  return {
    mode: "database",
    async progress() { return skillProgressSchema.parse(await rpc("sk_progress")); },
    async list(f = {}) { return skillListSchema.parse(await rpc("sk_list", { p_query: f.query ?? null, p_category: f.category ?? null, p_bookmarked: f.bookmarked ?? false })); },
    async get(code) { return notFoundToNull(async () => skillDetailSchema.parse(await rpc("sk_get", { p_code: code }))); },
    async setBookmark(id, on) { await rpc("sk_set_bookmark", { p_skill: id, p_on: on }); },
    async start(id) { return rpc<string>("sk_start_session", { p_skill: id }); },
    async getSession(id) { return notFoundToNull(async () => skillSessionSchema.parse(await rpc("sk_get_session", { p_session: id }))); },
    async mark(id, item, result) { await rpc("sk_mark", { p_session: id, p_item: item, p_result: result }); },
    async complete(id) { return skillSessionSchema.parse(await rpc("sk_complete_session", { p_session: id })); },
    async discard(id) { await rpc("sk_discard_session", { p_session: id }); },
  };
}
