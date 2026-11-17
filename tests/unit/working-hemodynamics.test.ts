import { describe, expect, it } from "vitest";
import { computeHemodynamics, classifyHemoPattern } from "@/lib/working/hemodynamics";

describe("computeHemodynamics - formula correctness", () => {
  it("computes cardiac output as HR*SV/1000", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.cardiacOutput).toBeCloseTo(6.375, 2);
  });

  it("computes MAP as DBP + (SBP-DBP)/3", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.map).toBeCloseTo(93.33, 1);
  });

  it("computes SVR as 80*(MAP-CVP)/CO, self-consistently with the MAP and CO this same call returned", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(r.svr).toBeCloseTo((80 * (r.map - 5)) / r.cardiacOutput!, 0);
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

describe("classifyHemoPattern - the four shock patterns and normal", () => {
  it("classifies textbook-normal values as normal", () => {
    const r = computeHemodynamics({ heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 });
    expect(classifyHemoPattern(r, 5)).toBe("normal");
  });

  it("classifies a septic (distributive) shock pattern - low SVR is the hallmark", () => {
    // Warm shock: vasodilated (low SVR), often compensatory high-ish CO, low-normal CVP
    const r = computeHemodynamics({ heartRate: 120, strokeVolume: 55, sbp: 85, dbp: 45, cvp: 4 });
    expect(r.svr!).toBeLessThan(800);
    expect(classifyHemoPattern(r, 4)).toBe("distributive");
  });

  it("classifies a hypovolemic shock pattern - low CVP, low CO, compensatory high SVR", () => {
    const r = computeHemodynamics({ heartRate: 125, strokeVolume: 30, sbp: 80, dbp: 55, cvp: 1 });
    expect(r.cardiacOutput!).toBeLessThan(4);
    expect(classifyHemoPattern(r, 1)).toBe("hypovolemic");
  });

  it("classifies a low-output state with high filling pressure as the honestly-ambiguous cardiogenic-or-obstructive category, not a forced single guess", () => {
    const r = computeHemodynamics({ heartRate: 110, strokeVolume: 25, sbp: 80, dbp: 60, cvp: 16 });
    expect(r.cardiacOutput!).toBeLessThan(4);
    expect(classifyHemoPattern(r, 16)).toBe("cardiogenic_or_obstructive");
  });

  it("returns indeterminate when cardiac output cannot be computed at all", () => {
    const r = computeHemodynamics({ heartRate: 0, strokeVolume: 0, sbp: 0, dbp: 0, cvp: 0 });
    expect(classifyHemoPattern(r, 0)).toBe("indeterminate");
  });

  it("returns indeterminate for a pattern that fits none of the defined bands", () => {
    // Normal SVR and CVP, but a mildly low CO that isn't low enough to clear the hypovolemic/cardiogenic bands.
    const r = computeHemodynamics({ heartRate: 60, strokeVolume: 60, sbp: 110, dbp: 75, cvp: 4 });
    expect(classifyHemoPattern(r, 4)).toBe("indeterminate");
  });
});
