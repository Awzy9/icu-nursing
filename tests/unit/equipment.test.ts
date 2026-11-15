import { describe, expect, it } from "vitest";
import { loadEquipmentDrafts } from "../../scripts/validate-equipment-drafts";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { validateEquipmentDraft, validateEquipmentSet, type EquipmentDraft } from "@/lib/equipment-draft-validator";
import { getEquipment, listEquipment } from "@/lib/equipment";
import { EQUIPMENT_CATEGORIES, equipmentModuleSchema } from "@/lib/equipment/types";

const known = loadScenarioKnownSources();
const drafts = loadEquipmentDrafts();
const clone = (d: EquipmentDraft): EquipmentDraft => JSON.parse(JSON.stringify(d));
const rules = (d: EquipmentDraft) => validateEquipmentDraft(d, known).map((i) => i.rule);

describe("equipment-learning synthetic fixtures (the only content the app serves)", () => {
  it("covers all eight device categories with synthetic, nonclinical, bilingual modules", () => {
    const m = listEquipment();
    expect(m.map((x) => x.category).sort()).toEqual([...EQUIPMENT_CATEGORIES].sort());
    for (const x of m) {
      expect(x.synthetic).toBe(true);
      expect(x.code).toMatch(/^SYN-EQ-\d{3}$/);
      expect(x.title.ar).toBeTruthy();
      expect(x.diagram.alt.en!.length).toBeGreaterThan(20);
      expect(x.diagram.alt.ar).toBeTruthy();
      expect(x.safety.en!.length).toBeGreaterThan(0);
      expect(JSON.stringify({ ...x, category: "" })).not.toMatch(/\b(patient|mg|mmHg|ventilator|nurse)\b/i);
    }
    expect(getEquipment("SYN-EQ-001")).not.toBeNull();
    expect(getEquipment("EQ-01")).toBeNull();
  });
  it("cannot serve a real draft: the schema requires synthetic and the SYN- code", () => {
    for (const d of drafts) expect(equipmentModuleSchema.safeParse(d).success).toBe(false);
  });
});

describe("the eight DRAFT equipment specifications", () => {
  it("cover the initial device list in order and pass every rule", () => {
    expect(drafts.length).toBe(8);
    expect(validateEquipmentSet(drafts)).toEqual([]);
    for (const d of drafts) expect(validateEquipmentDraft(d, known), d.equipment_id).toEqual([]);
    drafts.forEach((d, i) => expect(d.category).toBe(EQUIPMENT_CATEGORIES[i]));
  });
  it("are unreviewed, name manufacturer documents explicitly and never explain a parameter without a source", () => {
    for (const d of drafts) {
      expect(d.clinically_reviewed).toBe(false);
      for (const p of d.parameters) { expect(p.explanation).toBeNull(); expect(p.support).toBe("needs_source"); }
      if (d.manufacturer_documents.length) expect(d.device_neutral).toBe(false);
    }
  });
  it("rejects bad drafts", () => {
    const d = drafts[0]!;
    const a = clone(d); a.clinically_reviewed = true; expect(rules(a)).toContain("review");
    const b = clone(d); b.sources.push({ id: "S-NOPE", read: "full", use: "x" }); expect(rules(b)).toContain("source");
    const c = clone(d); c.parameters[0]!.explanation = "Made-up explanation"; expect(rules(c)).toContain("parameter");
    const e = clone(d); e.safety_concepts[0]!.text = "Run it at 5 mg per hour"; expect(rules(e)).toContain("dosing");
    const f = clone(drafts[1]!); f.device_neutral = true; expect(rules(f)).toContain("manufacturer");
    const g = clone(d); g.diagram.original_graphic = false; expect(rules(g)).toContain("diagram");
  });
});
