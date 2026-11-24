import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";

const get = (file: string) => JSON.parse(readFileSync(path.resolve(__dirname, "../..", file), "utf8"));
const sources = loadScenarioKnownSources();

describe("high-risk fictional scenario safety — 2026-11-21", () => {
  it("septic shock: distinguishes planned continuity from extravasation through the affected cannula", () => {
    const sc = get("content/drafts/scenarios/SC-01-septic-shock.json");
    expect(validateScenarioDraft(sc, sources)).toEqual([]);
    expect(sc.clinically_reviewed).toBe(false);
    expect(sc.fictional_patient).toBe(true);
    expect(sc.steps).toHaveLength(3);
    expect(sc.steps[1].options[0].points).toBe(2);
    expect(sc.steps[1].options[0].feedback).toMatch(/extravasation response plan/i);
    expect(sc.steps[1].options[0].feedback).toMatch(/stop delivery at that cannula immediately/i);
    expect(sc.sources.some((s: {id:string}) => s.id === "S-SSC-2026")).toBe(true);
    expect(sc.steps[1].options[0].sources).toContain("S-SSC-2026");
    expect(sc.steps[2].options[0].text).toContain("stop delivery through the affected cannula now");
    expect(sc.steps[2].options[0].feedback).toMatch(/alternative access/i);
    expect(sc.steps[2].options[0].feedback).toMatch(/Do not force-flush/i);
    expect(sc.steps[2].options[0].feedback).toMatch(/Preserve the site\/catheter for trained assessment/i);
    expect(sc.steps[2].options[0].points).toBe(2);
    expect(sc.steps[2].options[1].points).toBe(0);
    expect(sc.steps[2].options[2].points).toBe(0);
    expect(sc.debrief.learning_points.join(" ")).toContain("alternative vascular access");
    expect(sc.required_sources.join(" ")).toContain("Local adult vasopressor extravasation SOP");
  });
  it("ventilator: prevents an internally contradictory discovery and prioritizes rescue", () => {
    const sc = get("content/drafts/scenarios/SC-04-ventilator-alarm.json");
    expect(validateScenarioDraft(sc, sources)).toEqual([]);
    expect(sc.clinically_reviewed).toBe(false);
    expect(sc.fictional_patient).toBe(true);
    expect(sc.steps[0].info).toContain("current effective ventilation has not been established");
    expect(sc.steps[0].options[0].consequence).toContain("whether emergency ventilation support is needed");
    expect(sc.steps[1].info).toMatch(/an immediately correctable cause has not been established/i);
    expect(sc.steps[1].options[0].text).toContain("Call for skilled help");
    expect(sc.steps[1].options[0].feedback).toContain("provide alternative ventilation");
    expect(sc.steps[1].options[0].points).toBe(2);
    expect(sc.debrief.learning_points.join(" ")).toContain("local emergency pathway");
    expect(sc.gaps.join(" ")).toContain("local respiratory therapist/manufacturer sign-off");
  });
});
