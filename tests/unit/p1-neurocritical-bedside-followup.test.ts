import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D03-T10","batch-02/D03-T10-delirium.md","Fluctuation and handover","rather than waiting for the next planned screen","S-NICE-CG103"],
 ["D03-T01","batch-03/D03-T01-glasgow-coma-scale.md","Neurological trends beyond the composite score","even if the total score is unchanged","S-NICE-NG232"],
 ["D03-T09","batch-05/D03-T09-sedation-monitoring.md","Changing sedation goals and awakening readiness","Do not interrupt prescribed sedation solely","S-SCCM-PADIS"],
 ["D07-T03","batch-05/D07-T03-pain-assessment.md","Reassessment after analgesia","not a replacement pain scale","S-SCCM-PADIS"],
 ["D03-T03","batch-08/D03-T03-icp-cpp-monitoring-severe-tbi.md","Interpret ICP and CPP together","avoid independent changes to drain height","S-BTF-TBI-4TH"],
] as const;
describe("neurocritical bedside reasoning",()=>{
 it.each(cases)("preserves evidence and revision: %s",(key,path,heading,guard,source)=>{
  const content=read("content/drafts/"+path);
  expect(content.split("\n").find(line=>line.includes(heading))).toContain(guard);
  expect(content).toContain("clinically_reviewed: false");
  const idx=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(content).digest("hex").slice(0,16);
  expect(idx.sources.some((x:{id:string})=>x.id===source)).toBe(true);
  expect(idx.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
 });
 it("prioritizes acute deterioration over a delirium screen",()=>{
  expect(read("content/drafts/batch-02/D03-T10-delirium.md")).toContain("Assess the new change in responsiveness and physiological stability immediately");
 });
 it("prioritizes urgent neurological reassessment rather than repeated scoring",()=>{
  const content=read("content/drafts/batch-03/D03-T01-glasgow-coma-scale.md");
  expect(content).toContain("immediately activates urgent clinical reassessment");
  expect(content).not.toContain("The nurse repeats the check, notes that sedation has not changed");
 });
});
