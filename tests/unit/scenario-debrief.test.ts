import { describe, expect, it } from "vitest";
import { scenarioDebrief } from "@icu/schemas/scenario-debrief";
const scenario = { setting:"Fictional", objectives:[], takeaways:[], steps: [1,2,3].map(position => ({
  position, info:"Stage", prompt:"Decision " + position,
  options:[0,1,2].map(points => ({text:"Option " + points,points,next:position===3?null:position+1,feedback:"Guidance " + points})),
})) };
describe("Shared educational scenario debrief",()=>{
 it("prioritizes zero-credit before partial credit and retains the preferred response",()=>{
  const summary=scenarioDebrief(scenario,[{position:1,choice:1},{position:2,choice:0},{position:3,choice:2}]);
  expect(summary.priorities.map(e=>e.position)).toEqual([2,1]);
  expect(summary.priorities[0]?.preferred).toBe("Option 2");
  expect(summary.observedPoints).toBe(3);
  expect(summary.observedMaximum).toBe(6);
  expect(summary.fullCredit).toBe(1);
  expect(summary.strengths.map(e=>e.position)).toEqual([3]);
 });
 it("never invents prior answers on resume",()=>{
  const summary=scenarioDebrief(scenario,[{position:3,choice:2}]);
  expect(summary.entries.map(e=>e.position)).toEqual([3]);
  expect(summary.observedMaximum).toBe(2);
  expect(summary.priorities).toEqual([]);
 });
 it("retains only the selected option consequence",()=>{
  const withConsequences={...scenario,steps:scenario.steps.map(step=>({...step,options:step.options.map(o=>({...o,consequence:"Possible consequence "+o.points}))}))};
  const summary=scenarioDebrief(withConsequences,[{position:1,choice:0}]);
  expect(summary.entries[0]?.consequence).toBe("Possible consequence 0");
  expect(summary.priorities[0]?.consequence).toBe("Possible consequence 0");
 });
 it("ignores invalid and duplicate decisions",()=>{
  const summary=scenarioDebrief(scenario,[{position:99,choice:0},{position:1,choice:99},{position:1,choice:1},{position:1,choice:2}]);
  expect(summary.entries).toHaveLength(1);
  expect(summary.observedPoints).toBe(1);
 });
});
