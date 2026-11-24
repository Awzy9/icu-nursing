import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("P1 implementation: vasoactive and sedative topic safety", () => {
  it("D02-T12-vasopressor-inotrope-monitoring preserves safety and six answer keys", () => {
    const text = readFileSync("content/drafts/batch-06/D02-T12-vasopressor-inotrope-monitoring.md", "utf8");
    expect(text).toContain("Avoid interrupting a functioning essential infusion unnecessarily");
    expect(text.match(/^\*\*Answer: [A-D]\.\*\*$/gm)).toHaveLength(6);
    expect(text).toContain("clinically_reviewed: false");
  });
  it("D05-T01-sedatives-partial preserves safety and six answer keys", () => {
    const text = readFileSync("content/drafts/batch-07/D05-T01-sedatives-partial.md", "utf8");
    expect(text).toContain("do not rely on oxygen saturation alone");
    expect(text.match(/^\*\*Answer: [A-D]\.\*\*$/gm)).toHaveLength(6);
    expect(text).toContain("clinically_reviewed: false");
  });
});
