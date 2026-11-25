import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D08-T03","batch-06/D08-T03-blood-product-administration-reactions.md","without flushing residual blood","S-LIFEBLOOD-ATR"],
 ["D05-T16","batch-06/D05-T16-high-alert-medication-pump-safety.md","rather than assuming this was only a near miss","S-FDA-PUMP"],
 ["MD-14","medications/MD-14-heparin.json","against empiric HIT treatment in low-probability cases","S-ASH-HIT-2018"],
 ["MD-15","medications/MD-15-insulin.json","A sensor reading alone does not authorize IV insulin adjustment","S-ADA-HOSP-2026"],
] as const;
describe("transfusion and high-alert medication safety follow-up",()=>{
 it.each(cases)("preserves safe scope and revision: %s",(key,path,guard,source)=>{
  const c=read("content/drafts/"+path);
  expect(c).toContain(guard);
  const json=path.endsWith(".json")?JSON.parse(c):null;
  if(json){
   expect(json.clinically_reviewed).toBe(false);
   expect(json.pharmacist_reviewed).toBe(false);
   expect(json.sources.some((x:{id:string})=>x.id===source)).toBe(true);
  }else expect(c).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(json?JSON.stringify(json):c).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===source)).toBe(true);
 });
 it("keeps transfusion-related lung injury distinct from volume overload",()=>{
  const c=read("content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md");
  expect(c).toContain("Do not assume that pulmonary oedema proves volume overload");
 });
});
