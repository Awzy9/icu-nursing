import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D09-T03","batch-05/D09-T03-scope-of-practice.md","S-OPENRN-FUND","No additional legal authority"],
 ["D02-T02","batch-07/D02-T02-ecg-fundamentals-rhythm-recognition.md","S-AHA-ALS-2025","may be a response to another condition"],
 ["D04-T06","batch-07/D04-T06-potassium-disorders.md","S-NICE-NG148","not a standalone dialysis threshold"],
 ["D04-T08","batch-07/D04-T08-acid-base-abg-interpretation.md","S-NICE-NG148","an isolated pH does not authorize"],
 ["D03-T03","batch-08/D03-T03-icp-cpp-monitoring-severe-tbi.md","S-NCS-ICP","does not extend severe-TBI thresholds"],
] as const;
describe("outstanding evidence reconciliation batch 4",()=>{
 it.each(cases)("preserves scoped source and revision: %s",(key,path,id,guard)=>{
  const c=read("content/drafts/"+path);
  expect(c).toContain(guard);
  expect(c).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(c).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===id)).toBe(true);
 });
 it("retains the unpublished KDIGO update requirement",()=>{
  for(const path of ["batch-07/D04-T06-potassium-disorders.md","batch-07/D04-T08-acid-base-abg-interpretation.md","batch-07/D04-T09-crrt-principles-partial.md"]) expect(read("content/drafts/"+path)).toContain("sources_not_read: [S-KDIGO-AKI]");
 });
});
