import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root=path.resolve(__dirname,"../..");
const read=(p:string)=>readFileSync(path.join(root,p),"utf8");
const medPath="content/drafts/medications/MD-20-calcium-gluconate.json";

describe("Calcium gluconate MD-20 label safety recheck 2026-11-21",()=>{
 const med=JSON.parse(read(medPath));
 it("preserves neonatal ceftriaxone contraindication versus adult sequential-plan safeguards",()=>{
   const a=med.sections.safety_alerts.items.map((x:{text:string})=>x.text).join(" ");
   expect(a).toContain("neonates 28 days of age or younger receiving ceftriaxone");
   expect(a).toContain("patients older than the neonatal restriction");
   expect(a).toContain("must not be administered simultaneously");
   expect(a).toContain("hypercalcemia");
   expect(med.monitoring.some((x:{text:string})=>x.text.includes("patient's age"))).toBe(true);
 });
 it("calls out cardiovascular, tissue and calcium monitoring hazards",()=>{
   const adverse=med.sections.adverse_effects.items.map((x:{text:string})=>x.text.toLowerCase()).join(" ");
   for(const term of ["slow heart rate","syncope","cardiac arrest","calcinosis","necrosis","hypercalcemia"])
      expect(adverse).toContain(term);
   const safety=med.sections.safety_alerts.items.map((x:{text:string})=>x.text).join(" ");
   expect(safety).toContain("cardiac glycosides");
   expect(safety).toContain("bicarbonate- or phosphate-containing");
   expect(med.sections.escalation.items[0].text).toContain("emergency response");
 });
 it("retains product-specific source and bans bedside dosing guidance",()=>{
   expect(med.status).toBe("DRAFT");
   expect(med.clinically_reviewed).toBe(false);
   expect(med.pharmacist_reviewed).toBe(false);
   expect(med.label_ref).toBe("L-CALCIUM");
   const text=JSON.stringify({...med,gaps:undefined,permissions:undefined,high_alert_note:undefined});
   expect(text).not.toMatch(/titrat|y-site|compatib|dilut|reconstitut|infusion rate/i);
   expect(text).not.toMatch(/\b\d+([.,]\d+)?\s*(mcg|µg|mg|g|kg|units?|meq|mmol|ml|dl)\b/i);
   expect(read("content/drafts/medications/LABEL_SOURCES.csv")).toContain("0deed071-d89d-420e-b4b4-797dce0ad8f0");
 });
 it("matches indexed clinical draft content hash and latest revision",()=>{
   const hash=createHash("sha256").update(JSON.stringify(med)).digest("hex").slice(0,16);
   const idx=JSON.parse(read("src/content/draft-index.json")).entries as {key:string;type:string;hash:string;gaps:number;clinically_reviewed:boolean}[];
   const hist=JSON.parse(read("src/content/draft-history.json")).entries as Record<string,{hash:string}[]>;
   const e=idx.find(x=>x.key==="MD-20"&&x.type==="medications");
   expect(e?.hash).toBe(hash);
   expect(e?.gaps).toBe(med.gaps.length);
   expect(e?.clinically_reviewed).toBe(false);
   expect(hist["MD-20"]?.at(-1)?.hash).toBe(hash);
 });
});
