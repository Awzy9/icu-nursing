import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("ICU nutrition evidence reconciliation", () => {
  const s = readFileSync("content/drafts/batch-02/D07-T06-enteral-feeding.md", "utf8");
  it("retains refeeding surveillance and escalation boundaries", () => {
    expect(s).toContain("phosphate, potassium and magnesium");
    expect(s).toContain("Do not independently prescribe supplementation or advance calories");
    expect(s).toContain("a drug dose alone does not establish readiness");
    expect(s).toContain("do not initiate or advance enteral feeds without urgent team assessment");
  });
  it("does not confer approval or remove source limitations", () => {
    expect(s).toContain("clinically_reviewed: false");
    expect(s).toContain("sources_not_read: [S-ASPEN]");
    expect(s).toContain("full appraisal outstanding");
    expect(s).toContain("Withhold feed, medicines and flushes when tube position is not confirmed");
  });
});
