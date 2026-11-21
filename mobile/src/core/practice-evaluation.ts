import type { WorkingEntryShared } from "@icu/schemas/working-content";

type Exercise = NonNullable<WorkingEntryShared["practice"]>;
export interface PracticeResponses {
  answers: Record<string, string>;
  flags: string[];
  choice: string;
  order: string[];
}
export interface PracticeEvaluation {
  ready: boolean;
  passed: boolean;
  correct: number;
  total: number;
  /** A self-assessment records reflection, not demonstrated clinical competency. */
  selfAssessment: boolean;
}

/** Pure answer evaluation shared by all five native practice-module activity types. */
export function evaluatePractice(exercise: Exercise, response: PracticeResponses): PracticeEvaluation {
  const base = (ready: boolean, correct: number, total: number, selfAssessment = false): PracticeEvaluation => ({
    ready, correct, total, passed: ready && correct === total && total > 0, selfAssessment,
  });
  switch (exercise.kind) {
    case "choice": {
      const options = exercise.options ?? [];
      const chosen = options.find((item) => item.id === response.choice);
      return base(!!chosen && options.length > 0, chosen?.correct ? 1 : 0, 1);
    }
    case "classify": {
      const items = exercise.items ?? [];
      const ready = items.length > 0 && items.every((item) => !!response.answers[item.id]);
      const correct = items.filter((item) => item.category !== undefined && response.answers[item.id] === item.category).length;
      return base(ready, correct, items.length);
    }
    case "spot": {
      const lines = exercise.lines ?? [];
      const marked = new Set(response.flags);
      const correct = lines.filter((line) => marked.has(line.id) === line.problem).length;
      return base(lines.length > 0, correct, lines.length);
    }
    case "sequence": {
      const expected = (exercise.steps ?? []).map((step) => step.id);
      const ready = expected.length > 0 &&
        response.order.length === expected.length &&
        new Set(response.order).size === expected.length &&
        response.order.every((id) => expected.includes(id));
      return base(ready, expected.filter((id, index) => response.order[index] === id).length, expected.length);
    }
    case "checklist": {
      const items = exercise.items ?? [];
      const ready = items.length > 0 && items.every((item) => ["not_started", "learning", "with_support", "independent"].includes(response.answers[item.id] ?? ""));
      // Reviewing every item completes a self-assessment; it does not indicate clinical mastery.
      return base(ready, ready ? items.length : 0, items.length, true);
    }
    default:
      return base(false, 0, 0);
  }
}
