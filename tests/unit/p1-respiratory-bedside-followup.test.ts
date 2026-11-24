import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D01-T03","batch-02/D01-T03-oxygen-therapy.md","Review the response to noninvasive support","do not wait for the next scheduled blood gas","S-ATS-NIRS-2026"],
 ["D01-T07","batch-02/D01-T07-ventilator-parameters.md","Bedside assessment and measurement quality","misleading driving pressure","S-AARC-PVA"],
 ["D01-T17","batch-07/D01-T17-weaning-sbt-extubation-readiness.md","Handover after an interrupted breathing trial","trial that was deferred for safety","S-AARC-SBT"],
 ["D01-T06","batch-08/D01-T06-mechanical-ventilation-fundamentals-modes.md","Practical interpretation of volume and pressure trends","do not infer a single diagnosis","S-AARC-PVA"],
] as const;
describe("respiratory bedside reasoning follow-up",()=>{
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
 it("does not delay emergency escalation for ventilator troubleshooting",()=>{
  const content=read("content/drafts/batch-02/D01-T07-ventilator-parameters.md");
  expect(content).toContain("If the patient is unstable or ventilation is ineffective, summon immediate help");
  expect(content).not.toContain("If values do not return to the usual range, you call");
 });
});
