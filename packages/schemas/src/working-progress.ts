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
