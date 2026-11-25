import { describe, expect, it } from "vitest";
import { scenarioVersion, restoreScenarioDecisions, restoreScenarioHistory } from "@icu/schemas/scenario-session";
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

describe("Verified scenario observation history", () => {
  const branching = {...scenario, steps: [...scenario.steps.map(s=>({...s, options:s.options.map(o=>({...o}))})), {position:4,info:"End",prompt:"Choose",options:[{text:"Finish",points:2,next:null,feedback:"Guidance"}]}]};
  branching.steps[0]!.options[0]!.next=3;
  branching.steps[2]!.options.forEach(o=>o.next=4);
  const branchSave = {...saved, version:scenarioVersion(branching), position:4, score:2};
  it("uses coherent branch decisions rather than skipped checkpoints",()=>{
    expect(restoreScenarioHistory(branching,{...branchSave,decisions:[{position:1,choice:0},{position:3,choice:1}]})).toEqual({positions:[1,3],incomplete:false});
  });
  it("preserves a verified suffix but refuses to invent an ambiguous prefix",()=>{
    expect(restoreScenarioHistory(branching,{...branchSave,decisions:[{position:3,choice:1}]})).toEqual({positions:[3],incomplete:true});
    expect(restoreScenarioHistory(branching,{...branchSave,decisions:[{position:2,choice:1}]})).toEqual({positions:[],incomplete:true});
    expect(restoreScenarioHistory(branching,branchSave)).toEqual({positions:[],incomplete:true});
  });
  it("recovers sequential checkpoints without inferring answers",()=>{
    expect(restoreScenarioHistory(scenario,saved)).toEqual({positions:[1,2],incomplete:false});
    expect(restoreScenarioDecisions(scenario,saved).decisions).toEqual([]);
  });
});
