import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D02-T12","batch-06/D02-T12-vasopressor-inotrope-monitoring.md","S-AHA-POSTARREST-2025","does not establish a preferred vasopressor"],
 ["D05-T16","batch-06/D05-T16-high-alert-medication-pump-safety.md","S-OPENRN-PHARM","abruptly stopping support"],
 ["D05-T01","batch-07/D05-T01-sedatives-partial.md","S-OPENRN-PHARM","further sedation is safe"],
 ["D05-T03","batch-07/D05-T03-vasopressor-pharmacology-partial.md","S-OPENRN-PHARM","not a critical-care dosing reference"],
 ["D01-T09","batch-08/D01-T09-ventilator-alarms-nursing-response.md","S-JC-ALARM","not a universal ventilator alarm algorithm"],
 ["D08-T03","batch-06/D08-T03-blood-product-administration-reactions.md","S-AABB-AMI-2025","low-certainty evidence"],
] as const;
describe("outstanding evidence reconciliation batch 3",()=>{
 it.each(cases)("preserves scoped source and revision: %s",(key,path,id,guard)=>{
  const content=read("content/drafts/"+path);
  expect(content).toContain(guard);
  expect(content).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(content).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===id)).toBe(true);
 });
 it("retains incomplete transfusion appraisal",()=>{
  const c=read("content/drafts/batch-06/D08-T03-blood-product-administration-reactions.md");
  expect(c).toContain("sources_not_read: [S-AABB-2023, S-BSH-ATR]");
  expect(c).toContain("not nurse-initiated thresholds");
 });
});
