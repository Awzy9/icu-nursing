import { describe, expect, it } from "vitest";
import { waveformExerciseSchema } from "../../mobile/src/core/waveformExercise";
import { allWaveformExercises } from "@/lib/working/waveform";

describe("waveformExerciseSchema and the real dataset", () => {
  const realExercises = allWaveformExercises();

  it("ships at least one real exercise to validate against", () => {
    expect(realExercises.length).toBeGreaterThan(0);
  });

  it("validates every real exercise against the mobile schema (same shape the content API serves)", () => {
    for (const e of realExercises) expect(waveformExerciseSchema.safeParse(e).success, `exercise ${e.key}`).toBe(true);
  });

  it("gives every exercise a unique key", () => {
    const keys = realExercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every exercise at least one trace", () => {
    for (const e of realExercises) expect(e.traces.length).toBeGreaterThan(0);
  });
});
