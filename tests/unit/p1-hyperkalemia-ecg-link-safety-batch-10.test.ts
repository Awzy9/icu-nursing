import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";

const topic = readFileSync("content/drafts/batch-07/D04-T06-potassium-disorders.md", "utf8");
const sc = JSON.parse(readFileSync("content/drafts/scenarios/SC-11-severe-hyperkalemia.json", "utf8"));
const best = (i: number) => sc.steps[i].options.find((o:{points:number}) => o.points===2)!;

describe("P1 batch 10 UKKA ECG and hyperkalemia medication-link safeguards", () => {
  it("identifies the UKKA 14.1 conflict without conflating 12-lead ECG and continuous monitoring", () => {
    const section=topic.split("## 6c. ECG assessment versus continuous monitoring")[1]!.split("## 7. Nursing responsibilities")[0]!;
    expect(section).toContain("at or above 6.0 mmol/L");
    expect(section).toContain("6.5 mmol/L");
    expect(section).toContain("different combination of factors");
    expect(section).toContain("not equivalent");
    expect(section).toContain("publisher");
    expect(section).toContain("6.2 mmol/L");
  });

  it("requires immediate escalation at a dangerously elevated potassium even with uncertain sample quality", () => {
    const a=best(0);
    expect(a.text).toContain("activate urgent medical/critical-care help");
    expect(a.text).toContain("continuous cardiac monitoring");
    expect(a.text).toMatch(/in parallel, never before escalation/);
    expect(a.feedback).toContain("detailed");
    expect(a.feedback).toContain("summary");
    expect(a.feedback).toContain("Guideline 14.2");
    expect(sc.steps[0].options[1].points).toBe(0);
  });

  it("does not link a hyperkalemia treatment scenario to heparin or potassium chloride reference", () => {
    expect(sc.related.medications).toEqual(["MD-15","MD-20"]);
    expect(sc.related.medications).not.toContain("MD-19");
    expect(sc.related.medications).not.toContain("MD-14");
    expect(sc.debrief.links).toContainEqual({kind:"medication",code:"MD-20"});
    expect(sc.debrief.links).toContainEqual({kind:"medication",code:"MD-15"});
    expect(best(1).feedback).toContain("registered MD-20 calcium-gluconate product label describes hypocalcaemia");
  });

  it("continues glucose, potassium and perfusion checks despite initial ECG improvement", () => {
    const a=best(2);
    expect(a.text).toContain("rebound");
    expect(a.text).toContain("falling glucose");
    expect(a.feedback).toContain("Transient improvement");
    expect(a.text).toContain("IV-site complications");
  });

  it("uses the registered cite-only UKKA source and retains all draft release gates", () => {
    expect(sc.sources.some((s:{id:string;read:string}) => s.id==="S-UKKA-HK-2026" && s.read==="partial")).toBe(true);
    expect(sc.sources.some((s:{id:string})=>s.id==="N-UKKA-HK-2026-07")).toBe(false);
    expect(sc.permissions.join(" ")).toMatch(/RED\/cite-only/);
    expect(sc.status).toBe("DRAFT");
    expect(sc.clinically_reviewed).toBe(false);
    expect(sc.fictional_patient).toBe(true);
    expect(sc.clinical_reviewers).toEqual([]);
    expect(validateScenarioDraft(sc, loadScenarioKnownSources())).toEqual([]);
    expect(topic).toContain("clinically_reviewed: false");
  });
});
