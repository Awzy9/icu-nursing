import { describe, expect, it } from "vitest";
import { allNews2Cases, news2Case, news2CaseBand, news2CaseTotal } from "@/lib/working/news2-case";

const BAND_LABEL: Record<string, string> = { low: "low", "low-medium": "low-medium", medium: "medium", high: "high" };

describe("NEWS2 case data", () => {
  const cases = allNews2Cases();

  it("ships at least one case, each with a valid single-correct-answer question", () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(c.options.length).toBeGreaterThanOrEqual(2);
      expect(c.answer).toBeGreaterThanOrEqual(0);
      expect(c.answer).toBeLessThan(c.options.length);
      expect(c.explanation.length).toBeGreaterThan(10);
      expect(c.vignette.length).toBeGreaterThan(10);
    }
  });

  it("marks as correct only the option whose stated total matches the live NEWS2 scoring function - no hand-computation errors", () => {
    for (const c of cases) {
      const total = news2CaseTotal(c);
      const correctOption = c.options[c.answer]!;
      const match = correctOption.match(/NEWS2 = (\d+)/);
      expect(match, `case ${c.key}: correct option "${correctOption}" has no parseable total`).not.toBeNull();
      expect(Number(match![1])).toBe(total);
    }
  });

  it("gives every case's correct option a band consistent with the live NEWS2 band function", () => {
    for (const c of cases) {
      const band = news2CaseBand(c);
      const correctOption = c.options[c.answer]!.toLowerCase();
      // The option text should at least be internally consistent with the computed band's risk level.
      if (band === "high") expect(correctOption).toMatch(/high/);
      if (band === "low" && !correctOption.includes("sepsis")) expect(correctOption).not.toMatch(/medium|high/);
      void BAND_LABEL;
    }
  });

  it("gives every case a unique key", () => {
    const keys = cases.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known case by key, and returns undefined for an unknown one", () => {
    expect(news2Case(cases[0]!.key)).toBe(cases[0]);
    expect(news2Case("NOT-REAL")).toBeUndefined();
  });

  it("includes a Scale 2 (hypercapnic) case demonstrating the alternative scoring range", () => {
    expect(cases.some((c) => c.scale === "2")).toBe(true);
  });
});
