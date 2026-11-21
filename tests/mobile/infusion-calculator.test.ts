import { describe, expect, it } from "vitest";
import { doseToPumpRate, infusionDuration, volumetricRate } from "../../mobile/src/core/infusion-calculator";

describe("native infusion calculator practice", () => {
  it("calculates volumetric rate in hours and minutes", () => {
    expect(volumetricRate(150, 2, "hours")).toBe(75);
    expect(volumetricRate(150, 120, "minutes")).toBe(75);
  });
  it("calculates infusion duration", () => {
    expect(infusionDuration(120, 60)).toBe(2);
  });
  it("calculates a fixed mg/h dose", () => {
    expect(doseToPumpRate({ dose: 6, weightBased: false, doseUnit: "mg/h", concentration: 2, concentrationUnit: "mg/mL" })).toBe(3);
  });
  it("converts mcg/kg/min to mL/h", () => {
    expect(doseToPumpRate({ dose: 0.2, weightKg: 50, weightBased: true, doseUnit: "mcg/min", concentration: 100, concentrationUnit: "mcg/mL" })).toBe(6);
  });
  it("rejects missing, negative and non-finite values", () => {
    expect(volumetricRate(0, 1, "hours")).toBeNull();
    expect(infusionDuration(100, Number.NaN)).toBeNull();
    expect(doseToPumpRate({ dose: 1, weightBased: true, doseUnit: "mg/h", concentration: 1, concentrationUnit: "mg/mL" })).toBeNull();
    expect(doseToPumpRate({ dose: -1, weightBased: false, doseUnit: "mg/h", concentration: 1, concentrationUnit: "mg/mL" })).toBeNull();
  });
});
