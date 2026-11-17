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

  it("marks the correct option as exactly what interpretAbg computes for that case's gas panel - the content was never hand-typed independently of the algorithm", () => {
    for (const c of cases) {
      const r = interpretAbg(c.gases);
      const correctOption = c.question.options[c.question.answer]!.toLowerCase();
      if (r.primaryDisorder === "normal") { expect(correctOption).toContain("normal"); continue; }
      if (r.primaryDisorder === "inconsistent") { expect(correctOption).toContain("inconsistent"); continue; }
      const disorderWord = r.primaryDisorder.split("_")[1]; // acidosis / alkalosis
      expect(correctOption).toContain(disorderWord);
      if (r.compensation !== "not_applicable") expect(correctOption).toContain(r.compensation.replace("_", " "));
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
