import { describe, expect, it } from "vitest";
import { scenarioVersion, restoreScenarioDecisions } from "@icu/schemas/scenario-session";
import { emptyProgress, progressSchema, saveSession } from "../../mobile/src/core/progress";
const scenario={setting:"Fictional",objectives:[],takeaways:[],steps:[1,2,3].map(position=>({position,info:"Stage",prompt:"Choose",options:[0,2].map(points=>({text:"Choice "+points,points,next:position===3?null:position+1,feedback:"Guidance"}))}))};
const saved={kind:"scenario" as const,version:scenarioVersion(scenario),position:3,score:2,finished:false,at:"2026-11-24T00:00:00Z"};
describe("Scenario decision history restoration",()=>{
 it("restores complete coherent history through native storage",()=>{
  const decisions=[{position:1,choice:0},{position:2,choice:1}];
  const hydrated=progressSchema.parse(saveSession(emptyProgress(),"SC-01",{...saved,decisions})).sessions["SC-01"]!;
  expect(restoreScenarioDecisions(scenario,hydrated)).toEqual({decisions,incomplete:false});
 });
 it("preserves a known suffix and marks the missing prefix",()=>{
  const decisions=[{position:2,choice:1}];
  expect(restoreScenarioDecisions(scenario,{...saved,decisions})).toEqual({decisions,incomplete:true});
 });
 it("rejects contradictory scores and impossible transitions",()=>{
  for(const decisions of [[{position:1,choice:1},{position:2,choice:1}],[{position:1,choice:0}],[{position:2,choice:1},{position:2,choice:0}],[{position:2,choice:9}]]){
   expect(restoreScenarioDecisions(scenario,{...saved,decisions})).toEqual({decisions:[],incomplete:true});
  }
 });
 it("keeps other local progress when optional history is malformed",()=>{
  const progress=saveSession(emptyProgress(),"SC-01",{...saved,decisions:[{position:1,choice:0}]});
  const malformed={...progress,sessions:{"SC-01":{...saved,decisions:"invalid"}}};
  expect(progressSchema.parse(malformed).sessions["SC-01"]?.decisions).toBeUndefined();
 });
});
