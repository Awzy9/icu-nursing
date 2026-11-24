import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateEquipmentDraft, type EquipmentDraft } from "@/lib/equipment-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
const cases = [
  [
    "EQ-01-monitors-alarms",
    "monitoring_concepts",
    "poor perfusion",
    "S-FDA-OXIMETER-BASICS"
  ],
  [
    "EQ-03-arterial-pressure",
    "safety_concepts",
    "falsely high glucose",
    "S-MHRA-ARTERIAL-GLUCOSE"
  ],
  [
    "EQ-06-crrt-systems",
    "monitoring_concepts",
    "ionized and total calcium",
    "S-RRT-MULTIDISC-2026"
  ],
  [
    "EQ-07-enteral-feeding-pumps",
    "safety_concepts",
    "before initial placement",
    "S-NHSE-NGT-ENDURING"
  ],
  [
    "EQ-08-pressure-relieving-equipment",
    "monitoring_concepts",
    "clearance from rails",
    "S-INTL-PI-SURFACES-2026"
  ]
] as const;
describe("P1 remaining equipment safety reconciliation", () => {
  it.each(cases)("%s keeps a traceable safeguard and outstanding review requirements", (name, section, phrase, source) => {
    const d = JSON.parse(readFileSync("content/drafts/equipment/" + name + ".json", "utf8")) as EquipmentDraft;
    expect(validateEquipmentDraft(d, loadScenarioKnownSources())).toEqual([]);
    expect(d[section].some(c => c.text.includes(phrase) && c.sources.includes(source))).toBe(true);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.required_sources).toHaveLength(3);
    expect(d.required_sources[0]).toContain("Independent appraisal");
  });
});
