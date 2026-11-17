import { describe, expect, it } from "vitest";
import { interpretAbg } from "@/lib/working/abg";

describe("interpretAbg - normal and boundary values", () => {
  it("classifies a textbook-normal panel as normal", () => {
    const r = interpretAbg({ pH: 7.4, paco2: 40, hco3: 24 });
    expect(r.phStatus).toBe("normal");
    expect(r.primaryDisorder).toBe("normal");
    expect(r.compensation).toBe("not_applicable");
  });

  it("treats the exact pH/PaCO2/HCO3 boundary values as still normal (inclusive ranges)", () => {
    const r = interpretAbg({ pH: 7.35, paco2: 45, hco3: 22 });
    expect(r.phStatus).toBe("normal");
    expect(r.primaryDisorder).toBe("normal");
  });

  it("flags just-outside-boundary values as abnormal", () => {
    expect(interpretAbg({ pH: 7.34, paco2: 40, hco3: 24 }).phStatus).toBe("acidemia");
    expect(interpretAbg({ pH: 7.46, paco2: 40, hco3: 24 }).phStatus).toBe("alkalemia");
  });
});

describe("interpretAbg - the four simple uncompensated primary disorders", () => {
  it("acute (uncompensated) respiratory acidosis", () => {
    const r = interpretAbg({ pH: 7.25, paco2: 60, hco3: 24 });
    expect(r.primaryDisorder).toBe("respiratory_acidosis");
    expect(r.compensation).toBe("uncompensated");
  });

  it("acute (uncompensated) respiratory alkalosis", () => {
    const r = interpretAbg({ pH: 7.55, paco2: 25, hco3: 24 });
    expect(r.primaryDisorder).toBe("respiratory_alkalosis");
    expect(r.compensation).toBe("uncompensated");
  });

  it("uncompensated metabolic acidosis (DKA-type panel)", () => {
    const r = interpretAbg({ pH: 7.1, paco2: 40, hco3: 10 });
    expect(r.primaryDisorder).toBe("metabolic_acidosis");
    expect(r.compensation).toBe("uncompensated");
  });

  it("uncompensated metabolic alkalosis", () => {
    const r = interpretAbg({ pH: 7.55, paco2: 44, hco3: 34 });
    expect(r.primaryDisorder).toBe("metabolic_alkalosis");
    expect(r.compensation).toBe("uncompensated");
  });
});

describe("interpretAbg - partial and full compensation", () => {
  it("partially-compensated metabolic acidosis matches Winter's formula direction", () => {
    // HCO3 15 -> Winter's expected PaCO2 = 1.5*15+8 = 30.5 (+/-2) -> 28.5-32.5
    const r = interpretAbg({ pH: 7.3, paco2: 30, hco3: 15 });
    expect(r.primaryDisorder).toBe("metabolic_acidosis");
    expect(r.compensation).toBe("partially_compensated");
    expect(r.expectedCompensationRange![0]).toBeCloseTo(28.5, 1);
    expect(r.expectedCompensationRange![1]).toBeCloseTo(32.5, 1);
  });

  it("flags metabolic acidosis with inadequate respiratory compensation (PaCO2 too high for the HCO3, but not itself abnormal)", () => {
    // HCO3 15 -> Winter's expects PaCO2 28.5-32.5; PaCO2 40 is within the normal reference range
    // but still higher than Winter's formula predicts for this HCO3 - inadequate compensation,
    // not a separate respiratory disorder (that would need PaCO2 itself outside 35-45).
    const r = interpretAbg({ pH: 7.3, paco2: 40, hco3: 15 });
    expect(r.primaryDisorder).toBe("metabolic_acidosis");
    expect(r.notes.join(" ")).toMatch(/higher than Winter's formula/);
  });

  it("fully-compensated chronic respiratory acidosis reads as a normal-ish pH with a clear respiratory lean", () => {
    // Large PaCO2 rise, HCO3 rise much bigger than metabolic-side normal-range width -> respiratory primary
    const r = interpretAbg({ pH: 7.36, paco2: 70, hco3: 36 });
    expect(r.phStatus).toBe("normal");
    expect(r.primaryDisorder).toBe("respiratory_acidosis");
    expect(r.compensation).toBe("fully_compensated");
  });

  it("fully-compensated metabolic alkalosis reads with a clear metabolic lean", () => {
    // HCO3 far outside normal, PaCO2 only modestly elevated -> metabolic primary
    const r = interpretAbg({ pH: 7.42, paco2: 48, hco3: 34 });
    expect(r.phStatus).toBe("normal");
    expect(r.primaryDisorder).toBe("metabolic_alkalosis");
    expect(r.compensation).toBe("fully_compensated");
  });

  it("flags a genuinely ambiguous fully-compensated panel as requiring clinical correlation", () => {
    const r = interpretAbg({ pH: 7.4, paco2: 50, hco3: 28 });
    expect(r.compensation).toBe("fully_compensated");
    expect(r.notes.join(" ")).toMatch(/cannot be determined from this gas panel alone/);
  });
});

describe("interpretAbg - mixed disorders and inconsistent values", () => {
  it("recognises a mixed (combined) acidosis", () => {
    const r = interpretAbg({ pH: 7.05, paco2: 60, hco3: 15 });
    expect(r.primaryDisorder).toBe("mixed_acidosis");
  });

  it("recognises a mixed (combined) alkalosis", () => {
    const r = interpretAbg({ pH: 7.6, paco2: 28, hco3: 32 });
    expect(r.primaryDisorder).toBe("mixed_alkalosis");
  });

  it("flags a physiologically inconsistent combination rather than guessing", () => {
    // Acidemia with completely normal PaCO2 and HCO3 - nothing explains the pH.
    const r = interpretAbg({ pH: 7.2, paco2: 40, hco3: 24 });
    expect(r.primaryDisorder).toBe("inconsistent");
    expect(r.notes.length).toBeGreaterThan(0);
  });
});

describe("interpretAbg - oxygenation", () => {
  it("classifies oxygenation bands from PaO2 alone", () => {
    expect(interpretAbg({ pH: 7.4, paco2: 40, hco3: 24, pao2: 95 }).oxygenation).toBe("normal");
    expect(interpretAbg({ pH: 7.4, paco2: 40, hco3: 24, pao2: 70 }).oxygenation).toBe("mild_hypoxemia");
    expect(interpretAbg({ pH: 7.4, paco2: 40, hco3: 24, pao2: 50 }).oxygenation).toBe("moderate_hypoxemia");
    expect(interpretAbg({ pH: 7.4, paco2: 40, hco3: 24, pao2: 35 }).oxygenation).toBe("severe_hypoxemia");
  });

  it("reports the P/F ratio only when FiO2 is given, and leaves oxygenation unassessed with no PaO2", () => {
    const withFio2 = interpretAbg({ pH: 7.4, paco2: 40, hco3: 24, pao2: 80, fio2: 0.4 });
    expect(withFio2.pfRatio).toBeCloseTo(200, 1);
    const noPao2 = interpretAbg({ pH: 7.4, paco2: 40, hco3: 24 });
    expect(noPao2.oxygenation).toBe("not_assessed");
    expect(noPao2.pfRatio).toBeUndefined();
  });
});
