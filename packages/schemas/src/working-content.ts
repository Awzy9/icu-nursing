import { z } from "zod";

// Mirrors src/lib/working/model.ts's WorkingEntry and friends - the single canonical shape of
// the website's learner-facing content, shared with native clients over the content API
// (src/app/api/content/*) so the mobile app validates the same structure it is sent.

export const learningQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
  answer: z.number().int(),
  explanation: z.string(),
});

export const scenarioStepOptionSchema = z.object({
  text: z.string(),
  points: z.number(),
  next: z.number().int().nullable(),
  feedback: z.string(),
  consequence: z.string().optional(),
});

export const scenarioStepSchema = z.object({
  position: z.number().int(),
  info: z.string(),
  prompt: z.string(),
  observations: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]), unit: z.string().optional() })).optional(),
  options: z.array(scenarioStepOptionSchema),
});

export const learningScenarioSchema = z.object({
  setting: z.string(),
  objectives: z.array(z.string()),
  steps: z.array(scenarioStepSchema),
  takeaways: z.array(z.string()),
});

export const learningPracticeSchema = z.object({
  kind: z.string(),
  setup: z.string(),
  prompt: z.string().optional(),
  categories: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  items: z.array(z.object({ id: z.string(), text: z.string(), category: z.string().optional(), why: z.string().optional() })).optional(),
  lines: z.array(z.object({ id: z.string(), text: z.string(), problem: z.boolean(), why: z.string() })).optional(),
  options: z.array(z.object({ id: z.string(), text: z.string(), correct: z.boolean(), feedback: z.string() })).optional(),
  steps: z.array(z.object({ id: z.string(), text: z.string(), why: z.string() })).optional(),
});

export const workingEntrySchema = z.object({
  key: z.string(),
  type: z.string(),
  title: z.string(),
  category: z.string(),
  body: z.string(),
  questionCount: z.number().int(),
  questions: z.array(learningQuestionSchema).optional(),
  scenario: learningScenarioSchema.optional(),
  checklist: z.array(z.string()).optional(),
  practice: learningPracticeSchema.optional(),
});
export type WorkingEntryShared = z.infer<typeof workingEntrySchema>;

export const workingEntrySummarySchema = z.object({
  key: z.string(),
  type: z.string(),
  title: z.string(),
  category: z.string(),
  questionCount: z.number().int(),
});
export type WorkingEntrySummary = z.infer<typeof workingEntrySummarySchema>;

export const catalogListResponseSchema = z.object({
  version: z.string(),
  items: z.array(workingEntrySummarySchema),
});
export type CatalogListResponse = z.infer<typeof catalogListResponseSchema>;

export const catalogEntryResponseSchema = z.object({
  version: z.string(),
  entry: workingEntrySchema,
});
export type CatalogEntryResponse = z.infer<typeof catalogEntryResponseSchema>;

// The specialized lab datasets (ECG traces, GCS cases, NEWS2 cases, ...) have one shape per
// lab; the content API serves them as-is and each lab screen parses its own known shape
// client-side, the same way the website's own lib/working/* loaders do (no shared runtime
// validation of these beyond "it is a non-empty array", matching existing website precedent).
export const labDatasetResponseSchema = z.object({
  version: z.string(),
  name: z.string(),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
});
export type LabDatasetResponse = z.infer<typeof labDatasetResponseSchema>;
