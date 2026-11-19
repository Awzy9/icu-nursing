// content/working-infusion-cases.json's shape, served via the existing
// /api/content/labs/infusion-cases endpoint. Mirrors src/lib/working/infusion-case.ts's
// InfusionCase exactly. The rate arithmetic itself (src/lib/working/infusion-math.ts's
// infusionRateMlPerHour) is not ported here for the same reason as abg.ts's interpretAbg: the
// runtime UI (like the website's own InfusionExerciseView) only shows the vignette and a fixed
// set of mL/hr options, never computes a rate live. It's used only by the website's own
// content-integrity test, which mobile's test calls directly (tests/mobile/infusion.test.ts).
import { z } from "zod";

const weightBasedOrderSchema = z.object({ kind: z.literal("mcg/kg/min"), doseOrdered: z.number(), weightKg: z.number(), concentrationMcgPerMl: z.number() });
const simpleOrderSchema = z.object({ kind: z.literal("mg/hr"), doseOrdered: z.number(), concentrationMgPerMl: z.number() });

export const infusionCaseSchema = z.object({
  key: z.string(),
  drugRef: z.string(),
  vignette: z.string(),
  order: z.union([weightBasedOrderSchema, simpleOrderSchema]),
  options: z.array(z.number()),
  answerIndex: z.number().int(),
  explanation: z.string(),
});
export type InfusionCase = z.infer<typeof infusionCaseSchema>;
