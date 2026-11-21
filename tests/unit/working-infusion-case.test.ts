import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allInfusionCases, infusionCase } from "@/lib/working/infusion-case";
import { infusionRateMlPerHour, round1 } from "@/lib/working/infusion-math";

describe("infusion practice case data", () => {
  const cases = allInfusionCases();

  it("ships at least one case, each with a valid single-correct-answer set of options", () => {
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      const uniq = new Set(c.options);
      expect(uniq.size).toBe(c.options.length);
      expect(c.answerIndex).toBeGreaterThanOrEqual(0);
      expect(c.answerIndex).toBeLessThan(c.options.length);
      expect(c.explanation.length).toBeGreaterThan(10);
    }
  });

  it("the marked-correct option is exactly what infusionRateMlPerHour computes for that case's order - never hand-typed independently of the formula", () => {
    for (const c of cases) {
      const computed = round1(infusionRateMlPerHour(c.order));
      expect(c.options[c.answerIndex]).toBe(computed);
    }
  });

  it("every drug reference points to a real medication module", () => {
    const meds = JSON.parse(readFileSync("content/working-catalog.json", "utf8")) as { key: string; type: string }[];
    const medKeys = new Set(meds.filter((m) => m.type === "medications").map((m) => m.key));
    for (const c of cases) expect(medKeys.has(c.drugRef)).toBe(true);
  });

  it("does not teach a fixed correct-answer position or present calculation cases as pump orders", () => {
    expect(cases.map((c) => c.answerIndex).sort()).toEqual([0, 1, 2, 3]);
    for (const c of cases) {
      expect(c.explanation).toContain("Fictional calculation exercise");
      expect(c.explanation).toContain("Verify the actual order, units, concentration and institutional drug library");
      expect(c.options[c.answerIndex]).toBe(round1(infusionRateMlPerHour(c.order)));
    }
  });

  it("gives every case a unique key", () => {
    const keys = cases.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known case by key, and returns undefined for an unknown one", () => {
    expect(infusionCase(cases[0]!.key)).toBe(cases[0]);
    expect(infusionCase("NOT-REAL")).toBeUndefined();
  });
});
