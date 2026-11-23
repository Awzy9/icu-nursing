import { describe, expect, it } from "vitest";
process.env.CONTENT_EDITION = "working";
// Learning-path tests exercise an explicit local/staging preview, not clinical production.
process.env.NEXT_PUBLIC_APP_ENV = "staging";
process.env.VERCEL_ENV = "preview";
import { PATH_DEFS, resolveAllPaths, findPath } from "@/lib/working/paths";
import { computePathProgress } from "@/lib/working/path-progress";
import { emptyLearning } from "@/lib/working/activity-types";

describe("guided learning paths", () => {
  it("resolves every defined step against the real content catalog (no silent drops)", () => {
    for (const def of PATH_DEFS()) {
      const resolved = findPath(def.key)!;
      expect(resolved.steps.map((s) => s.key)).toEqual(def.steps);
    }
  });

  it("gives every path a bilingual title, audience, and at least one objective", () => {
    for (const p of resolveAllPaths()) {
      expect(p.title[0]).toBeTruthy();
      expect(p.title[1]).toBeTruthy();
      expect(p.audience[0]).toBeTruthy();
      expect(p.objectives.length).toBeGreaterThan(0);
      expect(p.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it("does not repeat a module key within a single path", () => {
    for (const p of resolveAllPaths()) {
      const keys = p.steps.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("computePathProgress", () => {
  const path = findPath("new-to-icu")!;

  it("starts at 0% with everything to do, next step is the first one", () => {
    const progress = computePathProgress(path.steps, emptyLearning);
    expect(progress.completed).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.nextStep?.step.key).toBe(path.steps[0]!.key);
  });

  it("marks a lesson step done only from self-reported completion, not from viewing", () => {
    const lessonStep = path.steps.find((s) => s.type === "topics")!;
    const progress = computePathProgress(path.steps, { ...emptyLearning, lessons: [{ key: lessonStep.key, title: "t", type: "topics", href: lessonStep.href, completed: true, at: 1 }] });
    expect(progress.steps.find((s) => s.step.key === lessonStep.key)?.done).toBe(true);
  });

  it("marks a quiz step done only once every embedded question has a recorded attempt", () => {
    const quizStep = path.steps.find((s) => s.type === "questions")!;
    const total = quizStep.questionCount!;
    const partial = computePathProgress(path.steps, { ...emptyLearning, attempts: [{ id: "x", title: "t", href: quizStep.href, correct: true, at: 1 }] });
    expect(partial.steps.find((s) => s.step.key === quizStep.key)?.done).toBe(false);
    const full = computePathProgress(path.steps, { ...emptyLearning, attempts: Array.from({ length: total }, (_, i) => ({ id: `q${i}`, title: "t", href: quizStep.href, correct: i % 2 === 0, at: 1 })) });
    expect(full.steps.find((s) => s.step.key === quizStep.key)?.done).toBe(true);
  });

  it("reaches 100% complete only when every step is done", () => {
    const lessons = path.steps.filter((s) => s.type !== "questions").map((s) => ({ key: s.key, title: "t", type: s.type, href: s.href, completed: true, at: 1 }));
    const attempts = path.steps.filter((s) => s.type === "questions").flatMap((s) => Array.from({ length: s.questionCount! }, (_, i) => ({ id: `${s.key}-${i}`, title: "t", href: s.href, correct: true, at: 1 })));
    const progress = computePathProgress(path.steps, { ...emptyLearning, lessons, attempts });
    expect(progress.percent).toBe(100);
    expect(progress.nextStep).toBeNull();
  });
});
