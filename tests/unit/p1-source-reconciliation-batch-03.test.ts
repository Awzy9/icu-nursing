import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const equipment = (name: string) => read("content/drafts/equipment/" + name + ".json");
describe("equipment monitoring evidence reconciliation", () => {
  it("traces pulse oximetry limits and clinical discrepancy", () => {
    const d = equipment("EQ-01-monitors-alarms");
    const p = d.parameters.find((x: {name:string}) => x.name === "Oxygen saturation");
    expect(p.sources).toContain("S-FDA-OXIMETER-BASICS");
    expect(p.sources).toContain("S-SSC-2026");
    expect(p.explanation).toContain("low peripheral perfusion");
    expect(p.explanation).toContain("conflicts with clinical findings");
  });
  it("distinguishes adult shock guidance from conditional sepsis guidance", () => {
    const d = equipment("EQ-03-arterial-pressure");
    const m = d.monitoring_concepts[0];
    expect(m.sources).toContain("S-ESICM-SHOCK-2025");
    expect(m.sources).toContain("S-SSC-2026");
    expect(m.text).toContain("very low certainty");
    expect(m.text).toContain("never delay urgent care");
  });
  it.each(["EQ-01-monitors-alarms", "EQ-03-arterial-pressure"])("retains draft and synchronized metadata: %s", (name) => {
    const d = equipment(name);
    const idx = read("src/content/draft-index.json").entries.find((x: {key:string}) => x.key === d.equipment_id);
    const history = read("src/content/draft-history.json").entries[d.equipment_id];
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.required_sources.length).toBeGreaterThan(0);
    expect(idx.hash).toBe(hash);
    expect(history[history.length-1].hash).toBe(hash);
    expect(idx.sources.map((s:{id:string})=>s.id).sort()).toEqual(d.sources.map((s:{id:string})=>s.id).sort());
  });
});
