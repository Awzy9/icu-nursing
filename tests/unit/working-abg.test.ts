import { describe, expect, it } from "vitest";
import { calculatedPh, interpretAbg } from "@/lib/working/abg";
const gas = (paco2: number, hco3: number) => ({ pH: Number(calculatedPh(paco2, hco3).toFixed(2)), paco2, hco3 });
describe("ABG educational integrity checks", () => {
  it("recognises reference-range values without ruling out occult disorders", () => {
    const r = interpretAbg(gas(40, 24));
    expect(r.primaryDisorder).toBe("normal");
    expect(r.compensation).toBe("not_applicable");
  });
  it("rejects inconsistent and nonfinite panels before pattern classification", () => {
    for (const input of [{ pH: 7.2, paco2: 40, hco3: 24 }, { pH: 7.4, paco2: 0, hco3: 24 }, { pH: NaN, paco2: 40, hco3: 24 }]) {
      expect(interpretAbg(input).primaryDisorder).toBe("inconsistent");
    }
  });
  it("checks Winter's formula independently of whether pH is normal", () => {
    const within = interpretAbg(gas(22, 9));
    expect(within.primaryDisorder).toBe("metabolic_acidosis");
    expect(within.expectedCompensationRange).toEqual([19.5, 23.5]);
    expect(within.compensation).toBe("within_expected");
    const outside = interpretAbg(gas(40, 15));
    expect(outside.compensation).toBe("outside_expected");
    expect(outside.notes.join(" ")).toMatch(/higher than Winter's formula/);
    const mixed = interpretAbg(gas(20, 12));
    expect(mixed.primaryDisorder).toBe("mixed_opposing");
    expect(mixed.compensation).toBe("outside_expected");
    expect(mixed.expectedCompensationRange).toEqual([24, 28]);
  });
  it("does not infer full compensation from normal-range pH with abnormal components", () => {
    const r = interpretAbg(gas(50, 29));
    expect(r.primaryDisorder).toBe("indeterminate");
    expect(r.compensation).toBe("indeterminate");
  });
  it("recognises respiratory and metabolic disturbances and combined disorders", () => {
    expect(interpretAbg(gas(60, 26)).primaryDisorder).toBe("respiratory_acidosis");
    expect(interpretAbg(gas(28, 22)).primaryDisorder).toBe("respiratory_alkalosis");
    expect(interpretAbg(gas(46, 34)).primaryDisorder).toBe("metabolic_alkalosis");
    expect(interpretAbg(gas(48, 12)).primaryDisorder).toBe("mixed_acidosis");
    expect(interpretAbg(gas(28, 32)).primaryDisorder).toBe("mixed_alkalosis");
  });
  it("reports a bounded FiO2 fraction only and distinguishes oxygenation from acid-base status", () => {
    expect(interpretAbg({ ...gas(40, 24), pao2: 68, fio2: 0.8 }).pfRatio).toBe(85);
    for (const fio2 of [0, 0.1, 80, Infinity]) expect(interpretAbg({ ...gas(40, 24), pao2: 68, fio2 }).pfRatio).toBeUndefined();
    expect(interpretAbg({ ...gas(40, 24), pao2: -1 }).oxygenation).toBe("not_assessed");
    expect(interpretAbg(gas(40, 24)).oxygenation).toBe("not_assessed");
  });
});
