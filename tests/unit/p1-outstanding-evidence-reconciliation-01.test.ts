import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D06-T04","batch-01/D06-T04-precautions.md","S-CDC-ISOLATION-2007","sources_not_read: [S-WHO-HH-2009]"],
 ["D01-T03","batch-02/D01-T03-oxygen-therapy.md","S-BTS-OXYGEN-2017","complete guideline appraisal remains outstanding"],
 ["D01-T19","batch-04/D01-T19-respiratory-deterioration.md","S-BTS-OXYGEN-2017","does not itself authorize use of NEWS2 Scale 2"],
] as const;
describe("outstanding evidence reconciliation batch 1",()=>{
 it.each(cases)("retains evidence trace and safe limitations: %s",(key,path,source,guard)=>{
  const content=read("content/drafts/"+path);
  expect(content).toContain(guard);
  expect(content).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(content).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===source)).toBe(true);
 });
 it("keeps BTS partial and WHO full guideline unread",()=>{
  const register=read("sources/source_register.csv");
  expect(register).toContain('"S-BTS-OXYGEN-2017","PARTIAL OR SUMMARY"');
  expect(register).toContain('"S-WHO-HH-2009","NOT READ"');
  expect(register).toContain('"S-WHO-HH-SUMMARY-2013","PARTIAL OR SUMMARY"');
 });
});
