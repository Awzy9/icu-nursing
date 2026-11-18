import { describe, expect, it } from "vitest";
import { allTransfusionExercises, transfusionExercise } from "@/lib/working/transfusion";

describe("transfusion-reaction recognition exercise data", () => {
  const exercises = allTransfusionExercises();

  it("ships at least one exercise, each with a valid single-correct-answer question", () => {
    expect(exercises.length).toBeGreaterThan(0);
    for (const e of exercises) {
      expect(e.question.options.length).toBeGreaterThanOrEqual(2);
      expect(e.question.answer).toBeGreaterThanOrEqual(0);
      expect(e.question.answer).toBeLessThan(e.question.options.length);
      expect(e.question.explanation.length).toBeGreaterThan(10);
      expect(e.vignette.length).toBeGreaterThan(10);
    }
  });

  it("gives every exercise a unique key", () => {
    const keys = exercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never recommends continuing the transfusion at the same rate as the correct answer for a suspected reaction", () => {
    for (const e of exercises) {
      const correct = e.question.options[e.question.answer]!.toLowerCase();
      expect(correct).not.toMatch(/continue (the transfusion )?at the same rate/);
    }
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(transfusionExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(transfusionExercise("NOT-REAL")).toBeUndefined();
  });
});
