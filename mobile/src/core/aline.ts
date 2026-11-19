// content/working-aline.json's shape, served via the existing /api/content/labs/aline endpoint.
// Mirrors src/lib/working/aline.ts's AlineExercise exactly - structurally identical to
// EcgExercise (core/ecg.ts), but kept as its own type the same way the website keeps them
// separate (different domain: the arterial-line square-wave damping test, not cardiac rhythm).
import { z } from "zod";
import { waveformTraceSchema } from "./waveform";

export const alineExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  objective: z.tuple([z.string(), z.string()]),
  lessonHref: z.string(),
  accessibleDescription: z.tuple([z.string(), z.string()]),
  trace: waveformTraceSchema,
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
  evidenceSources: z.array(z.string()),
});
export type AlineExercise = z.infer<typeof alineExerciseSchema>;
