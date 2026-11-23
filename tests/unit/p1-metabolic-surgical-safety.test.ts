import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

const scenario = (s: string) => JSON.parse(readFileSync(`content/drafts/scenarios/${s}`, "utf8"));
const hypo = scenario("SC-10-hypoglycemia.json");
const surgery = scenario("SC-09-postoperative-bleeding.json");
const feeding = readFileSync("content/drafts/batch-02/D07-T06-enteral-feeding.md", "utf8");
const best = (step: {options: {points: number; text: string; feedback: string}[]}) =>
  step.options.find(x => x.points === 2)!;

describe("P1 metabolic and postoperative case safety", () => {
  it("prevents an inconsistent instruction to stop a nonexistent IV insulin infusion", () => {
    expect(hypo.steps[1].observations.some((o: {value: string}) => o.value === "Not running")).toBe(true);
    expect(best(hypo.steps[1]).text).not.toMatch(/stop (any |the )?intravenous insulin/i);
    expect(best(hypo.steps[1]).feedback).toMatch(/IV insulin is not running/);
    expect(best(hypo.steps[1]).text).toMatch(/authorised|protocol/);
  });

  it("prioritizes airway safety, review of nutritional interruptions and authorised insulin changes", () => {
    expect(best(hypo.steps[0]).text).toMatch(/swallow safely/);
    expect(best(hypo.steps[2]).text).toMatch(/feed interruption/);
    expect(best(hypo.steps[2]).text).toMatch(/basal insulin in type 1 diabetes/);
    expect(hypo.sources.some((x: {id:string}) => x.id === "S-ADA-HOSP-2026")).toBe(true);
    expect(hypo.permissions.join(" ")).toMatch(/commercially cleared/i);
  });

  it("places immediate shock escalation ahead of dressing documentation", () => {
    const step = best(surgery.steps[0]);
    expect(step.text).toMatch(/urgent clinical response/);
    expect(step.text).toMatch(/haemorrhagic shock/);
    expect(step.text.indexOf("urgent clinical response")).toBeLessThan(step.text.indexOf("quantify"));
    expect(best(surgery.steps[1]).text).toMatch(/anticoagulant/);
  });

  it("links the feeding and low-glucose safety concepts without giving a dose or pump setting", () => {
    expect(feeding).toContain("## 7b. Feed interruption and insulin safety");
    expect(feeding).toContain("S-ADA-HOSP-2026");
    expect(feeding).toMatch(/do not restart feed or flush the tube/i);
    expect(feeding).toContain("an instruction to change insulin doses independently");
  });

  it("validates both fictional cases without implying clinical approval", () => {
    const known = loadScenarioKnownSources();
    for (const caseDraft of [hypo, surgery]) {
      expect(validateScenarioDraft(caseDraft, known)).toEqual([]);
      expect(caseDraft.status).toBe("DRAFT");
      expect(caseDraft.clinically_reviewed).toBe(false);
      expect(caseDraft.clinical_reviewers).toEqual([]);
      expect(caseDraft.banner).toContain("NOT clinically reviewed");
    }
  });
});
