import { describe, expect, it } from "vitest";
import { infusionRateMlPerHour, round1, type WeightBasedOrder, type SimpleOrder } from "@/lib/working/infusion-math";

describe("infusionRateMlPerHour - weight-based (mcg/kg/min) orders", () => {
  it("matches a hand-verified textbook example: norepinephrine 0.1 mcg/kg/min, 70 kg, 16 mcg/mL", () => {
    // Standard premix: 4 mg in 250 mL = 4000 mcg / 250 mL = 16 mcg/mL
    // rate = (0.1 * 70 * 60) / 16 = 420 / 16 = 26.25 mL/hr
    const order: WeightBasedOrder = { kind: "mcg/kg/min", doseOrdered: 0.1, weightKg: 70, concentrationMcgPerMl: 16 };
    expect(infusionRateMlPerHour(order)).toBeCloseTo(26.25, 5);
  });

  it("matches a second hand-verified example: dopamine 5 mcg/kg/min, 80 kg, 1600 mcg/mL", () => {
    // Standard premix: 400 mg in 250 mL = 400000 mcg / 250 mL = 1600 mcg/mL
    // rate = (5 * 80 * 60) / 1600 = 24000 / 1600 = 15 mL/hr
    const order: WeightBasedOrder = { kind: "mcg/kg/min", doseOrdered: 5, weightKg: 80, concentrationMcgPerMl: 1600 };
    expect(infusionRateMlPerHour(order)).toBeCloseTo(15, 5);
  });

  it("rate scales linearly with the ordered dose, holding weight and concentration fixed", () => {
    const base: WeightBasedOrder = { kind: "mcg/kg/min", doseOrdered: 0.1, weightKg: 70, concentrationMcgPerMl: 16 };
    const doubled: WeightBasedOrder = { ...base, doseOrdered: 0.2 };
    expect(infusionRateMlPerHour(doubled)).toBeCloseTo(infusionRateMlPerHour(base) * 2, 5);
  });

  it("rate scales linearly with patient weight, holding dose and concentration fixed", () => {
    const base: WeightBasedOrder = { kind: "mcg/kg/min", doseOrdered: 0.1, weightKg: 70, concentrationMcgPerMl: 16 };
    const heavier: WeightBasedOrder = { ...base, weightKg: 140 };
    expect(infusionRateMlPerHour(heavier)).toBeCloseTo(infusionRateMlPerHour(base) * 2, 5);
  });

  it("rate is inversely proportional to concentration, holding dose and weight fixed", () => {
    const base: WeightBasedOrder = { kind: "mcg/kg/min", doseOrdered: 0.1, weightKg: 70, concentrationMcgPerMl: 16 };
    const moreConcentrated: WeightBasedOrder = { ...base, concentrationMcgPerMl: 32 };
    expect(infusionRateMlPerHour(moreConcentrated)).toBeCloseTo(infusionRateMlPerHour(base) / 2, 5);
  });
});

describe("infusionRateMlPerHour - simple (mg/hr) orders", () => {
  it("matches a hand-verified example: amiodarone maintenance 0.5 mg/min = 30 mg/hr, 1.8 mg/mL", () => {
    // 900 mg in 500 mL = 1.8 mg/mL; rate = 30 / 1.8 = 16.666... mL/hr
    const order: SimpleOrder = { kind: "mg/hr", doseOrdered: 30, concentrationMgPerMl: 1.8 };
    expect(infusionRateMlPerHour(order)).toBeCloseTo(16.6667, 3);
  });

  it("is simply dose divided by concentration with no weight term", () => {
    expect(infusionRateMlPerHour({ kind: "mg/hr", doseOrdered: 10, concentrationMgPerMl: 2 })).toBeCloseTo(5, 5);
  });
});

describe("round1", () => {
  it("rounds to one decimal place", () => {
    expect(round1(26.25)).toBe(26.3);
    expect(round1(16.6667)).toBe(16.7);
    expect(round1(15)).toBe(15);
  });
});
