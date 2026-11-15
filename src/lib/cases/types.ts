import { z } from "zod";
import { QuestionBankError } from "@/lib/question-bank/types";

export { QuestionBankError as CaseError };
const localized = z.record(z.string(), z.string());
export const CASE_SCOPES = ["assessment", "monitoring", "escalation", "independent_nursing", "order_or_protocol_required", "prescriber_or_other_discipline"] as const;
export type CaseScope = (typeof CASE_SCOPES)[number];
const scope = z.enum(CASE_SCOPES);

export const caseListSchema = z.array(
  z.object({
    id: z.string(), code: z.string(), title: localized, difficulty: z.number().int(), synthetic: z.boolean(),
    domain_slug: z.string(), domain_title: localized, steps: z.number().int(),
    in_progress_attempt: z.string().nullable(), in_progress_position: z.number().int().nullable(),
    completed: z.number().int(), best_score_tenths: z.number().int().nullable(), last_completed_attempt: z.string().nullable(),
  }),
);
export type CaseListItem = z.infer<typeof caseListSchema>[number];

export const caseProgressSchema = z.object({
  available: z.number().int(), completed_cases: z.number().int(), in_progress: z.number().int(),
  average_tenths: z.number().int().nullable(), synthetic_fixtures: z.boolean(),
});
export type CaseProgress = z.infer<typeof caseProgressSchema>;

const revealedOption = z.object({ id: z.string(), text: localized, points: z.number().int().min(0).max(2), scope, feedback: localized });
const trailStep = z.object({
  position: z.number().int(), info: localized, prompt: localized, chosen_option_id: z.string(), points: z.number().int().min(0).max(2),
  options: z.array(revealedOption),
});
const currentStep = z.object({
  position: z.number().int(), info: localized, prompt: localized,
  options: z.array(z.object({ id: z.string(), text: localized })),
});
export const caseAttemptSchema = z.object({
  id: z.string(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  started_at: z.string(), completed_at: z.string().nullable(), current_position: z.number().int(),
  case: z.object({
    id: z.string(), code: z.string(), title: localized, vignette: localized, difficulty: z.number().int(), synthetic: z.boolean(),
    steps: z.number().int(), domain_slug: z.string(), domain_title: localized,
  }),
  trail: z.array(trailStep),
  current: currentStep.nullable(),
  summary: z.object({ points: z.number().int(), max_points: z.number().int(), score_tenths: z.number().int(), steps: z.number().int(), duration_seconds: z.number().int() }).nullable(),
});
export type CaseAttemptView = z.infer<typeof caseAttemptSchema>;
export type CaseTrailStep = CaseAttemptView["trail"][number];

export interface CaseService {
  readonly mode: "database" | "fixtures";
  progress(): Promise<CaseProgress>;
  list(): Promise<CaseListItem[]>;
  start(caseId: string): Promise<string>;
  get(attemptId: string): Promise<CaseAttemptView | null>;
  choose(attemptId: string, position: number, optionId: string): Promise<CaseAttemptView>;
  discard(attemptId: string): Promise<void>;
}
