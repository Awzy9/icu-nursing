import { describe, expect, it } from "vitest";
import { allDefibExercises, defibExercise, defibTrace } from "@/lib/working/defib";
import { allEcgExercises } from "@/lib/working/ecg";

describe("shockable-rhythm exercise data", () => {
  const exercises = allDefibExercises();

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

  it("references a real, existing ECG trace for every exercise - no duplicated waveform data", () => {
    const ecgKeys = new Set(allEcgExercises().map((e) => e.key));
    for (const e of exercises) expect(ecgKeys.has(e.traceKey)).toBe(true);
  });

  it("resolves the referenced trace successfully for every exercise", () => {
    for (const e of exercises) expect(defibTrace(e).points.length).toBeGreaterThan(0);
  });

  it("classifies VF and pulseless VT as shockable, and asystole/PEA as non-shockable", () => {
    const vf = defibExercise("DFB-01")!, vt = defibExercise("DFB-02")!, asystole = defibExercise("DFB-03")!, pea = defibExercise("DFB-04")!;
    expect(vf.question.options[vf.question.answer]).toMatch(/^Yes/);
    expect(vt.question.options[vt.question.answer]).toMatch(/^Yes/);
    expect(asystole.question.options[asystole.question.answer]).toMatch(/^No/);
    expect(pea.question.options[pea.question.answer]).toMatch(/^No/);
  });

  it("gives every exercise a unique key", () => {
    const keys = exercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(defibExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(defibExercise("NOT-REAL")).toBeUndefined();
  });
});
