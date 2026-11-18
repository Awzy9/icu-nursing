import { describe, expect, it } from "vitest";
import { allAlineExercises, alineExercise } from "@/lib/working/aline";

function countBaselineCrossings(points: [number, number][], baseline: number) {
  let crossings = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]![1] - baseline, cur = points[i]![1] - baseline;
    if (prev * cur < 0) crossings++;
  }
  return crossings;
}

describe("arterial line square-wave test exercise data", () => {
  const exercises = allAlineExercises();

  it("ships exactly the three damping categories, each with a valid single-correct-answer question", () => {
    expect(exercises.length).toBe(3);
    for (const e of exercises) {
      expect(e.question.options.length).toBeGreaterThanOrEqual(2);
      expect(e.question.answer).toBeGreaterThanOrEqual(0);
      expect(e.question.answer).toBeLessThan(e.question.options.length);
      expect(e.question.explanation.length).toBeGreaterThan(10);
    }
  });

  it("gives every exercise a trace, a lesson link and at least one evidence source", () => {
    for (const e of exercises) {
      expect(e.trace.points.length).toBeGreaterThan(0);
      expect(e.lessonHref).toMatch(/^\/working\//);
      expect(e.evidenceSources.length).toBeGreaterThan(0);
    }
  });

  it("keeps every trace's authored points inside its own declared domain", () => {
    for (const e of exercises) {
      const [lo, hi] = e.trace.domain;
      for (const [, v] of e.trace.points) { expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi); }
    }
  });

  it("orders the three traces by oscillation count exactly as the physics predicts: overdamped < optimal < underdamped", () => {
    const baseline = 80;
    const overdamped = alineExercise("ALN-02")!;
    const optimal = alineExercise("ALN-01")!;
    const underdamped = alineExercise("ALN-03")!;
    const overdampedCrossings = countBaselineCrossings(overdamped.trace.points, baseline);
    const optimalCrossings = countBaselineCrossings(optimal.trace.points, baseline);
    const underdampedCrossings = countBaselineCrossings(underdamped.trace.points, baseline);
    expect(overdampedCrossings).toBe(0);
    expect(optimalCrossings).toBeGreaterThan(overdampedCrossings);
    expect(underdampedCrossings).toBeGreaterThan(optimalCrossings);
  });

  it("gives every exercise a unique key", () => {
    const keys = exercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(alineExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(alineExercise("NOT-REAL")).toBeUndefined();
  });
});
