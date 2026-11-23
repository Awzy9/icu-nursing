import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

const topic = readFileSync("content/drafts/batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md", "utf8");
const bleeding = JSON.parse(readFileSync("content/drafts/scenarios/SC-09-postoperative-bleeding.json", "utf8"));
const best = (s: { options: { points:number; text:string; feedback:string; sources:string[] }[] }) =>
  s.options.find(x => x.points === 2)!;

describe("P1 batch 09 coagulation and postoperative haemorrhage safeguards", () => {
  it("escalates heparin-associated active bleeding immediately, without instructing passive waiting", () => {
    expect(topic).toContain("## 7b. Active bleeding while anticoagulated");
    const q3 = topic.split("**Q3 (safety).**")[1]!.split("**Q4")[0]!;
    expect(q3).toMatch(/activate urgent bleeding escalation/);
    expect(q3).toMatch(/authorised heparin\/bleeding pathway/);
    expect(q3).not.toMatch(/wait for orders about the infusion/);
    expect(q3).toMatch(/do not wait for the next routine round/);
  });

  it("describes DIC evidence limits without implementing an unvalidated score or drug regimen", () => {
    expect(topic).toMatch(/The 2025 ISTH SSC framework updated disease-aware DIC definitions/);
    expect(topic).toMatch(/Lab specialists and treating clinicians determine the diagnosis and current score version/);
    expect(topic).toMatch(/2026 published review/);
    expect(topic).toMatch(/not to be calculated independently by learners/);
    expect(topic).toMatch(/status: DRAFT/);
    expect(topic).toMatch(/clinically_reviewed: false/);
  });

  it("maintains immediate postoperative shock response before wound documentation", () => {
    const s=best(bleeding.steps[0]);
    expect(s.text).toMatch(/urgent clinical response/);
    expect(s.text).toMatch(/haemorrhagic shock/);
    expect(s.text.indexOf("urgent clinical response")).toBeLessThan(s.text.indexOf("quantify"));
  });

  it("requires authorised emergency transfusion procedure and avoids laboratory-only diagnosis", () => {
    const s=best(bleeding.steps[2]);
    expect(s.text).toMatch(/emergency transfusion identification and reaction-monitoring procedures/);
    expect(s.text).toMatch(/without assigning a DIC diagnosis/);
    expect(s.feedback).toMatch(/do not by themselves diagnose DIC/);
    expect(s.sources).toContain("S-ISTH-DIC-2025");
    expect(s.sources).toContain("S-ARUP-DIC");
    expect(bleeding.steps[2].options.find((o:{points:number;text:string})=>o.points===0&&o.text.includes("Start the blood"))!.feedback).toMatch(/hospital's emergency issue/);
    expect(bleeding.sources.find((s:{id:string})=>s.id==="S-ISTH-DIC-2025")?.read).toBe("partial");
  });

  it("retains unreviewed fictional scenario and validated structure", () => {
    expect(bleeding.status).toBe("DRAFT");
    expect(bleeding.fictional_patient).toBe(true);
    expect(bleeding.clinically_reviewed).toBe(false);
    expect(bleeding.clinical_reviewers).toEqual([]);
    expect(validateScenarioDraft(bleeding,loadScenarioKnownSources())).toEqual([]);
  });
});
