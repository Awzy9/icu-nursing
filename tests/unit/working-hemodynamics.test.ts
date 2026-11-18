import { describe, expect, it } from "vitest";
import { computeHemodynamics } from "@/lib/working/hemodynamics";

describe("computeHemodynamics - formula correctness", () => {
  it("computes cardiac output as HR*SV/1000", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.cardiacOutput).toBeCloseTo(6.375, 2);
  });

  it("computes MAP as DBP + (SBP-DBP)/3", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.map).toBeCloseTo(93.33, 1);
  });

  it("computes SVR as 80*(MAP-CVP)/CO, using full-precision inputs", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.svr).toBeCloseTo(1108.496732, 5);
  });

  it("returns a null (not NaN or Infinity) cardiac output and SVR when heart rate is zero (cardiac arrest)", () => {
    const r = computeHemodynamics({ heartRate: 0, strokeVolume: 85, sbp: 60, dbp: 40, cvp: 5 });
    expect(r.cardiacOutput).toBeNull();
    expect(r.svr).toBeNull();
    expect(Number.isNaN(r.map)).toBe(false); // MAP from a measured BP is still meaningful even with CO undefined
  });

  it("returns a null SVR (not divide-by-zero garbage) when stroke volume is zero", () => {
    const r = computeHemodynamics({ heartRate: 90, strokeVolume: 0, sbp: 60, dbp: 40, cvp: 5 });
    expect(r.cardiacOutput).toBeNull();
    expect(r.svr).toBeNull();
  });
});

describe("hemodynamic calculation boundaries", () => {
  it("suppresses MAP and SVR for an inverted or flat pressure pair", () => {
    for (const sbp of [50, 60]) {
      const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp, dbp: 60, cvp: 5 });
      expect(r.map).toBeNull();
      expect(r.svr).toBeNull();
    }
  });

  it("suppresses SVR when CVP equals or exceeds estimated MAP", () => {
    for (const cvp of [25, 26]) {
      const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 35, dbp: 20, cvp });
      expect(r.map).toBe(25);
      expect(r.svr).toBeNull();
    }
  });
});
