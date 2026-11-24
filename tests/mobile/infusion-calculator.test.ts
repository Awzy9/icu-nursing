import { describe, expect, it } from "vitest";
import { doseToPumpRate, equationSign, infusionDuration, parsePositiveDecimal, volumetricRate } from "../../mobile/src/core/infusion-calculator";

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
    expect(doseToPumpRate({ dose: 0.2, weightKg: 50, weightBased: true, doseUnit: "mcg/min", concentration: 100, concentrationUnit: "mcg/mL" })).toBeCloseTo(6, 10);
  });
  it("accepts only unambiguous positive decimal entry", () => {
    expect(parsePositiveDecimal("1.5")).toBe(1.5);
    expect(parsePositiveDecimal("1,5")).toBe(1.5);
    expect(parsePositiveDecimal("1.000")).toBe(1);
    expect(parsePositiveDecimal("0.125")).toBe(0.125);
    for (const text of ["1,000", "12,345", "0,125"]) expect(parsePositiveDecimal(text)).toBeNull();
    expect(parsePositiveDecimal(".25")).toBe(0.25);
    expect(parsePositiveDecimal("  12.00  ")).toBe(12);
    for (const value of ["", " ", "0", "-1", "+1", "0x10", "1e3", "Infinity", "NaN", "1,2,3", "1.000,5", "1/2", "9".repeat(400)]) {
      expect(parsePositiveDecimal(value)).toBeNull();
    }
  });

  it("marks rounded displayed arithmetic as approximate", () => {
    expect(equationSign(2, 3, 2 / 3)).toBe("≈");
    expect(equationSign(6, 2, 3)).toBe("=");
  });

  it("rejects missing, negative and non-finite values", () => {
    expect(volumetricRate(0, 1, "hours")).toBeNull();
    expect(infusionDuration(100, Number.NaN)).toBeNull();
    expect(doseToPumpRate({ dose: 1, weightBased: true, doseUnit: "mg/h", concentration: 1, concentrationUnit: "mg/mL" })).toBeNull();
    expect(doseToPumpRate({ dose: -1, weightBased: false, doseUnit: "mg/h", concentration: 1, concentrationUnit: "mg/mL" })).toBeNull();
  });
});
