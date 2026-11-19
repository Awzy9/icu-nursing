// content/working-waveforms.json's shape, served via the existing /api/content/labs/waveforms
// endpoint. Mirrors src/lib/working/waveform.ts's WaveformExercise exactly - the multi-trace
// sibling of EcgExercise (core/ecg.ts), reusing the same waveformTraceSchema per trace.
import { z } from "zod";
import { waveformTraceSchema } from "./waveform";

export const waveformExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  objective: z.tuple([z.string(), z.string()]),
  lessonHref: z.string(),
  accessibleDescription: z.array(z.string()),
  traces: z.array(waveformTraceSchema),
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
  evidenceSources: z.array(z.string()),
});
export type WaveformExercise = z.infer<typeof waveformExerciseSchema>;
