import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
describe("Older adult and palliative care reconciliation", () => {
  const [a,d,s,n] = ["content/drafts/batch-05/D07-T01-head-to-toe-assessment.md","content/drafts/batch-02/D03-T10-delirium.md","content/drafts/batch-05/D09-T03-scope-of-practice.md","content/drafts/batch-01/D09-T02-documentation.md"].map(p => readFileSync(p, "utf8"));
  it("keeps frailty and delirium decisions individualized", () => {
    expect(a).toContain("Age alone does not establish frailty");
    expect(a).toContain("Do not infer a treatment limitation from age or a frailty score");
    expect(d).toContain("Keep prevention and treatment decisions distinct");
    expect(a).toContain("not a blanket blood-pressure target");
  });
  it("preserves lawful authorization and documentation", () => {
    expect(s).toContain("does not automatically authorize stopping treatment");
    expect(s).toContain("do not independently stop life-sustaining therapies");
    expect(n).toContain("never infer an instruction to stop unrelated treatment");
    for (const draft of [a,d,s,n]) expect(draft).toContain("clinically_reviewed: false");
  });
});
