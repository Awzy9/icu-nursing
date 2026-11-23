import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const load = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const medication = (slug: string) => load(`content/drafts/medications/${slug}`);
const combined = (item: { sections: Record<string, { items: { text: string }[] }> }) =>
  Object.values(item.sections).flatMap((s) => s.items.map((x) => x.text)).join(" ");
const norepi = medication("MD-01-norepinephrine.json");
const epi = medication("MD-02-epinephrine.json");
const potassium = medication("MD-19-potassium-chloride.json");
const phenylephrine = medication("MD-30-phenylephrine.json");
const dopamine = medication("MD-31-dopamine.json");
const sepsis = load("content/drafts/scenarios/SC-01-septic-shock.json");

describe("P1 medication and simulation safety consistency", () => {
  it("distinguishes unnecessary vasopressor interruption from extravasation at a compromised catheter", () => {
    const text = combined(norepi);
    expect(text).not.toContain("Do not stop or interrupt the infusion without an instruction");
    expect(text).toMatch(/stop delivery (?:at that site|through the affected cannula)/i);
    expect(text).toMatch(/alternative (?:vascular )?access/i);
    expect(text).toMatch(/hypotension/i);
    expect(norepi.sources.some((s: { id: string }) => s.id === "S-UIC-EXTRA-2026")).toBe(true);
  });

  it("does not confuse IV epinephrine extravasation precautions with IM emergency treatment", () => {
    const text = combined(epi);
    expect(text).toContain("intramuscular");
    expect(text).toMatch(/stop administration through that catheter/i);
    expect(text).toMatch(/alternative-access plan/i);
    expect(epi.sources.some((s: { id: string }) => s.id === "S-UIC-EXTRA-2026")).toBe(true);
  });

  it("protects the site in dopamine and phenylephrine extravasation without blanket stopping all vasoactive support", () => {
    const dopamineText = combined(dopamine);
    const phenylephrineText = combined(phenylephrine);
    expect(dopamineText).not.toContain("do not stop or interrupt the infusion without an instruction");
    for (const text of [dopamineText, phenylephrineText]) {
      expect(text).toMatch(/stop (?:delivery|administration) through the (?:affected|compromised)/i);
      expect(text).toMatch(/alternative (?:authorised |vascular )?access|alternative-access/i);
    }
    for (const obj of [dopamine, phenylephrine]) {
      expect(obj.sources.some((s: { id: string }) => s.id === "S-UIC-EXTRA-2026")).toBe(true);
    }
  });

  it("uses a high-alert potassium formulation safeguard and avoids a drug dosing protocol", () => {
    const text = combined(potassium);
    expect(text).toMatch(/concentrate/i);
    expect(text).toMatch(/premix|ready-to-use/i);
    expect(text).toMatch(/magnesium/i);
    expect(text).toMatch(/IV push or flush/i);
    expect(potassium.sources.some((s: { id: string }) => s.id === "S-NHS-SPS-HYPO-2024")).toBe(true);
    expect(potassium.sections.institution_dosing.support).toBe("local_protocol");
    expect(potassium.sections.institution_preparation.support).toBe("local_protocol");
  });

  it("agrees with the septic shock training case when the vasopressor catheter is compromised", () => {
    const scenario = sepsis.steps[2];
    const best = scenario.options.find((x: { points: number }) => x.points === 2);
    expect(best.text).toMatch(/stop delivery through the affected cannula/i);
    expect(best.feedback).toMatch(/alternative access/i);
    expect(best.feedback).toMatch(/do not force-flush/i);
    expect(sepsis.steps[1].options[0].feedback).toMatch(/unnecessarily interrupt/i);
  });

  it("keeps every revised item a clinical draft with no reviewer sign-off", () => {
    for (const obj of [norepi, epi, potassium, phenylephrine, dopamine, sepsis]) {
      expect(obj.status).toBe("DRAFT");
      expect(obj.clinically_reviewed).toBe(false);
      expect(obj.clinical_reviewers).toEqual([]);
      expect(obj.banner).toContain("NOT clinically reviewed");
    }
    for (const obj of [norepi, epi, potassium, phenylephrine, dopamine]) expect(obj.pharmacist_reviewed).toBe(false);
  });
});
