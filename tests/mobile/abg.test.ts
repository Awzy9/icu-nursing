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
  it("marks the correct option as exactly what interpretAbg computes for that case's gas panel", () => {
    for (const c of realCases) {
      const r = interpretAbg(c.gases);
      const correctOption = c.question.options[c.question.answer]!.toLowerCase();
      if (r.primaryDisorder === "normal") { expect(correctOption).toContain("normal"); continue; }
      if (r.primaryDisorder === "inconsistent") { expect(correctOption).toContain("inconsistent"); continue; }
      const disorderWord = r.primaryDisorder.split("_")[1]!;
      expect(correctOption).toContain(disorderWord);
      if (r.compensation !== "not_applicable") expect(correctOption).toContain(r.compensation.replace("_", " "));
    }
  });
});
