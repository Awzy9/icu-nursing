import { describe, expect, it } from "vitest";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { MASTER_SCENARIOS, validateScenarioDraft, validateScenarioSet, type ScenarioDraft } from "@/lib/scenario-draft-validator";

const known = loadScenarioKnownSources();
const drafts = loadScenarioDrafts();
const clone = (d: ScenarioDraft): ScenarioDraft => JSON.parse(JSON.stringify(d));
const rules = (d: ScenarioDraft) => validateScenarioDraft(d, known).map((i) => i.rule);
const graph = drafts.find((d) => d.spec_level === "decision_graph")!;
const outline = drafts.find((d) => d.spec_level === "outline")!;

describe("the 20 original scenarios as DRAFT specifications", () => {
  it("covers the master list in its original order, each exactly once", () => {
    expect(drafts.length).toBe(20);
    expect(validateScenarioSet(drafts)).toEqual([]);
    drafts.forEach((d, i) => expect(d.title).toBe(MASTER_SCENARIOS[i]));
  });
  it("every draft passes every rule", () => {
    for (const d of drafts) expect(validateScenarioDraft(d, known), d.scenario_id).toEqual([]);
  });
  it("is unreviewed, fictional and partial or unsupported only", () => {
    for (const d of drafts) {
      expect(d.status).toBe("DRAFT"); expect(d.clinically_reviewed).toBe(false); expect(d.fictional_patient).toBe(true);
      expect(["partial", "unsupported"]).toContain(d.evidence_status);
    }
  });
  it("has nine decision graphs and eleven outlines, and an unsupported outline carries no actions", () => {
    expect(drafts.filter((d) => d.spec_level === "decision_graph").length).toBe(9);
    for (const d of drafts.filter((x) => x.evidence_status === "unsupported")) expect(d.expected_actions ?? []).toEqual([]);
  });
  it("rejects bad drafts", () => {
    const a = clone(graph); a.clinically_reviewed = true; expect(rules(a)).toContain("review");
    const b = clone(graph); b.title = "Something else"; expect(rules(b)).toContain("scope");
    const c = clone(graph); c.steps![0]!.options[0]!.sources = ["S-NOPE"]; expect(rules(c)).toContain("source");
    const e = clone(graph); e.steps![0]!.observations[0]!.low = 1; expect(rules(e)).toContain("observations");
    const f = clone(graph); f.steps![0]!.options[0]!.text = "Give 5 mg now"; expect(rules(f)).toContain("dosing");
    const g = clone(graph); g.steps![0]!.options[0]!.next = null; expect(rules(g)).toContain("graph");
    const h = clone(outline); h.expected_actions = []; expect(rules(h)).toContain("outline");
    const i = clone(graph); i.steps![0]!.options[0]!.consequence = ""; expect(rules(i)).toContain("consequence");
  });
});
