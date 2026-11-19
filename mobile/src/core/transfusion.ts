// content/working-transfusion.json's shape, served via the existing
// /api/content/labs/transfusion endpoint. Mirrors src/lib/working/transfusion.ts's
// TransfusionExercise exactly - the simplest shape of any lab (no lessonHref, no
// evidenceSources: the website hardcodes a single "read the lesson" link, /working/D08-T03,
// for every exercise, which mobile mirrors the same way).
import { z } from "zod";

export const transfusionExerciseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  vignette: z.string(),
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
});
export type TransfusionExercise = z.infer<typeof transfusionExerciseSchema>;

// The fixed lesson every exercise links to on the website (src/components/working/transfusion-exercise.tsx).
export const TRANSFUSION_LESSON_KEY = "D08-T03";
