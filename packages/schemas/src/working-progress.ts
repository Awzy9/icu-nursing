import { z } from "zod";

// Mirrors src/lib/working/activity-types.ts - the shape the web's own guest/account learning
// progress uses, shared so the mobile app's local (guest) storage and its validated reads of
// the account-sync RPC results use the exact same contract.

export const attemptSchema = z.object({
  id: z.string(),
  title: z.string(),
  href: z.string(),
  correct: z.boolean(),
  at: z.number(),
  choice: z.number().int().optional(),
  box: z.number().int().optional(),
});
export type AttemptShared = z.infer<typeof attemptSchema>;

export const savedModuleSchema = z.object({ key: z.string(), title: z.string(), type: z.string(), href: z.string() });
export type SavedModuleShared = z.infer<typeof savedModuleSchema>;

export const lessonProgressSchema = savedModuleSchema.extend({ completed: z.boolean(), at: z.number() });
export type LessonProgressShared = z.infer<typeof lessonProgressSchema>;

// Mirrors the candidate DB constraint. Unknown history is not an empty history.
// Shape validation only; scenario-session.ts checks transitions and scores against content.
export const scenarioDecisionHistorySchema = z.array(z.strictObject({
  position: z.number().int().min(1).max(999),
  choice: z.number().int().min(0).max(3),
})).max(100).refine(items => items.every((item, i) => i === 0 || item.position > items[i - 1]!.position), {
  message: "Decision positions must strictly increase",
});
export const sessionRecordSchema = savedModuleSchema.extend({
  kind: z.enum(["quiz", "scenario"]),
  version: z.string(),
  position: z.number().int(),
  score: z.number(),
  finished: z.boolean(),
  at: z.number(),
  decisions: scenarioDecisionHistorySchema.optional().catch(undefined),
});
export type SessionRecordShared = z.infer<typeof sessionRecordSchema>;

// Row shapes as returned by a plain `select()` on the account-owned working_* tables
// (supabase/migrations/20261117113505_account_learning_progress.sql,
// 20261117164000_working_sessions.sql) - used to read back a signed-in learner's existing
// progress (e.g. on sign-in, to merge it into local state), as opposed to the write-side RPCs.
export const bookmarkRowSchema = z.object({ module_key: z.string() });
export const lessonRowSchema = z.object({ module_key: z.string(), completed: z.boolean() });
export const sessionRowSchema = z.object({
  module_key: z.string(),
  kind: z.enum(["quiz", "scenario"]),
  version: z.string(),
  position: z.number().int(),
  score: z.number(),
  finished: z.boolean(),
  updated_at: z.string(),
  decisions: scenarioDecisionHistorySchema.nullish().catch(undefined),
});
// working_attempts (supabase/migrations/20261117161800_working_attempts_leitner_box.sql) - the
// per-question spaced-revision record: which question, whether it was answered correctly, when,
// and the Leitner box the server computed from it (public.working_record_attempt). Read back on
// sign-in to merge into the device's own locally-computed box, the same way bookmarks/lessons/
// sessions are.
export const attemptRowSchema = z.object({
  question_id: z.string(),
  correct: z.boolean(),
  answered_at: z.string(),
  box: z.number().int().min(1).max(5),
});
export type BookmarkRow = z.infer<typeof bookmarkRowSchema>;
export type LessonRow = z.infer<typeof lessonRowSchema>;
export type SessionRow = z.infer<typeof sessionRowSchema>;
export type AttemptRow = z.infer<typeof attemptRowSchema>;
