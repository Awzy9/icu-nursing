import { z } from "zod";

// content/working-crrt.json's shape, served via GET /api/content/crrt (a dedicated endpoint,
// not the generic array-shaped /api/content/labs/[name] list - this file is a lookup object,
// {components, alarms}, the same reason case-visuals gets its own endpoint). Mirrors
// src/lib/working/crrt.ts's CrrtComponent/CrrtAlarmExercise exactly.

export const crrtComponentSchema = z.object({
  key: z.string(),
  label: z.tuple([z.string(), z.string()]),
  description: z.tuple([z.string(), z.string()]),
  alarms: z.union([z.tuple([z.string(), z.string()]), z.tuple([])]),
});
export type CrrtComponentShared = z.infer<typeof crrtComponentSchema>;

export const crrtAlarmExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  vignette: z.string(),
  componentKey: z.string(),
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
});
export type CrrtAlarmExerciseShared = z.infer<typeof crrtAlarmExerciseSchema>;

export const crrtDataSchema = z.object({ components: z.array(crrtComponentSchema), alarms: z.array(crrtAlarmExerciseSchema) });
export type CrrtData = z.infer<typeof crrtDataSchema>;

export const crrtResponseSchema = z.object({ version: z.string(), data: crrtDataSchema });
export type CrrtResponse = z.infer<typeof crrtResponseSchema>;
