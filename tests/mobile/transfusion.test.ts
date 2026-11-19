import { describe, expect, it } from "vitest";
import { transfusionExerciseSchema } from "../../mobile/src/core/transfusion";
import { allTransfusionExercises } from "@/lib/working/transfusion";

describe("transfusionExerciseSchema and the real dataset", () => {
  const realExercises = allTransfusionExercises();

  it("ships at least one real exercise to validate against", () => {
    expect(realExercises.length).toBeGreaterThan(0);
  });

  it("validates every real exercise against the mobile schema (same shape the content API serves)", () => {
    for (const e of realExercises) expect(transfusionExerciseSchema.safeParse(e).success, `exercise ${e.key}`).toBe(true);
  });

  it("gives every exercise a unique key", () => {
    const keys = realExercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
