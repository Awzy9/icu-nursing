import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  attemptListSchema, attemptSchema, progressSchema, QuestionBankError, startInputSchema,
  type AnswerResult, type QuestionBankErrorCode, type QuestionBankService, type StartInput,
} from "./types";

/** Map PostgreSQL error codes raised by the qb_* functions to application errors (messages are safe, fixed strings). */
function fail(error: { code?: string; message?: string }): never {
  const map: Record<string, [QuestionBankErrorCode, string]> = {
    "42501": ["auth", "Sign in to use the question bank."],
    P0002: ["not_found", "That item was not found or is not available."],
    "55000": ["conflict", "That action is not allowed in the attempt's current state."],
    "22023": ["invalid", "That selection is not valid."],
    "54000": ["limit", "Too many unfinished attempts."],
  };
  const [code, message] = map[error.code ?? ""] ?? ["unavailable", "The question bank is temporarily unavailable."];
  throw new QuestionBankError(code, message);
}

export function createSupabaseService(supabase: SupabaseClient): QuestionBankService {
  async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) fail(error);
    return data as T;
  }
  return {
    mode: "database",
    async progress() {
      return progressSchema.parse(await rpc("qb_progress"));
    },
    async listAttempts() {
      return attemptListSchema.parse(await rpc("qb_list_attempts", { p_limit: 20 }));
    },
    async startAttempt(raw: StartInput) {
      const parsed = startInputSchema.safeParse(raw);
      if (!parsed.success) throw new QuestionBankError("invalid", "invalid selection");
      const i = parsed.data;
      return rpc<string>("qb_start_attempt", {
        p_mode: i.mode, p_count: i.count, p_domains: i.domains.length ? i.domains : null,
        p_time_limit_seconds: i.timeLimitMinutes ? i.timeLimitMinutes * 60 : null, p_bookmarked_only: i.bookmarkedOnly,
      });
    },
    async getAttempt(id) {
      try {
        return attemptSchema.parse(await rpc("qb_get_attempt", { p_attempt: id }));
      } catch (e) {
        if (e instanceof QuestionBankError && e.code === "not_found") return null;
        throw e;
      }
    },
    async submitAnswer(id, position, optionId): Promise<AnswerResult> {
      const r = await rpc<{ cleared?: boolean; feedback?: unknown }>("qb_submit_answer", { p_attempt: id, p_position: position, p_option: optionId });
      if (!r.feedback) return { cleared: r.cleared };
      const parsed = attemptSchema.shape.items.element.shape.feedback.unwrap().parse(r.feedback);
      return { feedback: parsed };
    },
    async setFlag(id, position, flagged) {
      await rpc("qb_set_flag", { p_attempt: id, p_position: position, p_flagged: flagged });
    },
    async setPosition(id, position) {
      await rpc("qb_set_position", { p_attempt: id, p_position: position });
    },
    async submitAttempt(id) {
      return attemptSchema.parse(await rpc("qb_submit_attempt", { p_attempt: id }));
    },
    async discardAttempt(id) {
      await rpc("qb_discard_attempt", { p_attempt: id });
    },
    async setBookmark(questionId, bookmarked) {
      await rpc("qb_set_bookmark", { p_question: questionId, p_bookmarked: bookmarked });
    },
  };
}
