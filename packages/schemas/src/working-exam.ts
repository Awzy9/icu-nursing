import { z } from "zod";

// Mirrors src/lib/working/exam.ts's ExamQuestion/ExamTopic and the working_exams table
// (supabase/migrations/20261117201500_working_exams.sql) - shared so native clients validate the
// same shapes the website's own exam mode uses. Exam selection and scoring stay client-side (the
// website itself passes full question objects, including answer and explanation, to its client
// component before submission - see components/working/exam-runner.tsx), so there is nothing extra
// to hide here; only the exam row's timing fields are server-authoritative.

export const examTopicSchema = z.object({ category: z.string(), count: z.number().int() });
export type ExamTopicShared = z.infer<typeof examTopicSchema>;

export const examTopicsResponseSchema = z.object({ version: z.string(), topics: z.array(examTopicSchema) });
export type ExamTopicsResponse = z.infer<typeof examTopicsResponseSchema>;

export const examQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()),
  answer: z.number().int(),
  explanation: z.string(),
  moduleKey: z.string(),
  moduleTitle: z.string(),
  moduleHref: z.string(),
  category: z.string(),
});
export type ExamQuestionShared = z.infer<typeof examQuestionSchema>;

export const examQuestionsResponseSchema = z.object({ version: z.string(), items: z.array(examQuestionSchema) });
export type ExamQuestionsResponse = z.infer<typeof examQuestionsResponseSchema>;

export const examPickRequestSchema = z.object({
  categories: z.array(z.string().min(1).max(200)).min(1).max(30),
  count: z.number().int().refine((n) => [10, 20, 30].includes(n)),
});
export type ExamPickRequest = z.infer<typeof examPickRequestSchema>;

export const examPickResponseSchema = z.object({ questionIds: z.array(z.string()), timeLimitSeconds: z.number().int() });
export type ExamPickResponse = z.infer<typeof examPickResponseSchema>;

// Row shape as returned by a plain `select()` on working_exams - used to resume an in-progress
// exam or load a submitted one for results, the same way the website's exam-store.ts does.
export const examRowSchema = z.object({
  id: z.string(),
  question_ids: z.array(z.string()),
  time_limit_seconds: z.number().int(),
  started_at: z.string(),
  submitted_at: z.string().nullable(),
  answers: z.record(z.string(), z.number().int()),
});
export type ExamRow = z.infer<typeof examRowSchema>;
