import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
import { validateSkillDraft } from "@/lib/skill-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { loadKnownSources } from "../../scripts/validate-skill-drafts";

const load = (path: string) => readFileSync(path, "utf8");
const sc = JSON.parse(load("content/drafts/scenarios/SC-17-delirium-and-agitation.json"));
const sk = JSON.parse(load("content/drafts/skills/SK-23-sedation-assessment.json"));
const deliriumText = load("content/drafts/batch-02/D03-T10-delirium.md");
const nutritionText = load("content/drafts/batch-02/D07-T06-enteral-feeding.md");
const correct = (n: number) => sc.steps[n].options.find((x: {points: number}) => x.points === 2);

describe("P1 Batch 08 — delirium, sedation and nutrition source version safety", () => {
  it("assesses physiological danger before labeling acute behaviour as delirium", () => {
    const best = correct(0);
    expect(best.text).toMatch(/assess airway, breathing, oxygenation, pain/);
    expect(best.text).toMatch(/urgent review/);
    expect(best.text).toMatch(/when the patient's arousal permits/);
    expect(best.sources).toContain("S-SCCM-PADIS");
    expect(sc.sources.find((s: {id:string})=>s.id==="S-SCCM-PADIS")?.read).toBe("partial");
  });

  it("does not convert an uncertain PADIS antipsychotic recommendation into routine drug use", () => {
    const best = correct(1);
    expect(best.text).toMatch(/authorised assessment and order/);
    expect(best.feedback).toMatch(/could not recommend for or against antipsychotics/);
    const wrong = sc.steps[1].options.find((x: {text:string})=>x.text.startsWith("Give haloperidol"));
    expect(wrong.feedback).toMatch(/insufficient evidence/);
    expect(sc.debrief.learning_points.join(" ")).toMatch(/no routine haloperidol instruction/i);
  });

  it("requires separate sedation and delirium screening with a documented unassessable state", () => {
    const text = (Object.values(sk.sections) as {items:{text:string}[]}[]).flatMap(section=>section.items.map(item=>item.text)).join(" ");
    expect(text).toContain("does not by itself diagnose delirium");
    expect(text).toContain("screen could not be completed");
    expect(sk.checklist.some((x: {text:string})=>x.text.includes("false negative result"))).toBe(true);
    expect(validateSkillDraft(sk, loadKnownSources())).toEqual([]);
    expect(deliriumText).toContain("## 7b. When agitation may not be delirium");
    expect(deliriumText).toContain("not a substitute for investigating a sudden change");
  });

  it("identifies 2026 Spanish ESPEN version without claiming new licensed treatment advice", () => {
    expect(nutritionText).toContain("ESPEN source-status correction");
    expect(nutritionText).toContain("2023");
    expect(nutritionText).toContain("2026");
    expect(nutritionText).toContain("Selected sections of the English 2023 society-hosted PDF were directly checked on 2026-11-24");
    expect(nutritionText).toContain("Full appraisal, Spanish-edition comparison and commercial reuse permissions remain review tasks");
    expect(nutritionText).toContain("the Spanish edition remains a bibliographic signpost only");
    expect(nutritionText).toContain("Neither is used to prescribe a new bedside regimen");
  });

  it("preserves clinical review and original scenario validation gates", () => {
    expect(validateScenarioDraft(sc, loadScenarioKnownSources())).toEqual([]);
    for (const obj of [sc, sk]) {
      expect(obj.status).toBe("DRAFT");
      expect(obj.clinically_reviewed).toBe(false);
      expect(obj.clinical_reviewers).toEqual([]);
      expect(obj.banner).toContain("NOT clinically reviewed");
    }
    expect(deliriumText).toContain("status: DRAFT");
    expect(nutritionText).toContain("status: DRAFT");
  });
});
