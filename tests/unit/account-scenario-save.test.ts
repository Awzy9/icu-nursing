import { describe, expect, it } from "vitest";
import { scenarioVersion, validScenarioSave } from "@icu/schemas/scenario-session";
const s={setting:"Fictional",objectives:[],takeaways:[],steps:[1,2,3].map(position=>({position,info:"Stage",prompt:"Choose",options:[0,2].map(points=>({text:"Choice "+points,points,next:position===3?null:position+1,feedback:"Guidance"}))}))};
const base={kind:"scenario",version:scenarioVersion(s),position:3,score:2,finished:false,decisions:[{position:1,choice:0},{position:2,choice:1}]};
describe("Account scenario save validation",()=>{
 it("accepts coherent unfinished and completed records",()=>{
  expect(validScenarioSave(s,base)).toBe(true);
  expect(validScenarioSave(s,{...base,finished:true,score:4,decisions:[...base.decisions,{position:3,choice:1}]})).toBe(true);
 });
 it("rejects inconsistent scores, premature completion and wrong terminal decisions",()=>{
  expect(validScenarioSave(s,{...base,score:4})).toBe(false);
  expect(validScenarioSave(s,{...base,finished:true})).toBe(false);
  expect(validScenarioSave(s,{...base,position:2,finished:true})).toBe(false);
  expect(validScenarioSave(s,{...base,finished:true,score:5,decisions:[...base.decisions,{position:3,choice:1}]})).toBe(false);
 });
 it("accepts a coherent known suffix without reconstructing missing choices",()=>{
  expect(validScenarioSave(s,{...base,decisions:[{position:2,choice:1}]})).toBe(true);
  expect(validScenarioSave(s,{...base,finished:true,score:4,decisions:[{position:3,choice:1}]})).toBe(true);
 });
});
