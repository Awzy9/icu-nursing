// content/working-ecg.json's shape, served via the existing /api/content/labs/ecg endpoint.
// Mirrors src/lib/working/ecg.ts's EcgExercise exactly.
import { z } from "zod";
import { waveformTraceSchema } from "./waveform";

export const ecgExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  objective: z.tuple([z.string(), z.string()]),
  lessonHref: z.string(),
  accessibleDescription: z.array(z.string()),
  trace: waveformTraceSchema,
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
  evidenceSources: z.array(z.string()),
});
export type EcgExercise = z.infer<typeof ecgExerciseSchema>;
