import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("legacy laboratory audit reconciliation", () => {
  it("does not equate optimal damping with verified pressure accuracy", () => {
    const item = read("content/working-aline.json").find((x: {key: string}) => x.key === "ALN-01");
    expect(item.question.answer).toBe(0);
    expect(item.question.options[0]).toContain("dynamic response");
    expect(item.question.explanation).toContain("leveling, zeroing and clinical agreement");
    expect(item.question.explanation).not.toContain("can be trusted");
  });
  it("distinguishes obeying commands and localization and avoids reassuring solely from GCS 15", () => {
    const cases = read("content/working-gcs-cases.json");
    const first = cases.find((x: {key: string}) => x.key === "GCS-01");
    const third = cases.find((x: {key: string}) => x.key === "GCS-03");
    expect(first.vignette).toContain("two-part request");
    expect(first.explanation).toContain("does not exclude neurological injury");
    expect(third.vignette).toContain("trapezius pressure");
    expect(third.vignette).toContain("above the clavicle");
    expect(third.explanation).toContain("M5");
  });
  it("prioritizes immediate patient assessment over ECG lead checks", () => {
    const items = read("content/working-ecg.json");
    const vt = items.find((x: {key: string}) => x.key === "ECG-05");
    const vf = items.find((x: {key: string}) => x.key === "ECG-06");
    const asystole = items.find((x: {key: string}) => x.key === "ECG-07");
    expect(vt.question.explanation).toContain("whether a pulse is present");
    expect(vf.question.explanation).toContain("start CPR");
    expect(asystole.question.explanation).toContain("without waiting for a lead check");
    expect(asystole.question.explanation).toContain("non-shockable");
    expect(asystole.question.answer).toBe(0);
  });
  it("keeps illustrated volume consistent with the integrated flow trace", () => {
    const items = read("content/working-waveforms.json") as {key: string; traces: {label: string; points: [number,number][]}[]; question: {explanation: string}}[];
    for (const item of items) {
      const flow = item.traces.find(x => x.label === "Flow")!.points;
      const volume = item.traces.find(x => x.label === "Volume")!.points;
      let integral = 0;
      for (let i = 1; i < flow.length; i++) {
        const [t0, f0] = flow[i - 1]!;
        const [t1, f1] = flow[i]!;
        integral += (t1 - t0) * (f0 + f1) / 2 * 1000 / 60;
      }
      expect(Math.abs(integral - volume.at(-1)![1]), item.key).toBeLessThan(1);
      expect(Math.max(...volume.map(p => p[1]))).toBe(500);
    }
    expect(items[1]!.question.explanation).toContain("possible intrinsic PEEP");
    expect(items[2]!.question.explanation).toContain("Assess the patient");
  });

});
