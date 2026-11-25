import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Medication safety and human factors reconciliation", () => {
  const [a,d,s] = ["content/drafts/batch-06/D05-T16-high-alert-medication-pump-safety.md","content/drafts/batch-01/D09-T02-documentation.md","content/drafts/batch-05/D09-T03-scope-of-practice.md"].map(p => readFileSync(p, "utf8"));
  it("retains technology and independent verification safeguards", () => {
    expect(a).toContain("Never use a prefilled saline flush syringe as a medication dilution container");
    expect(a).toContain("do not record a check that did not occur");
    expect(a).toContain("documented downtime/escalation procedure");
  });
  it("preserves patient care and reporting boundaries", () => {
    expect(d).toContain("An incident report does not replace clinical documentation");
    expect(d).toContain("A low report count may reflect under-reporting");
    expect(s).toContain("does not establish a universal ratio");
    expect(s).toContain("do not leave an unstable patient without appropriate coverage");
    for (const draft of [a,d,s]) expect(draft).toContain("clinically_reviewed: false");
  });
});
