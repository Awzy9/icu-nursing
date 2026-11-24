import { describe, expect, it } from "vitest";
import { allAbgCases, abgCase } from "@/lib/working/abg-case";
import { interpretAbg } from "@/lib/working/abg";

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

  it("checks independently specified answer keys and same-sample gas consistency", () => {
    const expected = [
      ["ABG-01", "respiratory_acidosis", "Respiratory acidosis with an acute-compatible bicarbonate response"],
      ["ABG-02", "metabolic_acidosis", "Metabolic acidosis with respiratory compensation within the expected range"],
      ["ABG-03", "respiratory_alkalosis", "Respiratory alkalosis with an acute-compatible bicarbonate response"],
      ["ABG-04", "metabolic_alkalosis", "Metabolic alkalosis with respiratory compensation within the expected range"],
      ["ABG-05", "respiratory_acidosis", "Respiratory acidosis with elevated bicarbonate compatible with chronic compensation"],
      ["ABG-06", "mixed_acidosis", "Mixed respiratory and metabolic acidosis"],
      ["ABG-07", "normal", "No apparent acid-base disturbance in the displayed values"],
      ["ABG-08", "mixed_opposing", "Possible mixed metabolic acidosis and respiratory alkalosis"],
    ] as const;
    expect(cases.map(c => c.key)).toEqual(expected.map(e => e[0]));
    for (const [key, disorder, answer] of expected) {
      const c = cases.find(c => c.key === key)!;
      expect(interpretAbg(c.gases).primaryDisorder, key).toBe(disorder);
      expect(c.question.options[c.question.answer], key).toBe(answer);
      expect(Math.abs(c.gases.pH - (6.1 + Math.log10(c.gases.hco3 / (0.03 * c.gases.paco2)))), key).toBeLessThan(0.015);
    }
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
