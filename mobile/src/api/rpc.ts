// Validated Supabase RPC contracts. Every response is parsed with the shared @icu/schemas definition, so a server change that breaks the contract
// fails here instead of rendering wrong data. Staff functions (adm_*) are deliberately absent: the app has no staff features.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { caseListSchema, caseProgressSchema } from "@icu/schemas/cases";
import { equipmentStateSchema, type EquipmentState } from "@icu/schemas/equipment-state";
import { skillListSchema, skillProgressSchema } from "@icu/schemas/skills";
import type { ScenarioDecision } from "@icu/schemas/scenario-debrief";
import { attemptRowSchema, bookmarkRowSchema, lessonRowSchema, sessionRowSchema, type AttemptRow, type BookmarkRow, type LessonRow, type SessionRow } from "@icu/schemas/working-progress";
import { examRowSchema, type ExamRow } from "@icu/schemas/working-exam";

export class RpcError extends Error { constructor(readonly code: "auth" | "not_found" | "invalid" | "limit" | "contract" | "unavailable", message: string) { super(message); } }
const MAP: Record<string, RpcError["code"]> = { "42501": "auth", P0002: "not_found", "22023": "invalid", "54000": "limit" };

export function createRpc(client: SupabaseClient) {
  async function raw(fn: string, args?: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
    return data;
  }
  async function call<S extends z.ZodType>(fn: string, schema: S, args?: Record<string, unknown>): Promise<z.infer<S>> {
    const parsed = schema.safeParse(await raw(fn, args));
    if (!parsed.success) throw new RpcError("contract", `${fn}: response does not match the shared schema`);
    return parsed.data;
  }
  async function run(fn: string, args: Record<string, unknown>): Promise<void> { await raw(fn, args); }

  // Account-owned sync for the real catalog's learner progress (attempts, bookmarks, lesson
  // completion, resumable quiz/scenario sessions) - the same tables and RPCs the website uses
  // (supabase/migrations/20261117113505_account_learning_progress.sql and
  // 20261117164000_working_sessions.sql). Every write here mirrors
  // src/app/[locale]/learning/actions.ts exactly (same function/table names, same argument
  // shapes), so mobile and web read and write the identical rows for the same signed-in user.
  async function selectRows<S extends z.ZodType>(table: string, columns: string, schema: S): Promise<z.infer<S>[]> {
    const { data, error } = await client.from(table).select(columns);
    if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
    const parsed = z.array(schema).safeParse(data);
    if (!parsed.success) throw new RpcError("contract", `${table}: response does not match the shared schema`);
    return parsed.data;
  }
  // The working_bookmarks/working_lessons tables have no default for user_id (unlike the RPCs,
  // which read auth.uid() server-side) - an upsert must set it explicitly, exactly as the
  // website's own server action does (src/app/[locale]/learning/actions.ts).
  async function currentUserId(): Promise<string> {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new RpcError("auth", "not signed in");
    return data.user.id;
  }

  return {
    equipmentState: (): Promise<EquipmentState> => call("eq_state", equipmentStateSchema),
    setEquipmentBookmark: (code: string, on: boolean) => run("eq_set_bookmark", { p_code: code, p_on: on }),
    markEquipmentViewed: (code: string, part: string) => run("eq_mark_viewed", { p_code: code, p_part: part }),
    resetEquipmentProgress: (code: string) => run("eq_reset_progress", { p_code: code }),
    caseList: () => call("cs_list", caseListSchema),
    caseProgress: () => call("cs_progress", caseProgressSchema),
    skillList: () => call("sk_list", skillListSchema, { p_query: null, p_category: null, p_bookmarked: false }),
    skillProgress: () => call("sk_progress", skillProgressSchema),

    recordWorkingAttempt: (questionId: string, moduleKey: string, choice: number, correct: boolean, answeredAt: number) =>
      run("working_record_attempt", { p_question_id: questionId, p_module_key: moduleKey, p_choice: choice, p_correct: correct, p_answered_at: new Date(answeredAt).toISOString() }),
    setWorkingBookmark: async (moduleKey: string, saved: boolean): Promise<void> => {
      if (saved) {
        const user_id = await currentUserId();
        const { error } = await client.from("working_bookmarks").upsert({ user_id, module_key: moduleKey }, { onConflict: "user_id,module_key" });
        if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
      } else {
        const { error } = await client.from("working_bookmarks").delete().eq("module_key", moduleKey);
        if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
      }
    },
    setWorkingLessonComplete: async (moduleKey: string, completed: boolean): Promise<void> => {
      const user_id = await currentUserId();
      const { error } = await client.from("working_lessons").upsert({ user_id, module_key: moduleKey, completed, updated_at: new Date().toISOString() }, { onConflict: "user_id,module_key" });
      if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
    },
    saveWorkingSession: (moduleKey: string, kind: "quiz" | "scenario", version: string, position: number, score: number, finished: boolean, updatedAt: number, decisions?: ScenarioDecision[]) => {
      const args = { p_module_key: moduleKey, p_kind: kind, p_version: version, p_position: position, p_score: score, p_finished: finished, p_updated_at: new Date(updatedAt).toISOString() };
      return kind === "scenario" && decisions !== undefined
        ? run("working_save_session_v2", { ...args, p_decisions: decisions })
        : run("working_save_session", args);
    },
    discardWorkingSession: async (moduleKey: string): Promise<void> => {
      const { error } = await client.from("working_sessions").delete().eq("module_key", moduleKey);
      if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
    },
    listWorkingBookmarks: (): Promise<BookmarkRow[]> => selectRows("working_bookmarks", "module_key", bookmarkRowSchema),
    listWorkingLessons: (): Promise<LessonRow[]> => selectRows("working_lessons", "module_key,completed", lessonRowSchema),
    listWorkingSessions: (): Promise<SessionRow[]> => selectRows("working_sessions", "module_key,kind,version,position,score,finished,updated_at,decisions", sessionRowSchema),
    listWorkingAttempts: (): Promise<AttemptRow[]> => selectRows("working_attempts", "question_id,correct,answered_at,box", attemptRowSchema),

    // Timed exam mode (supabase/migrations/20261117201500_working_exams.sql), mirroring
    // src/app/[locale]/exam/actions.ts exactly: the question selection itself comes from
    // /api/content/exam/pick (content, not an account write), and these three calls are the
    // same working_exam_start/answer/submit RPCs the website uses for the server-anchored row.
    startWorkingExam: (questionIds: string[], timeLimitSeconds: number): Promise<string> =>
      call("working_exam_start", z.string().uuid(), { p_question_ids: questionIds, p_time_limit_seconds: timeLimitSeconds }),
    answerWorkingExam: (examId: string, questionId: string, choice: number) =>
      run("working_exam_answer", { p_exam_id: examId, p_question_id: questionId, p_choice: choice }),
    submitWorkingExam: (examId: string) => run("working_exam_submit", { p_exam_id: examId }),
    loadWorkingExam: async (examId: string): Promise<ExamRow | undefined> => {
      const { data, error } = await client.from("working_exams").select("id,question_ids,time_limit_seconds,started_at,submitted_at,answers").eq("id", examId).maybeSingle();
      if (error) throw new RpcError(MAP[error.code ?? ""] ?? "unavailable", error.message);
      if (!data) return undefined;
      const parsed = examRowSchema.safeParse(data);
      if (!parsed.success) throw new RpcError("contract", "working_exams: response does not match the shared schema");
      return parsed.data;
    },
  };
}
export type Rpc = ReturnType<typeof createRpc>;
