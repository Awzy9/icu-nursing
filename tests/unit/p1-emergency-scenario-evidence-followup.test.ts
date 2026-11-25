import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {validateScenarioDraft} from "@/lib/scenario-draft-validator";
import {loadScenarioKnownSources} from "../../scripts/validate-scenario-drafts";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["SC-08","acute-seizure","S-AHA-FA-SEIZURE-2024","avoid oral medicines",2],
 ["SC-12","acute-arrhythmia","S-AHA-ALS-2025","displayed rate alone",2],
 ["SC-13","cardiac-arrest","S-RCUK-ALS-2025","low end-tidal carbon dioxide value alone",1],
 ["SC-19","anaphylaxis","S-ANZCOR-SPECIAL-2026","Alert airway experts early",3],
] as const;
describe("emergency scenario evidence follow-up",()=>{
 it.each(cases)("preserves safety and outstanding requirements: %s",(key,name,source,guard,n)=>{
  const d=JSON.parse(read("content/drafts/scenarios/"+key+"-"+name+".json"));
  expect(d.steps.flatMap((s:{options:{feedback:string;sources:string[]}[]})=>s.options).some((o:{feedback:string;sources:string[]})=>o.feedback.includes(guard)&&o.sources.includes(source))).toBe(true);
  expect(d.clinically_reviewed).toBe(false);
  expect(d.required_sources).toHaveLength(n);
  expect(validateScenarioDraft(d,loadScenarioKnownSources())).toEqual([]);
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key===key);
  const hist=JSON.parse(read("src/content/draft-history.json")).entries[key];
  const hash=createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
 });
});
