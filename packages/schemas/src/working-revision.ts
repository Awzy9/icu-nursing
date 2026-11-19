import { z } from "zod";

// Mirrors src/lib/working/revision.ts's RevisionQuestion - the full pool of real questions used
// by spaced revision (every question across every "questions"-type catalog entry), shared so
// native clients validate the same shape the website's own /study page is given.

export const revisionQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
  answer: z.number().int(),
  explanation: z.string(),
  moduleKey: z.string(),
  moduleTitle: z.string(),
  moduleHref: z.string(),
});
export type RevisionQuestionShared = z.infer<typeof revisionQuestionSchema>;

export const revisionQuestionsResponseSchema = z.object({ version: z.string(), items: z.array(revisionQuestionSchema) });
export type RevisionQuestionsResponse = z.infer<typeof revisionQuestionsResponseSchema>;
