import { describe, expect, it } from "vitest";
import { tracePolyline, waveformTraceSchema, zeroLineY, type WaveformTrace } from "../../mobile/src/core/waveform";
import { allWaveformExercises } from "@/lib/working/waveform";

describe("tracePolyline / zeroLineY (mirrors src/lib/working/waveform.ts exactly)", () => {
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

  it("places the zero line correctly inside the domain, and omits it when zero falls outside the domain", () => {
    expect(zeroLineY(trace, 50, 5)).toBeCloseTo(25);
    expect(zeroLineY({ ...trace, domain: [5, 10] }, 50, 5)).toBeNull();
  });
});

describe("waveformTraceSchema and the real dataset", () => {
  const realTraces = allWaveformExercises().flatMap((e) => e.traces);

  it("ships at least one real trace to validate against", () => {
    expect(realTraces.length).toBeGreaterThan(0);
  });

  it("validates every real trace against the mobile schema", () => {
    for (const t of realTraces) expect(waveformTraceSchema.safeParse(t).success).toBe(true);
  });

  it("produces the same polyline as the website's own tracePolyline for every real trace - no drift between the two mirrors", async () => {
    const { tracePolyline: tracePolylineWeb } = await import("@/lib/working/waveform");
    for (const t of realTraces) expect(tracePolyline(t, 480, 90)).toBe(tracePolylineWeb(t, 480, 90));
  });
});
