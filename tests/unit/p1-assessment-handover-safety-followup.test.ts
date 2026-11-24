import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";

const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D07-T04","batch-01/D07-T04-pressure-injury.md","Device-related pressure injury during routine care","Do not loosen a critical airway","S-INTL-PI-DRPI-2025"],
 ["D09-T01","batch-01/D09-T01-sbar.md","Transfer accountability and unfinished tasks","acknowledges the transfer","S-AHRQ-HANDOFF"],
 ["D09-T02","batch-01/D09-T02-documentation.md","Distinguish measurements, actions and unresolved risk","never mark a pending task","S-NMC-CODE"],
 ["D01-T19","batch-04/D01-T19-respiratory-deterioration.md","Oxygen requirements and clinical deterioration beyond NEWS2","Do not delay emergency assistance","S-RCP-NEWS2"],
 ["D07-T01","batch-05/D07-T01-head-to-toe-assessment.md","Primary assessment and reassessment","must not delay response","S-RCUK-ABCDE-ADULT"],
] as const;

describe("patient assessment and handover safety follow-up",()=>{
 it.each(cases)("preserves source and canonical revision: %s",(key,path,heading,guard,source)=>{
  const content=read("content/drafts/"+path);
  expect(content.split("\n").find(line=>line.includes(heading))).toContain(guard);
  expect(content).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const history=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(content).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(history[history.length-1].hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===source)).toBe(true);
 });
 it("registers both new references and retains the earlier FDA source",()=>{
  const register=read("sources/source_register.csv");
  for(const id of ["S-INTL-PI-DRPI-2025","S-AHRQ-HANDOFF","S-FDA-PUMP-FAILURE-EXAMPLES"]) expect(register).toContain(id);
 });
 it("prioritizes immediate assessment over score calculation",()=>{
  expect(read("content/drafts/batch-04/D01-T19-respiratory-deterioration.md")).toContain("promptly request urgent bedside assessment using SBAR");
 });
});
