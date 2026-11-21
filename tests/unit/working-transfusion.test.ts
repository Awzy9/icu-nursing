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

  it("treats fever and chills as a suspected reaction, not a confirmed benign diagnosis", () => {
    const exercise = transfusionExercise("TRX-02");
    expect(exercise).toBeDefined();
    const correct = exercise!.question.options[exercise!.question.answer]!;
    expect(correct).toContain("Stop the transfusion");
    expect(correct).toContain("transfusion service");
    expect(exercise!.question.explanation).toContain("FNHTR is a diagnosis of exclusion");
    expect(exercise!.question.explanation).toContain("Only the responsible clinical/transfusion team");
  });

  it("does not downgrade wheeze with hypotension to a mild allergic reaction", () => {
    const exercise = transfusionExercise("TRX-04");
    expect(exercise).toBeDefined();
    const correct = exercise!.question.options[exercise!.question.answer]!;
    expect(correct).toContain("Stop the transfusion immediately");
    expect(correct).toContain("epinephrine");
    expect(exercise!.question.explanation).toContain("even without rash");
    expect(exercise!.question.explanation).toContain("not a feature to dismiss");
  });

  it("does not imply that TACO requires an excessive transfusion volume", () => {
    const explanation = transfusionExercise("TRX-03")!.question.explanation;
    expect(explanation).toContain("relatively small transfused volume");
    expect(explanation).toContain("TRALI");
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(transfusionExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(transfusionExercise("NOT-REAL")).toBeUndefined();
  });
});
