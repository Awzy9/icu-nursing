import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D02-T14","batch-02/D02-T14-cardiac-arrest-nursing.md","Recognizing return of circulation","not sufficient by itself to interrupt compressions","S-ERC-ALS-2025"],
 ["D02-T15","batch-02/D02-T15-defibrillation-safety.md","Distinguish preparation for synchronized cardioversion","sedation can worsen circulation","S-ERC-ALS-2025"],
 ["D02-T04","batch-04/D02-T04-arterial-line.md","Reliable arterial pressure in persistent shock","do not automatically titrate to a questionable number","S-ESICM-SHOCK-2025"],
 ["D02-T12","batch-06/D02-T12-vasopressor-inotrope-monitoring.md","High-risk infusion handover and replacement","Never improvise a bolus","S-FDA-PUMP"],
 ["D02-T02","batch-07/D02-T02-ecg-fundamentals-rhythm-recognition.md","Assess the patient with an arrhythmia","rather than waiting for a 12-lead ECG","S-ERC-ALS-2025"],
] as const;
describe("cardiovascular bedside safety follow-up",()=>{
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
 it("distinguishes free-flowing oxygen from a connected airway circuit",()=>{
  const content=read("content/drafts/batch-02/D02-T14-cardiac-arrest-nursing.md");
  expect(content).toContain("keeping an attached tracheal or supraglottic airway ventilation circuit connected");
  expect(content).not.toContain("ensure oxygen devices are removed from the chest before a shock");
 });
 it("prioritizes acute instability over infusion troubleshooting",()=>{
  const content=read("content/drafts/batch-06/D02-T12-vasopressor-inotrope-monitoring.md");
  expect(content).toContain("activates emergency assistance without waiting for equipment troubleshooting");
 });
});
