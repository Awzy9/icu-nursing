import { describe, expect, it } from "vitest";
import data from "../../content/working-waveforms.json";
import type { WaveformExercise } from "../../mobile/src/core/waveformExercise";
import { comparableWaveforms } from "../../mobile/src/core/waveform-compare";
import { plotWaveform } from "../../mobile/src/core/plot-geometry";

const samples = data as WaveformExercise[];
const reference = samples.find((item) => item.key === "WV-01")!;

describe("clinical waveform comparison safeguards", () => {
  it("compares all three website waveform units on the same time and amplitude scale", () => {
    for (const key of ["WV-02", "WV-03"]) {
      const other = samples.find((item) => item.key === key)!;
      for (const unit of ["cmH2O", "L/min", "mL"] as const) {
        const pair = comparableWaveforms(reference, other, unit);
        expect(pair, `${key} ${unit}`).not.toBeNull();
        expect(pair!.reference.domain).toEqual(pair!.comparison.domain);
        expect(pair!.timeAxisEnd).toBeGreaterThan(0);
        const a = plotWaveform(pair!.reference, 330, 152, 7, pair!.timeAxisEnd);
        const b = plotWaveform(pair!.comparison, 330, 152, 7, pair!.timeAxisEnd);
        expect(a.points.length).toBe(pair!.reference.points.length);
        expect(b.points.length).toBe(pair!.comparison.points.length);
        expect([...a.points, ...b.points].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      }
    }
  });
  it("fails closed when a trace is missing rather than creating fictional data", () => {
    const missing = { ...reference, traces: reference.traces.filter((t) => t.unit !== "L/min") };
    expect(comparableWaveforms(reference, missing, "L/min")).toBeNull();
  });
});
