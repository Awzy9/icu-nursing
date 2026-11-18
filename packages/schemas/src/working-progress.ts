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

export const sessionRecordSchema = savedModuleSchema.extend({
  kind: z.enum(["quiz", "scenario"]),
  version: z.string(),
  position: z.number().int(),
  score: z.number(),
  finished: z.boolean(),
  at: z.number(),
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
});
export type BookmarkRow = z.infer<typeof bookmarkRowSchema>;
export type LessonRow = z.infer<typeof lessonRowSchema>;
export type SessionRow = z.infer<typeof sessionRowSchema>;
