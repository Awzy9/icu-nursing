import { describe, expect, it } from "vitest";
import { allEcgExercises, ecgExercise } from "@/lib/working/ecg";

describe("ECG rhythm exercise data", () => {
  const exercises = allEcgExercises();

  it("ships at least one exercise, each with a valid single-correct-answer question", () => {
    expect(exercises.length).toBeGreaterThan(0);
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

  it("gives every exercise an accessible text description with real content", () => {
    for (const e of exercises) {
      expect(e.accessibleDescription.length).toBeGreaterThan(0);
      for (const line of e.accessibleDescription) expect(line.length).toBeGreaterThan(20);
    }
  });

  it("keeps every trace's authored points inside its own declared domain", () => {
    for (const e of exercises) {
      const [lo, hi] = e.trace.domain;
      for (const [, v] of e.trace.points) { expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi); }
    }
  });

  it("orders every schematic trace strictly forward in time with no conflicting timestamps", () => {
    for (const e of exercises) {
      for (let i = 1; i < e.trace.points.length; i++) {
        expect(e.trace.points[i]![0], e.key).toBeGreaterThan(e.trace.points[i - 1]![0]);
      }
    }
  });

  it("gives every exercise a unique key", () => {
    const keys = exercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(ecgExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(ecgExercise("NOT-A-REAL-KEY")).toBeUndefined();
  });
});
