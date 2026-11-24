import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p:string) => readFileSync(p,"utf8");
const cases = [
 ["D07-T06","batch-02/D07-T06-enteral-feeding.md","Delivery review and hidden energy sources","do not independently compensate","S-ESPEN-ICU-2023"],
 ["D06-T01","batch-01/D06-T01-sepsis.md","Source-control coordination","very low certainty","S-SSC-2026"],
 ["D02-T09","batch-06/D02-T09-septic-shock-nursing-care.md","Persistent shock despite a pressure at target","no single device is mandated","S-ESICM-SHOCK-2025"],
] as const;
describe("nutrition and sepsis bedside reasoning follow-up", () => {
 it.each(cases)("retains evidence trace and safe scope: %s",(key,path,section,guard,source)=>{
  const content=read("content/drafts/"+path);
  const paragraph=content.split("\n").find(line=>line.includes(section));
  expect(paragraph).toContain(guard);
  expect(content).toContain("clinically_reviewed: false");
  const idx=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(content).digest("hex").slice(0,16);
  expect(idx.sources.some((x:{id:string})=>x.id===source)).toBe(true);
  expect(idx.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
 });
});
