import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["D04-T02","batch-02/D04-T02-aki.md","Interpreting kidney function during acute change","eGFR alone to exclude","S-UKKA-AKI-DETECTION"],
 ["D04-T03","batch-03/D04-T03-urine-output-fluid-balance.md","Reconciling fluid balance","does not prove intravascular filling","S-NICE-CG174"],
 ["D04-T06","batch-07/D04-T06-potassium-disorders.md","Handover when emergency treatment","beyond the usual six-hour","S-UKKA-HK-2026"],
 ["D04-T08","batch-07/D04-T08-acid-base-abg-interpretation.md","Assess the trend rather than the pH alone","do not defer emergency care","S-MERCK-ACIDBASE"],
 ["D04-T09","batch-07/D04-T09-crrt-principles-partial.md","Delivered treatment and electrolyte losses","not automatically better","S-RRT-MULTIDISC-2026"],
] as const;
describe("renal metabolic bedside reasoning",()=>{
 it.each(cases)("retains evidence and revision: %s",(key,path,heading,guard,source)=>{
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
 it("registers the UKKA evidence and preserves draft-only KDIGO status",()=>{
  expect(read("sources/source_register.csv")).toContain("S-UKKA-AKI-DETECTION");
  const content=read("content/drafts/batch-02/D04-T02-aki.md");
  expect(content).toContain("a draft and not yet final");
  expect(content).toContain("S-UKKA-AKI-DETECTION");
 });
});
