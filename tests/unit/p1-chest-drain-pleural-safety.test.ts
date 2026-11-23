import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadKnownSources } from "../../scripts/validate-skill-drafts";
import { validateSkillDraft } from "@/lib/skill-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";

const load = (name: string) => JSON.parse(readFileSync(name, "utf8"));
const drain = load("content/drafts/skills/SK-13-chest-drain-monitoring.json");
const desat = load("content/drafts/scenarios/SC-05-sudden-oxygen-desaturation.json");
const items = (sections: Record<string, { items: { text: string }[] }>) =>
  Object.values(sections).flatMap(x => x.items.map(y => y.text)).join(" ");

describe("P1 chest-drain and pneumothorax nursing recognition — batch 06", () => {
  it("prioritizes clinical deterioration over chamber readings or awaiting imaging", () => {
    const s = items(drain.sections);
    expect(s).toMatch(/patient first|assess the patient first/i);
    expect(s).toMatch(/tension physiology/i);
    expect(s).toMatch(/do not wait for a routine chest radiograph/i);
    expect(s).toMatch(/hypoxaemia|oxygenation/i);
  });

  it("never applies the effusion drainage instruction to a bubbling pneumothorax drain", () => {
    const s = items(drain.sections);
    expect(s).toMatch(/fluid drainage.*cannot be generalised to a bubbling pneumothorax drain/i);
    expect(s).toMatch(/clamping may cause life-threatening tension physiology/i);
    expect(s).toMatch(/routine or transport clamping/i);
    expect(s).toMatch(/specialist-led/i);
  });

  it("teaches bubbling/absent swinging as context-dependent, not absolute proof of an obstruction", () => {
    const s = items(drain.sections);
    expect(s).toMatch(/absence of swinging may occur after lung re-expansion/i);
    expect(s).toMatch(/obstruction/i);
    expect(s).toMatch(/dry-seal\/digital device/i);
    expect(drain.checklist.some((x: {text: string}) => x.text.includes("not assume all absent swinging means a blockage"))).toBe(true);
  });

  it("traces the educational source accurately and preserves local procedural authority", () => {
    expect(drain.sources.find((x: {id: string}) => x.id === "N-NCBI-OPENRN-CHEST")?.read).toBe("partial");
    expect(drain.sources.find((x: {id: string}) => x.id === "N-OPENRN-ADV-PDF")?.read).toBe("not_read");
    expect(drain.permissions.join(" ")).toMatch(/commercial re-use/i);
    expect(drain.sections.procedure.support).toBe("local_protocol");
    expect(validateSkillDraft(drain, loadKnownSources())).toEqual([]);
  });

  it("does not collapse the desaturation differential to secretions alone", () => {
    const s = desat.steps[0].options.find((x: {points: number}) => x.points === 2);
    expect(s.text).toMatch(/chest expansion symmetry/i);
    expect(s.text).toMatch(/urgent help/i);
    expect(s.consequence).toMatch(/other causes of deterioration/i);
    expect(desat.related.skills).toContain("SK-13");
    expect(desat.debrief.learning_points.join(" ")).toMatch(/pneumothorax/i);
    expect(validateScenarioDraft(desat, loadScenarioKnownSources())).toEqual([]);
  });

  it("keeps both revised artifacts unpublished and without reviewer signoff", () => {
    for (const obj of [drain, desat]) {
      expect(obj.status).toBe("DRAFT");
      expect(obj.clinically_reviewed).toBe(false);
      expect(obj.clinical_reviewers).toEqual([]);
      expect(obj.banner).toContain("NOT clinically reviewed");
    }
  });
});
