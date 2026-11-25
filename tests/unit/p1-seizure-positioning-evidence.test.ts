import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {validateScenarioDraft} from "@/lib/scenario-draft-validator";
import {loadScenarioKnownSources} from "../../scripts/validate-scenario-drafts";
const read=(p:string)=>readFileSync(p,"utf8");
describe("SC-08 positioning evidence follow-up",()=>{
 it("keeps reassessment, resuscitation and local scope explicit",()=>{
  const d=JSON.parse(read("content/drafts/scenarios/SC-08-acute-seizure.json"));
  const source="S-NSW-ECAT-SEIZURES";
  const best=d.steps[0].options.find((o:{points:number})=>o.points===2);
  expect(best.feedback).toContain("reassess airway patency and breathing promptly");
  expect(best.feedback).toContain("Do not use positioning in place of indicated resuscitation");
  expect(best.sources).toContain(source);
  expect(d.sources.find((s:{id:string})=>s.id===source).read).toBe("partial");
  expect(d.required_sources).toHaveLength(2);
  expect(d.clinically_reviewed).toBe(false);
  expect(validateScenarioDraft(d,loadScenarioKnownSources())).toEqual([]);
  const hash=createHash("sha256").update(JSON.stringify(d)).digest("hex").slice(0,16);
  const row=JSON.parse(read("src/content/draft-index.json")).entries.find((x:{key:string})=>x.key==="SC-08");
  const hist=JSON.parse(read("src/content/draft-history.json")).entries["SC-08"];
  expect(row.hash).toBe(hash);
  expect(hist[hist.length-1].hash).toBe(hash);
  expect(row.sources.find((s:{id:string})=>s.id===source).licence_class).toBe("RED");
 });
});
