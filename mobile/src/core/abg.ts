// content/working-abg.json's shape, served via the existing /api/content/labs/abg endpoint.
// Mirrors src/lib/working/abg-case.ts's AbgCase exactly. The acid-base interpretation algorithm
// itself (src/lib/working/abg.ts's interpretAbg) is not ported here: like the website's own
// AbgExerciseView, the runtime UI only displays the gas panel and a static multiple-choice
// question - interpretAbg is used solely by the website's own content-integrity tests, which
// mobile's tests call directly (tests/mobile/abg.test.ts) rather than duplicating the algorithm.
import { z } from "zod";

export const abgCaseSchema = z.object({
  key: z.string(),
  title: z.tuple([z.string(), z.string()]),
  vignette: z.string(),
  gases: z.object({ pH: z.number(), paco2: z.number(), hco3: z.number(), pao2: z.number().optional(), fio2: z.number().optional() }),
  lessonHref: z.string(),
  question: z.object({ prompt: z.string(), options: z.array(z.string()), answer: z.number().int(), explanation: z.string() }),
  oxygenationNote: z.string().nullable(),
  evidenceSources: z.array(z.string()),
});
export type AbgCase = z.infer<typeof abgCaseSchema>;
