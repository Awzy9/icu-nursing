import { describe, expect, it } from "vitest";
import { allAbgCases, abgCase } from "@/lib/working/abg-case";

describe("ABG case data", () => {
  const cases = allAbgCases();

  it("ships at least one case, each with a valid single-correct-answer question", () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      const uniq = new Set(c.question.options);
      expect(uniq.size).toBe(c.question.options.length);
      expect(c.question.answer).toBeGreaterThanOrEqual(0);
      expect(c.question.answer).toBeLessThan(c.question.options.length);
      expect(c.question.explanation.length).toBeGreaterThan(10);
    }
  });

  it("gives every case a lesson link and at least one evidence source", () => {
    for (const c of cases) {
      expect(c.lessonHref).toMatch(/^\/working\//);
      expect(c.evidenceSources.length).toBeGreaterThan(0);
    }
  });

  it("gives every case a valid gas panel (pH, PaCO2 and HCO3 all present)", () => {
    for (const c of cases) {
      expect(c.gases.pH).toBeGreaterThan(6.5);
      expect(c.gases.pH).toBeLessThan(7.9);
      expect(c.gases.paco2).toBeGreaterThan(0);
      expect(c.gases.hco3).toBeGreaterThan(0);
    }
  });

  it("uses coherent gas panels and accurately reports the P/F ratio", () => {
    for (const { key, gases, oxygenationNote } of cases) {
      const calculatedPh = 6.1 + Math.log10(gases.hco3 / (0.03 * gases.paco2));
      expect(Math.abs(gases.pH - calculatedPh), key).toBeLessThan(0.01);
      if (gases.pao2 !== undefined && gases.fio2 !== undefined) {
        expect(oxygenationNote, key).toContain(String(Math.round(10 * gases.pao2 / gases.fio2) / 10));
      }
    }
  });

  it("matches the clinical answer key for all seven cases", () => {
    expect(Object.fromEntries(cases.map(({ key, question }) => [key, question.options[question.answer]]))).toEqual({
      "ABG-01": "Acute respiratory acidosis",
      "ABG-02": "Metabolic acidosis with expected respiratory compensation",
      "ABG-03": "Acute respiratory alkalosis",
      "ABG-04": "Metabolic alkalosis with expected respiratory compensation",
      "ABG-05": "Chronic respiratory acidosis with expected renal compensation",
      "ABG-06": "Mixed respiratory and metabolic acidosis",
      "ABG-07": "No evident acid–base disturbance on this panel",
    });
  });

  it("distinguishes expected respiratory compensation from concurrent respiratory acidosis", () => {
    const dka = abgCase("ABG-02")!;
    const shock = abgCase("ABG-06")!;
    const expectedPaco2 = ({ hco3 }: typeof dka.gases) => 1.5 * hco3 + 8;
    expect(Math.abs(dka.gases.paco2 - expectedPaco2(dka.gases))).toBeLessThanOrEqual(2);
    expect(shock.gases.paco2 - expectedPaco2(shock.gases)).toBeGreaterThan(2);
  });

  it("gives every case a unique key", () => {
    const keys = cases.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known case by key, and returns undefined for an unknown one", () => {
    expect(abgCase(cases[0]!.key)).toBe(cases[0]);
    expect(abgCase("NOT-A-REAL-KEY")).toBeUndefined();
  });
});
