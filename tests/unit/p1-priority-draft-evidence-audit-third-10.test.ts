import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const draft = (file: string) => JSON.parse(readFileSync("content/drafts/" + file, "utf8"));
describe("Priority audit 21–30 — safety boundaries", () => {
  it("makes CRRT blood return conditional on device safety and competency", () => {
    const skill = draft("skills/SK-17-crrt-circuit-monitoring.json");
    const scenario = draft("scenarios/SC-15-crrt-circuit-complication.json");
    expect(skill.checklist[5].text).toContain("Do not attempt blood return");
    expect(scenario.steps[1].options[2].feedback).toContain("contraindicated");
  });
  it("does not delay urgent neurological reassessment for repeat GCS scoring", () => {
    const scenario = draft("scenarios/SC-20-acute-neurological-deterioration.json");
    expect(scenario.steps[0].options[0].text).toContain("activate urgent clinical reassessment");
    expect(scenario.steps[0].options[0].feedback).toContain("Do not wait");
  });
  it("separates infusion order clarification from interruption of essential support", () => {
    const p = draft("practice/PX-02-sbar-call-to-raise-a-concern-about-a-prescribed.json");
    expect(p.setup).toContain("not abruptly interrupted");
    expect(p.items.find((x: {id: string}) => x.id === "i4").text).toContain("safe interim plan");
  });
  it("adds a bedside monitoring check for the registered linezolid label warning", () => {
    const m = draft("medications/MD-28-linezolid.json");
    expect(m.monitoring.some((x: {text: string}) => x.text.includes("rhabdomyolysis"))).toBe(true);
    expect(m.clinically_reviewed).toBe(false);
  });
  it("does not delay treatment for an unstable arterial-line patient", () => {
    const s = draft("skills/SK-01-arterial-line-care.json");
    expect(s.checklist[6].text).toContain("Escalate instability without waiting");
  });
  it("does not use the whoosh test or encourage re-exposure to an anaphylaxis trigger", () => {
    expect(draft("scenarios/SC-18-aspiration-event.json").steps[1].options[2].sources).toContain("S-NHSE-NGT-2016");
    expect(draft("scenarios/SC-19-anaphylaxis.json").steps[2].options[2].feedback).toContain("Do not re-expose");
  });
});
