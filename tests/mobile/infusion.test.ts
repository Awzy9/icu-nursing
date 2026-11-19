import { describe, expect, it } from "vitest";
import { infusionCaseSchema } from "../../mobile/src/core/infusion";
import { allInfusionCases } from "@/lib/working/infusion-case";
import { infusionRateMlPerHour, round1 } from "@/lib/working/infusion-math";

describe("infusionCaseSchema and the real dataset", () => {
  const realCases = allInfusionCases();

  it("ships at least one real case to validate against", () => {
    expect(realCases.length).toBeGreaterThan(0);
  });

  it("validates every real case against the mobile schema (same shape the content API serves)", () => {
    for (const c of realCases) expect(infusionCaseSchema.safeParse(c).success, `case ${c.key}`).toBe(true);
  });

  it("gives every case a unique key", () => {
    const keys = realCases.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  // infusionRateMlPerHour is not ported to mobile (the runtime UI only shows the vignette and a
  // fixed set of mL/hr options, like the website's own InfusionExerciseView) - this calls the
  // website's own function directly, the same content-integrity check
  // tests/unit/working-infusion-case.test.ts runs for the website.
  it("the marked-correct option is exactly what infusionRateMlPerHour computes for that case's order", () => {
    for (const c of realCases) {
      const computed = round1(infusionRateMlPerHour(c.order));
      expect(c.options[c.answerIndex]).toBe(computed);
    }
  });
});
