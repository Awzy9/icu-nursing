import { describe, expect, it } from "vitest";
import { defibExerciseSchema } from "../../mobile/src/core/defib";
import { allDefibExercises } from "@/lib/working/defib";
import { allEcgExercises } from "@/lib/working/ecg";

describe("defibExerciseSchema and the real dataset", () => {
  const realExercises = allDefibExercises();

  it("ships at least one real exercise to validate against", () => {
    expect(realExercises.length).toBeGreaterThan(0);
  });

  it("validates every real exercise against the mobile schema (same shape the content API serves)", () => {
    for (const e of realExercises) expect(defibExerciseSchema.safeParse(e).success, `exercise ${e.key}`).toBe(true);
  });

  it("references a real, existing ECG trace for every exercise - the mobile screen resolves it via useEcgExercises", () => {
    const ecgKeys = new Set(allEcgExercises().map((e) => e.key));
    for (const e of realExercises) expect(ecgKeys.has(e.traceKey), `exercise ${e.key} references ${e.traceKey}`).toBe(true);
  });

  it("gives every exercise a unique key", () => {
    const keys = realExercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
