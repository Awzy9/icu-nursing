import { describe, expect, it } from "vitest";
import { ecgExerciseSchema } from "../../mobile/src/core/ecg";
import { allEcgExercises } from "@/lib/working/ecg";

describe("ecgExerciseSchema and the real dataset", () => {
  const realExercises = allEcgExercises();

  it("ships at least one real exercise to validate against", () => {
    expect(realExercises.length).toBeGreaterThan(0);
  });

  it("validates every real exercise against the mobile schema (same shape the content API serves)", () => {
    for (const e of realExercises) expect(ecgExerciseSchema.safeParse(e).success, `exercise ${e.key}`).toBe(true);
  });

  it("gives every exercise a unique key", () => {
    const keys = realExercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
