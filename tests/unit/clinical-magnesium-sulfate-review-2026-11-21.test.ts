import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const medPath = "content/drafts/medications/MD-18-magnesium-sulfate.json";

describe("MD-18 magnesium sulfate clinical-safety review 2026-11-21", () => {
  const med = JSON.parse(read(medPath));

  it("includes serious magnesium toxicity warning signs and escalation", () => {
    const a = med.sections.adverse_effects.items.map((x: {text:string}) => x.text.toLowerCase()).join(" ");
    for(const item of ["reflexes", "respiratory paralysis", "circulatory collapse", "hypocalcemia", "aluminum"])
      expect(a).toContain(item);
    const alerts = med.sections.safety_alerts.items.map((x:{text:string})=>x.text.toLowerCase()).join(" ");
    expect(alerts).toContain("heart block");
    expect(alerts).toContain("neuromuscular");
    expect(alerts).toContain("cardiac glycosides");
    expect(med.sections.escalation.items[0].text).toContain("emergency response");
  });

  it("protects the formulation distinction and preserves prescriber/pharmacy responsibilities", () => {
    const notes = med.sections.nursing_responsibilities.items.map((x:{text:string})=>x.text).join(" ");
    expect(notes).toContain("Concentrated products and premixed bags");
    expect(notes).toContain("Never improvise product preparation");
    expect(med.sections.institution_preparation.items[0].support).toBe("local_protocol");
    expect(med.sections.institution_dosing.items[0].support).toBe("local_protocol");
    expect(med.sections.safety_alerts.items.every((x:{support:string;sources:string[]})=>["sourced","partial"].includes(x.support)&&x.sources.includes("L-MAGNESIUM"))).toBe(true);
  });

  it("retains the registered FDA label and clinical draft gates", () => {
    expect(med.med_id).toBe("MD-18");
    expect(med.label_ref).toBe("L-MAGNESIUM");
    expect(med.status).toBe("DRAFT");
    expect(med.clinically_reviewed).toBe(false);
    expect(med.pharmacist_reviewed).toBe(false);
    expect(med.sources.some((x:{id:string})=>x.id==="L-MAGNESIUM")).toBe(true);
    expect(med.sources.some((x:{id:string})=>x.id.startsWith("S-IDSA-"))).toBe(false);
    expect(JSON.stringify(med)).not.toContain("grams/hour");
    expect(read("content/drafts/medications/LABEL_SOURCES.csv")).toContain("d4b5863a-efb9-4551-a9ad-2b06e8666d87");
  });

  it("keeps registered content hash and latest audit history in sync", () => {
    const hash = createHash("sha256").update(JSON.stringify(med)).digest("hex").slice(0,16);
    const index = JSON.parse(read("src/content/draft-index.json")).entries as {
      key:string;type:string;hash:string;gaps:number;clinically_reviewed:boolean;
    }[];
    const history = JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
    const entry = index.find(x=>x.key==="MD-18"&&x.type==="medications");
    expect(entry?.hash).toBe(hash);
    expect(entry?.gaps).toBe(med.gaps.length);
    expect(entry?.clinically_reviewed).toBe(false);
    expect(history["MD-18"]?.at(-1)?.hash).toBe(hash);
  });
});
