import { z } from "zod";

export const localized = z.record(z.string(), z.string());
export type Localized = z.infer<typeof localized>;

const feedback = z.object({
  correct_option_id: z.string(),
  is_correct: z.boolean(),
  rationale: localized,
  explanations: z.record(z.string(), localized).nullable().transform((v) => v ?? {}),
});

const item = z.object({
  position: z.number().int(),
  question_id: z.string(),
  domain_slug: z.string(),
  domain_title: localized,
  difficulty: z.number().int(),
  synthetic: z.boolean(),
  flagged: z.boolean(),
  bookmarked: z.boolean(),
  voided: z.boolean(),
  unavailable: z.boolean(),
  selected_option_id: z.string().nullable(),
  revealed: z.boolean(),
  stem: localized.nullable(),
  options: z.array(z.object({ id: z.string(), text: localized })).nullable().transform((v) => v ?? []),
  feedback: feedback.nullable(),
});

const summary = z.object({
  correct: z.number().int(),
  total: z.number().int(),
  score_tenths: z.number().int(),
  timed_out: z.boolean(),
  answered: z.number().int(),
  flagged: z.number().int(),
  duration_seconds: z.number().int(),
  by_domain: z.array(z.object({ slug: z.string(), title: localized, correct: z.number().int(), total: z.number().int() })),
});

/** Wire format returned by qb_get_attempt (and produced identically by the fixture service). */
export const attemptSchema = z.object({
  id: z.string(),
  mode: z.enum(["practice", "exam"]),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  question_count: z.number().int(),
  started_at: z.string(),
  expires_at: z.string().nullable(),
  time_limit_seconds: z.number().int().nullable(),
  server_now: z.string(),
  last_position: z.number().int(),
  completed_at: z.string().nullable(),
  domain_filter: z.array(z.string()),
  items: z.array(item),
  summary: summary.nullable(),
});
export type AttemptView = z.infer<typeof attemptSchema>;
export type ItemView = z.infer<typeof item>;
export type FeedbackView = z.infer<typeof feedback>;
export type SummaryView = z.infer<typeof summary>;

export const progressSchema = z.object({
  domains: z.array(z.object({ slug: z.string(), title: localized, available: z.number().int(), answered: z.number().int(), correct: z.number().int() })),
  completed_attempts: z.number().int(),
  average_tenths: z.number().int().nullable(),
  bookmarked: z.number().int(),
  synthetic_fixtures: z.boolean(),
});
export type ProgressView = z.infer<typeof progressSchema>;

export const attemptListSchema = z.array(
  z.object({
    id: z.string(),
    mode: z.enum(["practice", "exam"]),
    status: z.enum(["in_progress", "completed", "abandoned"]),
    question_count: z.number().int(),
    answered: z.number().int(),
    correct: z.number().int().nullable(),
    total: z.number().int().nullable(),
    score_tenths: z.number().int().nullable(),
    timed_out: z.boolean(),
    started_at: z.string(),
    completed_at: z.string().nullable(),
    expires_at: z.string().nullable(),
    time_limit_seconds: z.number().int().nullable(),
  }),
);
export type AttemptListItem = z.infer<typeof attemptListSchema>[number];

export const REVISION_KINDS = ["due", "incorrect", "flagged", "bookmarked"] as const;
export type RevisionKind = (typeof REVISION_KINDS)[number];

export const studyOverviewSchema = z.object({
  due: z.number().int(),
  incorrect: z.number().int(),
  flagged: z.number().int(),
  bookmarked: z.number().int(),
  reviewed_today: z.number().int(),
  next_due_at: z.string().nullable(),
  boxes: z.array(z.number().int()).length(5),
  domains: z.array(z.object({ slug: z.string(), title: localized, available: z.number().int(), answered: z.number().int(), correct: z.number().int(), due: z.number().int() })),
  synthetic_fixtures: z.boolean(),
});
export type StudyOverview = z.infer<typeof studyOverviewSchema>;

export const historySchema = z.array(
  z.object({
    attempt_id: z.string(),
    mode: z.enum(["practice", "exam"]),
    question_id: z.string(),
    domain_slug: z.string(),
    domain_title: localized,
    stem: localized,
    is_correct: z.boolean(),
    answered_at: z.string(),
    synthetic: z.boolean(),
  }),
);
export type HistoryItem = z.infer<typeof historySchema>[number];

export type AnswerResult = { cleared?: boolean; feedback?: FeedbackView };

export const startInputSchema = z.object({
  mode: z.enum(["practice", "exam"]),
  count: z.number().int().min(1).max(100),
  domains: z.array(z.string().regex(/^[a-z0-9-]+$/).max(60)).max(20).default([]),
  timeLimitMinutes: z.number().int().min(1).max(240).nullable().default(null),
  bookmarkedOnly: z.boolean().default(false),
});
export type StartInput = z.input<typeof startInputSchema>;

export type QuestionBankErrorCode = "auth" | "not_found" | "conflict" | "invalid" | "limit" | "unavailable";
export class QuestionBankError extends Error {
  constructor(public code: QuestionBankErrorCode, message: string) {
    super(message);
  }
}

export interface QuestionBankService {
  readonly mode: "database" | "fixtures";
  progress(): Promise<ProgressView>;
  listAttempts(): Promise<AttemptListItem[]>;
  startAttempt(input: StartInput): Promise<string>;
  getAttempt(id: string): Promise<AttemptView | null>;
  submitAnswer(id: string, position: number, optionId: string | null): Promise<AnswerResult>;
  setFlag(id: string, position: number, flagged: boolean): Promise<void>;
  setPosition(id: string, position: number): Promise<void>;
  submitAttempt(id: string): Promise<AttemptView>;
  discardAttempt(id: string): Promise<void>;
  setBookmark(questionId: string, bookmarked: boolean): Promise<void>;
  studyOverview(): Promise<StudyOverview>;
  startRevision(kind: RevisionKind, count: number, domains?: string[]): Promise<string>;
  history(limit?: number): Promise<HistoryItem[]>;
}
