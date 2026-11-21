import { describe, expect, it } from "vitest";
import ecgs from "../../content/working-ecg.json";
import waveforms from "../../content/working-waveforms.json";
import { plotWaveform } from "../../mobile/src/core/plot-geometry";
import type { WaveformTrace } from "../../mobile/src/core/waveform";

describe("native ECG, ventilator and arterial line waveform geometry", () => {
  it("draws nonempty, finite points for all authored ECG traces", () => {
    for (const item of ecgs) {
      const drawing = plotWaveform(item.trace as WaveformTrace, 350);
      expect(drawing.points.length, item.key).toBeGreaterThan(1);
      if (item.key === "ECG-07") expect(new Set(drawing.points.map((p) => p.y.toFixed(2))).size, item.key).toBe(1); // asystole is deliberately flat
      else expect(new Set(drawing.points.map((p) => p.y.toFixed(2))).size, item.key).toBeGreaterThan(2);
      expect(drawing.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), item.key).toBe(true);
    }
  });
  it("draws all pressure, flow and volume traces", () => {
    for (const sample of waveforms) {
      for (const trace of sample.traces) {
        const drawing = plotWaveform(trace as WaveformTrace, 350);
        expect(drawing.points.length).toBe(trace.points.length);
        expect(drawing.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      }
    }
  });
  it("supports shared zero line and gracefully handles unavailable layout width", () => {
    expect(plotWaveform({ label: "Flow", unit: "L/min", domain: [-50, 50], points: [[0, -10], [1, 20]] }, 350).zero).toBeCloseTo(76, 1);
    expect(plotWaveform({ label: "Flow", unit: "L/min", domain: [-50, 50], points: [[0, -10], [1, 20]] }, 0).points).toEqual([]);
  });
});
