import { describe, expect, it } from "vitest";
import { abgCaseSchema } from "../../mobile/src/core/abg";
import { allAbgCases } from "@/lib/working/abg-case";
import { interpretAbg } from "@/lib/working/abg";

describe("abgCaseSchema and the real dataset", () => {
  const realCases = allAbgCases();

  it("ships at least one real case to validate against", () => {
    expect(realCases.length).toBeGreaterThan(0);
  });

  it("validates every real case against the mobile schema (same shape the content API serves)", () => {
    for (const c of realCases) expect(abgCaseSchema.safeParse(c).success, `case ${c.key}`).toBe(true);
  });

  it("gives every case a unique key", () => {
    const keys = realCases.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // interpretAbg is not ported to mobile (the runtime UI only shows the gas panel and a static
  // MCQ, like the website's own AbgExerciseView) - this calls the website's own function
  // directly to verify every authored answer still matches what the algorithm produces, the
  // same content-integrity check tests/unit/working-abg-case.test.ts runs for the website.
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
    expect(realCases.map(c => c.key)).toEqual(expected.map(e => e[0]));
    for (const [key, disorder, answer] of expected) {
      const c = realCases.find(c => c.key === key)!;
      expect(interpretAbg(c.gases).primaryDisorder, key).toBe(disorder);
      expect(c.question.options[c.question.answer], key).toBe(answer);
      expect(Math.abs(c.gases.pH - (6.1 + Math.log10(c.gases.hco3 / (0.03 * c.gases.paco2)))), key).toBeLessThan(0.015);
    }
  });
});
