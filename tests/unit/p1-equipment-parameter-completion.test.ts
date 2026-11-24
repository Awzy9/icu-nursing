import { describe, expect, it } from "vitest";
import { loadEquipmentDrafts } from "../../scripts/validate-equipment-drafts";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateEquipmentDraft } from "@/lib/equipment-draft-validator";
const drafts = loadEquipmentDrafts();
const known = loadScenarioKnownSources();
describe("equipment parameter completion — draft-only", () => {
  it("explains all 28 parameters with registered sources", () => {
    const parameters = drafts.flatMap(d => d.parameters);
    expect(parameters).toHaveLength(28);
    expect(parameters.every(p => p.explanation !== null && (p.sources ?? []).length > 0)).toBe(true);
    for (const d of drafts) expect(validateEquipmentDraft(d, known), d.equipment_id).toEqual([]);
  });
  it("EQ-01 limits manufacturer evidence to the named model", () => {
    const d = drafts.find(d => d.equipment_id === "EQ-01")!;
    expect(d.device_neutral).toBe(false);
    expect(d.manufacturer_documents.length).toBeGreaterThan(0);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-02 limits manufacturer evidence to the named model", () => {
    const d = drafts.find(d => d.equipment_id === "EQ-02")!;
    expect(d.device_neutral).toBe(false);
    expect(d.manufacturer_documents.length).toBeGreaterThan(0);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-06 limits manufacturer evidence to the named model", () => {
    const d = drafts.find(d => d.equipment_id === "EQ-06")!;
    expect(d.device_neutral).toBe(false);
    expect(d.manufacturer_documents.length).toBeGreaterThan(0);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-07 limits manufacturer evidence to the named model", () => {
    const d = drafts.find(d => d.equipment_id === "EQ-07")!;
    expect(d.device_neutral).toBe(false);
    expect(d.manufacturer_documents.length).toBeGreaterThan(0);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-08 limits manufacturer evidence to the named model", () => {
    const d = drafts.find(d => d.equipment_id === "EQ-08")!;
    expect(d.device_neutral).toBe(false);
    expect(d.manufacturer_documents.length).toBeGreaterThan(0);
    expect(d.clinically_reviewed).toBe(false);
  });
});
