import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { validateEquipmentDraft, type EquipmentDraft } from "@/lib/equipment-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
const load = (file: string) => JSON.parse(readFileSync("content/drafts/equipment/" + file + ".json", "utf8")) as EquipmentDraft;
describe("P1 equipment safety reconciliation", () => {
  const vent = load("EQ-02-ventilator-waveforms");
  const pump = load("EQ-04-infusion-pumps");
  const defib = load("EQ-05-defibrillators");
  it("retains review gates and evidence requirements for all three devices", () => {
    for (const d of [vent, pump, defib]) {
      expect(validateEquipmentDraft(d, loadScenarioKnownSources())).toEqual([]);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.required_sources).toHaveLength(3);
      expect(d.required_sources[0]).toContain("Independent appraisal");
    }
  });
  it("teaches clinical assessment alongside ventilator displays", () => {
    expect(vent.monitoring_concepts.some(c => c.text.includes("screen data alone") && c.sources.includes("S-AARC-PVA"))).toBe(true);
  });
  it("teaches pump power failure and safe removal from service", () => {
    expect(pump.monitoring_concepts.some(c => c.text.includes("power reserve") && c.sources.includes("S-FDA-PUMP-FAILURE-EXAMPLES"))).toBe(true);
    expect(pump.escalation_concepts.some(c => c.text.includes("remove a suspected faulty pump from service"))).toBe(true);
  });
  it("preserves airway-specific fire safety and postshock reassessment", () => {
    expect(defib.safety_concepts.some(c => c.text.includes("Do not routinely disconnect") && c.sources.includes("S-ERC-ALS-2025"))).toBe(true);
    expect(defib.monitoring_concepts.some(c => c.text.includes("resume compressions promptly"))).toBe(true);
  });
});
