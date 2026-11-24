import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Pain, anxiety, sleep and family partnership reconciliation", () => {
  const p = readFileSync("content/drafts/batch-05/D07-T03-pain-assessment.md", "utf8");
  const s = readFileSync("content/drafts/batch-05/D03-T09-sedation-monitoring.md", "utf8");
  const d = readFileSync("content/drafts/batch-02/D03-T10-delirium.md", "utf8");
  it("supports self-report and avoids treating distress as a sedation indication", () => {
    expect(p).toContain("does not automatically prevent reliable self-report");
    expect(s).toContain("insufficient evidence to recommend benzodiazepines specifically for anxiety");
    expect(s).toContain("do not escalate sedation solely because anxiety is suspected");
  });
  it("protects monitoring, consent and draft safeguards", () => {
    expect(d).toContain("never silence or disable essential alarms for sleep");
    expect(d).toContain("never defer time-critical observations");
    expect(d).toContain("make participation voluntary");
    expect(d).toContain("low certainty");
    for (const draft of [p,s,d]) expect(draft).toContain("clinically_reviewed: false");
  });
});
