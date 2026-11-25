import { describe, expect, it } from "vitest";
import { scenarioChoiceOrder } from "@icu/schemas/scenario-choice-order";
import { loadScenarioDrafts } from "../../scripts/validate-scenario-drafts";

describe("scenario choice display order", () => {
  it("is a stable permutation for each checkpoint without changing canonical indices", () => {
    for (const count of [0, 1, 2, 3, 4, 10]) {
      const order = scenarioChoiceOrder("SC-01", 2, count);
      expect([...order].sort((a,b)=>a-b)).toEqual(Array.from({length:count},(_,i)=>i));
      expect(scenarioChoiceOrder("SC-01", 2, count)).toEqual(order);
    }
    expect(scenarioChoiceOrder("SC-01", 1, -1)).toEqual([]);
  });
  it("varies presentation across the 59 master-case checkpoints and keeps every authored response addressable", () => {
    const slots = new Set<number>();
    const permutations = new Set<string>();
    let count = 0;
    for (const draft of loadScenarioDrafts()) for (const step of draft.steps!) {
      const options = step.options;
      const canonical = options.findIndex(o=>o.points===2);
      expect(canonical).toBeGreaterThanOrEqual(0);
      const order = scenarioChoiceOrder(draft.scenario_id,step.position,options.length);
      expect(new Set(order).size).toBe(options.length);
      expect(order.length).toBe(options.length);
      const slot = order.indexOf(canonical);
      expect(options[order[slot]!]!.points).toBe(2);
      slots.add(slot); permutations.add(order.join(","));
      count++;
    }
    expect(count).toBe(59);
    expect(slots.size).toBe(3);
    expect(permutations.size).toBeGreaterThan(3);
  });
});
