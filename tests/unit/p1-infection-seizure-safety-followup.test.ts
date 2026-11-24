import {describe, expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const index=()=>JSON.parse(read("src/content/draft-index.json")).entries;
const history=()=>JSON.parse(read("src/content/draft-history.json")).entries;
const cases=[
 ["D06-T04","batch-01/D06-T04-precautions.md","Clean-to-dirty workflow","specified contact time","S-CDC-IC"],
 ["D06-T05","batch-01/D06-T05-clabsi.md","Daily necessity and product-specific maintenance","must not be extrapolated","S-WHO-CVC-2026"],
 ["D06-T07","batch-02/D06-T07-vae-prevention.md","Prioritize the patient over bundle completion","Do not delay urgent ventilation support","S-SHEA-VAP-2022"],
] as const;
describe("infection and seizure safety follow-up",()=>{
 it.each(cases)("preserves evidence and revision: %s",(key,path,heading,guard,source)=>{
  const c=read("content/drafts/"+path);
  expect(c.split("\n").find(l=>l.includes(heading))).toContain(guard);
  expect(c).toContain("clinically_reviewed: false");
  const row=index().find((x:{key:string})=>x.key===key);
  const hash=createHash("sha256").update(c).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(history()[key].at(-1).hash).toBe(hash);
  expect(row.sources.some((x:{id:string})=>x.id===source)).toBe(true);
 });
 it("keeps the seizure scenario draft and documents diagnostic EEG limitations",()=>{
  const s=JSON.parse(read("content/drafts/scenarios/SC-08-acute-seizure.json"));
  const row=index().find((x:{key:string})=>x.key==="SC-08");
  expect(s.clinically_reviewed).toBe(false);
  expect(s.debrief.learning_points.some((x:string)=>x.includes("not a substitute for diagnostic EEG"))).toBe(true);
  expect(s.sources.some((x:{id:string})=>x.id==="S-ICS-SE-2025")).toBe(true);
  expect(read("sources/source_register.csv")).toContain("S-ICS-SE-2025");
  const hash=createHash("sha256").update(JSON.stringify(s)).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(history()["SC-08"].at(-1).hash).toBe(hash);
 });
 it("prioritizes acute respiratory assessment before bundle completion",()=>{
  expect(read("content/drafts/batch-02/D06-T07-vae-prevention.md")).toContain("promptly escalates the increasing oxygen requirement");
 });
 it("keeps the proposed seizure lesson explicitly unpublished",()=>{
  const c=read("docs/PROPOSED_SEIZURE_STATUS_EPILEPTICUS_LESSON_2026-11-24.md");
  expect(c).toContain("not clinically reviewed");
  expect(c).toContain("no new canonical topic ID assigned");
  expect(c).toContain("Processed sedation indices cannot replace diagnostic EEG");
 });
});
