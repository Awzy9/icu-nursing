import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const equipment = (name: string) => read("content/drafts/equipment/" + name + ".json");
const names = ["EQ-04-infusion-pumps","EQ-05-defibrillators","EQ-06-crrt-systems","EQ-07-enteral-feeding-pumps","EQ-08-pressure-relieving-equipment"];

describe("equipment evidence reconciliation batch 4", () => {
  it("retains physical line tracing and enteral route safeguards", () => {
    const infusion = equipment(names[0]);
    const enteral = equipment(names[3]);
    expect(infusion.safety_concepts.some((x:{text:string;sources:string[]}) => x.text.includes("physical pathway") && x.sources.includes("S-FDA-MISCONNECTIONS"))).toBe(true);
    expect(enteral.safety_concepts.some((x:{text:string;sources:string[]}) => x.text.includes("vascular access") && x.text.includes("withhold use") && x.sources.includes("S-FDA-MISCONNECTIONS"))).toBe(true);
  });
  it("emphasizes pad placement without replacing trained resuscitation practice", () => {
    const d = equipment(names[1]);
    expect(d.safety_concepts.some((x:{text:string;sources:string[]}) => x.text.includes("pad clearance") && x.text.includes("do not delay") && x.sources.includes("S-ERC-ALS-2025"))).toBe(true);
  });
  it("distinguishes CRRT delivery and downtime from net removal", () => {
    const d = equipment(names[2]);
    const p = d.parameters.find((x:{name:string}) => x.name === "Delivered dose against prescription");
    expect(p.sources).toContain("S-RRT-MULTIDISC-2026");
    expect(p.explanation).toContain("duration and reason for interruptions");
    expect(p.explanation).toContain("not the same as net patient fluid removal");
  });
  it("retains individualized pressure injury prevention and evidence limitations", () => {
    const d = equipment(names[4]);
    expect(d.monitoring_concepts.some((x:{text:string;sources:string[]}) => x.text.includes("indirect evidence") && x.sources.includes("S-INTL-PI-REPOS-2026"))).toBe(true);
    expect(d.monitoring_concepts.some((x:{text:string;sources:string[]}) => x.text.includes("very low certainty") && x.sources.includes("S-INTL-PI-HEELS-2025"))).toBe(true);
  });
  it.each(names)("preserves draft status and synchronized evidence history: %s", (name) => {
    const d = equipment(name);
    const idx = read("src/content/draft-index.json").entries.find((x:{key:string}) => x.key === d.equipment_id);
    const hist = read("src/content/draft-history.json").entries[d.equipment_id];
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
    expect(d.clinically_reviewed).toBe(false);
    expect(d.required_sources.length).toBeGreaterThan(0);
    expect(idx.hash).toBe(hash);
    expect(hist[hist.length-1].hash).toBe(hash);
    expect(idx.sources.map((x:{id:string})=>x.id).sort()).toEqual(d.sources.map((x:{id:string})=>x.id).sort());
  });
});
