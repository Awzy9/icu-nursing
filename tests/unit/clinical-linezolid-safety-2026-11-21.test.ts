import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const file = "content/drafts/medications/MD-28-linezolid.json";

describe("2026-11-21 linezolid clinical warnings audit", () => {
  const v = JSON.parse(read(file));

  it("warns about potentially consequential interactions without a blanket vasopressor prohibition", () => {
    const s = v.sections.safety_alerts.items.map((x: {text: string}) => x.text).join(" ");
    expect(s).toContain("pressor responses");
    expect(s).toContain("not an automatic blanket contraindication");
    expect(s).toContain("MAOI medications");
    const n = v.sections.nursing_responsibilities.items.map((x: {text: string}) => x.text).join(" ");
    expect(n).toContain("do not withhold necessary ICU vasoactive medicines");
    expect(n).toContain("serotonergic");
  });

  it("expands source-traced adverse effects and flags metabolic warning signs", () => {
    expect(v.sections.adverse_effects.items).toHaveLength(4);
    const text = v.sections.adverse_effects.items.map((x: {text: string}) => x.text).join(" ");
    for (const term of ["thrombocytopenia", "optic neuropathy", "serotonin syndrome", "lactic acidosis", "rhabdomyolysis", "SIADH"])
      expect(text).toContain(term);
    const mon = v.sections.monitoring.items.map((x: {text: string}) => x.text).join(" ");
    expect(mon).toContain("blood-pressure response");
    expect(mon).toContain("low bicarbonate");
    expect(mon).toContain("blood glucose");
  });

  it("remains an unapproved, no-dose draft and preserves source trace", () => {
    expect(v.status).toBe("DRAFT");
    expect(v.clinically_reviewed).toBe(false);
    expect(v.pharmacist_reviewed).toBe(false);
    expect(v.label_ref).toBe("L-LINEZOLID");
    expect(v.sources.some((x:{id:string})=>x.id==="L-LINEZOLID")).toBe(true);
    expect(JSON.stringify(v)).not.toContain("600 mg");
    const reg = read("content/drafts/medications/LABEL_SOURCES.csv");
    expect(reg).toContain("6e70e63b-bfd5-478d-a8ee-8ba22c9efabd");
  });

  it("synchronizes the generated medication draft index and evidence history", () => {
    const hash = createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0,16);
    const idx = JSON.parse(read("src/content/draft-index.json")).entries as {
      key:string; type:string; hash:string; gaps:number; clinically_reviewed:boolean;
    }[];
    const hist = JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
    const e=idx.find(x=>x.key==="MD-28"&&x.type==="medications");
    expect(e?.hash).toBe(hash);
    expect(e?.gaps).toBe(v.gaps.length);
    expect(e?.clinically_reviewed).toBe(false);
    expect(hist["MD-28"]?.at(-1)?.hash).toBe(hash);
  });
});
