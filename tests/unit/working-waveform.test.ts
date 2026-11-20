import { describe, expect, it } from "vitest";
import { allWaveformExercises, waveformExercise, tracePolyline, zeroLineY, type WaveformTrace } from "@/lib/working/waveform";

describe("waveform exercise data", () => {
  const exercises = allWaveformExercises();

  it("ships at least one exercise, each with a valid single-correct-answer question", () => {
    expect(exercises.length).toBeGreaterThan(0);
    for (const e of exercises) {
      expect(e.question.options.length).toBeGreaterThanOrEqual(2);
      expect(e.question.answer).toBeGreaterThanOrEqual(0);
      expect(e.question.answer).toBeLessThan(e.question.options.length);
      expect(e.question.explanation.length).toBeGreaterThan(10);
    }
  });

  it("gives every exercise at least one trace, a lesson link and at least one evidence source", () => {
    for (const e of exercises) {
      expect(e.traces.length).toBeGreaterThan(0);
      expect(e.lessonHref).toMatch(/^\/working\//);
      expect(e.evidenceSources.length).toBeGreaterThan(0);
    }
  });

  it("gives every exercise an accessible text description with real content, for anyone who can't read the chart", () => {
    for (const e of exercises) {
      expect(e.accessibleDescription.length).toBeGreaterThan(0);
      for (const line of e.accessibleDescription) expect(line.length).toBeGreaterThan(20);
    }
  });

  it("keeps every trace's authored points inside its own declared domain (the chart never silently clips real data)", () => {
    for (const e of exercises) for (const t of e.traces) {
      const [lo, hi] = t.domain;
      for (const [, v] of t.points) { expect(v).toBeGreaterThanOrEqual(lo); expect(v).toBeLessThanOrEqual(hi); }
    }
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(waveformExercise(exercises[0]!.key)).toBe(exercises[0]);
    expect(waveformExercise("NOT-A-REAL-KEY")).toBeUndefined();
  });
});

describe("tracePolyline / zeroLineY", () => {
  const trace: WaveformTrace = { label: "Test", unit: "u", domain: [-10, 10], points: [[0, -10], [1, 0], [2, 10]] };

  it("maps the data domain onto the full pixel height, within padding", () => {
    const points = tracePolyline(trace, 100, 50, 5).split(" ").map((p) => p.split(",").map(Number));
    expect(points[0]![1]).toBeCloseTo(45); // value -10 (domain low) -> bottom, near height-padding
    expect(points[2]![1]).toBeCloseTo(5); // value 10 (domain high) -> top, near padding
  });

  it("maps time 0 to the left edge and the last point's time to the right edge", () => {
    const points = tracePolyline(trace, 100, 50, 5).split(" ").map((p) => p.split(",").map(Number));
    expect(points[0]![0]).toBeCloseTo(5);
    expect(points[2]![0]).toBeCloseTo(95);
  });

  it("keeps a shorter waveform on the same time scale as a longer one", () => {
    const shorter = tracePolyline(trace, 100, 50, 5, 3).split(" ");
    const longer = tracePolyline({ ...trace, points: [...trace.points, [3, 0]] }, 100, 50, 5, 3).split(" ");
    expect(shorter).toEqual(longer.slice(0, 3));
    expect(shorter[2]).toBe("65.0,5.0");
  });

  it("places the zero line correctly inside the domain, and omits it when zero falls outside the domain", () => {
    expect(zeroLineY(trace, 50, 5)).toBeCloseTo(25);
    expect(zeroLineY({ ...trace, domain: [5, 10] }, 50, 5)).toBeNull();
  });
});
