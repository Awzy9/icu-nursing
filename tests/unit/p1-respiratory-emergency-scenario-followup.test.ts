import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {validateScenarioDraft} from "@/lib/scenario-draft-validator";
import {loadScenarioKnownSources} from "../../scripts/validate-scenario-drafts";
const read=(p:string)=>readFileSync(p,"utf8");
const cases=[
 ["SC-03","acute-respiratory-deterioration","S-RCUK-ABCDE-ADULT","may reflect exhaustion rather than recovery",2],
 ["SC-04","ventilator-alarm","S-JC-ALARM","active, detectable and functioning",1],
 ["SC-05","sudden-oxygen-desaturation","S-RCUK-ABCDE-ADULT","without independently manipulating the drain",2],
 ["SC-06","accidental-extubation","S-PUMA-EXTUBATION-2026","without treating the planned-extubation algorithm as an emergency procedure",1],
 ["SC-18","aspiration-event","S-BTS-ASPIRATION-2023","safe tube placement establishes safe oral intake",2],
] as const;
describe("respiratory emergency scenario safeguards",()=>{
 it.each(cases)("preserves evidence and scope: %s",(key,name,source,guard,n)=>{
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
