// Pure progress logic for guided learning paths, mirroring src/lib/working/path-progress.ts's
// shape (StepStatus/PathProgress) but with a simpler "done" rule: every step type, including a
// quiz step, is considered done from the single local "completed" flag (core/progress.ts's
// Progress.completed), rather than the website's separate attempts-based rule just for quiz
// steps. This only works because the quiz runner marks a module complete on finishing it (see
// app/quiz/[key].tsx), so "completed" means the same thing - "been through this once" - for
// every step type here. It is a deliberate simplification: mobile has no local equivalent of the
// website's per-question attempts list to replicate the website's exact rule.
import type { Progress } from "./progress";
import type { ResolvedPathShared, ResolvedStepShared } from "@icu/schemas/working-paths";

export type { ResolvedPathShared as ResolvedPath, ResolvedStepShared as ResolvedStep } from "@icu/schemas/working-paths";

export interface StepStatus { step: ResolvedStepShared; done: boolean }
export interface PathProgress { steps: StepStatus[]; completed: number; total: number; percent: number; nextStep: StepStatus | null }

export function computePathProgress(steps: ResolvedStepShared[], progress: Progress): PathProgress {
  const computed: StepStatus[] = steps.map((step) => ({ step, done: progress.completed.includes(step.key) }));
  const completed = computed.filter((s) => s.done).length;
  return {
    steps: computed,
    completed,
    total: computed.length,
    percent: computed.length ? Math.round((completed / computed.length) * 100) : 0,
    nextStep: computed.find((s) => !s.done) ?? null,
  };
}

export const pathTitle = (path: ResolvedPathShared, ar: boolean): string => path.title[ar ? 1 : 0];
export const pathAudience = (path: ResolvedPathShared, ar: boolean): string => path.audience[ar ? 1 : 0];
export const pathObjective = (pair: readonly [string, string], ar: boolean): string => pair[ar ? 1 : 0];
