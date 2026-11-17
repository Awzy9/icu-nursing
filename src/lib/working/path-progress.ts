import type { LearningState } from "./activity-types";
import type { ResolvedStep } from "./paths";

export interface StepStatus { step: ResolvedStep; done: boolean; detail?: string }
export interface PathProgress { steps: StepStatus[]; completed: number; total: number; percent: number; nextStep: StepStatus | null }

// A "questions" step is mastered by recorded quiz attempts, not by viewing the page.
// Every other step type is self-reported ("Mark as completed"), kept distinct from quiz performance.
export function computePathProgress(steps: ResolvedStep[], state: LearningState): PathProgress {
  const computed: StepStatus[] = steps.map((step) => {
    if (step.type === "questions") {
      const attempts = state.attempts.filter((a) => a.href === step.href);
      const total = step.questionCount ?? 0;
      const correct = attempts.filter((a) => a.correct).length;
      return { step, done: total > 0 && attempts.length >= total, detail: total ? `${attempts.length}/${total}:${correct}` : undefined };
    }
    const lesson = state.lessons.find((l) => l.key === step.key);
    return { step, done: !!lesson?.completed };
  });
  const completed = computed.filter((s) => s.done).length;
  return {
    steps: computed,
    completed,
    total: computed.length,
    percent: computed.length ? Math.round((completed / computed.length) * 100) : 0,
    nextStep: computed.find((s) => !s.done) ?? null,
  };
}
