// content/working-defib.json's shape, served via the existing /api/content/labs/defib endpoint.
// Mirrors src/lib/working/defib.ts's DefibExercise exactly. Unlike ECG/aline, this carries no
// trace of its own - traceKey references an existing ECG exercise's trace (resolved via
// useEcgExercises in app/defib/[key].tsx), the same reuse the website's own defibTrace() does.
import { z } from "zod";

export const defibExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  vignette: z.string(),
  traceKey: z.string(),
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
});
export type DefibExercise = z.infer<typeof defibExerciseSchema>;
