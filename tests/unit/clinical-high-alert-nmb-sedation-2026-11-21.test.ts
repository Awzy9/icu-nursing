import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const specs = [
  {key:"MD-07", file:"MD-07-midazolam.json", kind:"IV"},
  {key:"MD-08", file:"MD-08-dexmedetomidine.json", kind:"IV"},
  {key:"MD-12", file:"MD-12-rocuronium.json", kind:"NMB"},
  {key:"MD-13", file:"MD-13-cisatracurium.json", kind:"NMB"},
  {key:"MD-43", file:"MD-43-succinylcholine.json", kind:"NMB"},
] as const;

describe("2026 high-alert NMB and IV sedation source check", () => {
  it("marks the risk and preserves precise route/population scope", () => {
    for(const x of specs){
      const d=JSON.parse(read(`content/drafts/medications/${x.file}`));
      expect(d.high_alert, x.key).toBe(true);
      expect(d.high_alert_note).toContain("ISMP");
      expect(d.high_alert_note).toContain(x.kind==="IV"?"INTRAVENOUS":"neuromuscular blocking agents");
      expect(d.sections.safety_alerts.items.some((v:{text:string})=>v.text.startsWith("High-alert classification"))).toBe(true);
      const alert=d.sections.safety_alerts.items.find((v:{text:string})=>v.text.startsWith("High-alert classification"));
      expect(alert?.sources).toContain("S-ISMP-HAM-2024");
      expect(alert?.sources).toContain(d.label_ref);
      expect(d.sources.some((v:{id:string})=>v.id==="S-ISMP-HAM-2024")).toBe(true);
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    }
  });
  it("keeps the five topic hashes and source records synchronized and disallows dosing in learner draft", () => {
    const index=JSON.parse(read("src/content/draft-index.json")).entries as {
      key:string; type:string; hash:string; clinically_reviewed:boolean; sources:{id:string}[];
    }[];
    const history=JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
    const sources=read("sources/source_register.csv");
    expect(sources).toContain("S-ISMP-HAM-2024,");
    for(const x of specs){
      const d=JSON.parse(read(`content/drafts/medications/${x.file}`));
      const h=createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
      const e=index.find(v=>v.key===x.key&&v.type==="medications");
      expect(e?.hash).toBe(h);
      expect(e?.clinically_reviewed).toBe(false);
      expect(e?.sources.some(v=>v.id==="S-ISMP-HAM-2024")).toBe(true);
      expect(history[x.key]?.at(-1)?.hash).toBe(h);
      const body=JSON.stringify({...d,gaps:undefined,permissions:undefined,high_alert_note:undefined});
      expect(body).not.toMatch(/\b\d+([.,]\d+)?\s*(mcg|µg|mg|g|kg|units?|meq|mmol|ml|dl)\b/i);
    }
  });
});
