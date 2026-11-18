import { describe, expect, it } from "vitest";
import { simulateVentCycle, type VentParams } from "@/lib/working/vent-model";

const normal: VentParams = { tidalVolume: 450, respRate: 14, peep: 5, inspiratoryTime: 1, compliance: 50, resistance: 10 };

describe("simulateVentCycle - equation of motion correctness", () => {
  it("matches hand-calculated plateau and peak pressure for a normal breath (P = PEEP + V/C + R*flow)", () => {
    const r = simulateVentCycle(normal);
    // flow = 0.45 L/s; elastic = 450/50 = 9; resistive = 10*0.45 = 4.5
    expect(r.plateauPressure).toBeCloseTo(5 + 9, 2); // 14
    expect(r.peakPressure).toBeCloseTo(5 + 9 + 4.5, 2); // 18.5
  });

  it("a wider peak-to-plateau gap results from higher airway resistance alone, holding everything else fixed", () => {
    const low = simulateVentCycle({ ...normal, resistance: 5 });
    const high = simulateVentCycle({ ...normal, resistance: 25 });
    expect(low.plateauPressure).toBeCloseTo(high.plateauPressure, 2); // compliance/Vt unchanged -> same plateau
    expect(high.peakPressure - high.plateauPressure).toBeGreaterThan(low.peakPressure - low.plateauPressure);
  });

  it("lower compliance alone raises the plateau pressure for the same tidal volume", () => {
    const stiff = simulateVentCycle({ ...normal, compliance: 25 });
    const compliant = simulateVentCycle({ ...normal, compliance: 80 });
    expect(stiff.plateauPressure).toBeGreaterThan(compliant.plateauPressure);
  });

  it("a longer inspiratory time (slower flow) for the same tidal volume lowers peak pressure but not plateau", () => {
    const slow = simulateVentCycle({ ...normal, inspiratoryTime: 2 });
    const fast = simulateVentCycle({ ...normal, inspiratoryTime: 0.5 });
    expect(slow.plateauPressure).toBeCloseTo(fast.plateauPressure, 2);
    expect(slow.peakPressure).toBeLessThan(fast.peakPressure);
  });

  it("delivered volume rises monotonically during inspiration, proportionally to elapsed time, and reaches the full tidal volume at end-inspiration", () => {
    const r = simulateVentCycle(normal);
    const duringInsp = r.volume.points.filter((p) => p[0] <= 1);
    for (let i = 1; i < duringInsp.length; i++) expect(duringInsp[i]![1]).toBeGreaterThanOrEqual(duringInsp[i - 1]![1]);
    // volume at any point during inspiration should equal tidalVolume * (t / inspiratoryTime)
    for (const [t, v] of duringInsp) expect(Math.abs(v - 450 * (t / 1))).toBeLessThan(3);
    const atEndTi = duringInsp.at(-1)!;
    expect(atEndTi[1]).toBeGreaterThan(400);
  });

  it("volume decays passively back toward (not necessarily to) zero during a normal expiratory time", () => {
    const r = simulateVentCycle(normal);
    const last = r.volume.points.at(-1)!;
    expect(last[1]).toBeLessThan(50); // well below tidal volume by end of a 14/min cycle (~3.3s expiratory time, tau=0.5s)
  });

  it("flow is positive (inspiratory) during inspiration and negative (expiratory) during exhalation", () => {
    const r = simulateVentCycle(normal);
    const inspFlow = r.flow.points.find((p) => p[0] === 0)!;
    const expFlow = r.flow.points.find((p) => p[0] > 1.5)!;
    expect(inspFlow[1]).toBeGreaterThan(0);
    expect(expFlow[1]).toBeLessThan(0);
  });

  it("an inspiratory pause (plateau hold) shows a flat zero-flow segment at the plateau pressure", () => {
    const r = simulateVentCycle({ ...normal, inspiratoryPauseTime: 0.3 });
    const duringPause = r.flow.points.find((p) => p[0] > 1.05 && p[0] < 1.25);
    expect(duringPause![1]).toBe(0);
  });
});

describe("simulateVentCycle - alarm detection", () => {
  it("flags the high-pressure alarm when peak pressure reaches the threshold (stiff lungs + high resistance)", () => {
    const r = simulateVentCycle({ ...normal, compliance: 20, resistance: 30, tidalVolume: 550 });
    expect(r.peakPressure).toBeGreaterThanOrEqual(40);
    expect(r.highPressureAlarm).toBe(true);
  });

  it("does not flag the high-pressure alarm for a normal breath", () => {
    expect(simulateVentCycle(normal).highPressureAlarm).toBe(false);
  });

  it("flags the low-pressure alarm on a modelled circuit disconnect, and not on a normal breath", () => {
    const disconnected = simulateVentCycle({ ...normal, circuitDisconnected: true });
    expect(disconnected.lowPressureAlarm).toBe(true);
    expect(simulateVentCycle(normal).lowPressureAlarm).toBe(false);
  });

  it("a complete disconnect delivers no volume or pressure to the patient airway", () => {
    const disconnected = simulateVentCycle({ ...normal, circuitDisconnected: true });
    const peakVolume = Math.max(...disconnected.volume.points.map((p) => p[1]));
    expect(peakVolume).toBe(0);
    expect(disconnected.pressure.points.every(([, p]) => p === 0)).toBe(true);
  });
});

describe("simulateVentCycle - trace/domain self-consistency", () => {
  it("keeps every generated point for pressure, flow and volume within their own declared domain", () => {
    for (const params of [normal, { ...normal, circuitDisconnected: true }, { ...normal, compliance: 15, resistance: 30 }]) {
      const r = simulateVentCycle(params);
      for (const trace of [r.pressure, r.flow, r.volume]) {
        const [lo, hi] = trace.domain;
        for (const [, v] of trace.points) { expect(v).toBeGreaterThanOrEqual(lo - 0.01); expect(v).toBeLessThanOrEqual(hi + 0.01); }
      }
    }
  });

  it("rejects timings that leave no expiratory phase", () => {
    expect(() => simulateVentCycle({ ...normal, respRate: 30, inspiratoryTime: 2 })).toThrow(RangeError);
    expect(() => simulateVentCycle({ ...normal, respRate: 30, inspiratoryTime: 1.9, inspiratoryPauseTime: 0.2 })).toThrow(RangeError);
  });

  it("plots exact inspiration endpoints and retains volume when expiration is very short", () => {
    const r = simulateVentCycle({ ...normal, respRate: 30, inspiratoryTime: 1.9, resistance: 35, compliance: 80 });
    expect(r.expiratoryTime).toBeCloseTo(0.1);
    expect(r.volume.points).toContainEqual([1.9, 450]);
    expect(r.pressure.points).toContainEqual([1.9, r.peakPressure]);
    expect(r.volume.points.at(-1)![1]).toBeCloseTo(450 * Math.exp(-0.1 / 2.8), 1);
    expect(r.flow.points.at(-1)![1]).toBeLessThan(0);
    expect(r.pressure.points.at(-1)![1]).toBe(5);
  });

  it("computes cycle time directly from respiratory rate (60/RR)", () => {
    expect(simulateVentCycle({ ...normal, respRate: 12 }).cycleTime).toBeCloseTo(5, 2);
    expect(simulateVentCycle({ ...normal, respRate: 20 }).cycleTime).toBeCloseTo(3, 2);
  });
});
