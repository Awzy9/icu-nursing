import { describe, expect, it } from "vitest";
import { computeHemodynamics as computeHemodynamicsMobile, type HemoInputs } from "../../mobile/src/core/hemodynamics";
import { computeHemodynamics as computeHemodynamicsWeb } from "@/lib/working/hemodynamics";

// hemodynamics.ts computes live from slider input, so it is ported in full to mobile's core.
// This cross-checks mobile's output against the website's own computeHemodynamics - no drift
// between the two mirrors - across the same scenario presets the UI offers plus edge cases.
const CASES: HemoInputs[] = [
  { heartRate: 75, strokeVolume: 85, sbp: 120, dbp: 80, cvp: 5 }, // reference
  { heartRate: 120, strokeVolume: 55, sbp: 85, dbp: 45, cvp: 4 }, // distributive
  { heartRate: 125, strokeVolume: 30, sbp: 80, dbp: 55, cvp: 1 }, // hypovolemic
  { heartRate: 110, strokeVolume: 25, sbp: 80, dbp: 60, cvp: 16 }, // cardiogenic
  { heartRate: 30, strokeVolume: 10, sbp: 50, dbp: 20, cvp: 0 }, // slider min bounds
  { heartRate: 180, strokeVolume: 120, sbp: 200, dbp: 130, cvp: 25 }, // slider max bounds
  { heartRate: 75, strokeVolume: 85, sbp: 80, dbp: 100, cvp: 5 }, // invalid pressure pair (sbp < dbp)
  { heartRate: 75, strokeVolume: 85, sbp: 60, dbp: 55, cvp: 60 }, // map below cvp -> svr null
];

describe("computeHemodynamics (mirrors src/lib/working/hemodynamics.ts exactly)", () => {
  it("agrees with the website's own computeHemodynamics for every case - no drift between the two mirrors", () => {
    for (const input of CASES) {
      expect(computeHemodynamicsMobile(input)).toEqual(computeHemodynamicsWeb(input));
    }
  });

  it("returns null MAP when systolic does not exceed diastolic, and null SVR when MAP does not exceed CVP", () => {
    expect(computeHemodynamicsMobile({ heartRate: 75, strokeVolume: 85, sbp: 80, dbp: 100, cvp: 5 }).map).toBeNull();
    expect(computeHemodynamicsMobile({ heartRate: 75, strokeVolume: 85, sbp: 60, dbp: 55, cvp: 60 }).svr).toBeNull();
  });
});
