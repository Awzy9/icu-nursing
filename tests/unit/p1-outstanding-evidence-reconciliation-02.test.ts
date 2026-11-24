import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p:string) => readFileSync(p,"utf8");
const cases = [
 ["D04-T02","batch-02/D04-T02-aki.md","S-SSC-2026","Do not delay emergency assessment","sources_not_read: [S-KDIGO-AKI]"],
 ["D07-T06","batch-02/D07-T06-enteral-feeding.md","S-ASPEN","Trials did not include malnourished patients","complete ASPEN/SCCM appraisal remains outstanding"],
 ["D08-T02","batch-08/D08-T02-coagulation-tests-inr-aptt-fibrinogen.md","S-BSH-COAG","rather than independently escalating heparin","clinically_reviewed: false"],
 ["D02-T08","batch-02/D02-T08-shock-recognition.md","S-OPENRN-HA","This textbook supports nursing assessment in acute heart failure","not a shock guideline"],
] as const;
describe("outstanding evidence reconciliation batch 2", () => {
 it.each(cases)("preserves scoped evidence and revision: %s", (key,path,source,guard,limit)=>{
  const c=read("content/drafts/"+path);
  expect(c).toContain(guard);
  expect(c).toContain(limit);
  expect(c).toContain("clinically_reviewed: false");
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const history=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(c).digest("hex").slice(0,16);
  expect(row.sources.some((x:{id:string})=>x.id===source)).toBe(true);
  expect(row.hash).toBe(hash);
  expect(history[history.length-1].hash).toBe(hash);
 });
 it("preserves source limitations rather than claiming full-text appraisal",()=>{
  const register=read("sources/source_register.csv");
  for(const id of ["S-ASPEN","S-BSH-COAG","S-OPENRN-HA"]) expect(register).toContain('"'+id+'","PARTIAL OR SUMMARY"');
 });
});
