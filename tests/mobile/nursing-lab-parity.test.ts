import { describe, expect, it } from "vitest";
import { activities as webActivities, orientation as webOrientation, expiratoryFlowExamples as webTraces } from "../../src/lib/working/nursing-lab";
import { activities, orientation, expiratoryFlowExamples } from "../../mobile/src/content/nursing-lab";
import { panels, arterialBeats, infusionReadings, enteralReadings, pressureTrend } from "../../mobile/src/content/equipment-teaching";

describe("native Nursing Lab content parity with website", () => {
  it("uses exactly the website's shift, medication and visual-skill decisions", () => {
    expect(activities).toEqual(webActivities);
    expect(orientation).toEqual(webOrientation);
    expect(expiratoryFlowExamples).toEqual(webTraces);
    expect(activities.map((x) => x.id)).toEqual(["shift", "medication-checks", "visual-skills"]);
  });
  it("provides sample device panels for the existing equipment lessons", () => {
    for (const key of ["EQ-01","EQ-02","EQ-03","EQ-04","EQ-05","EQ-06","EQ-07","EQ-08"] as const) {
      expect(panels[key].tiles.length, key).toBeGreaterThan(1);
    }
    expect(arterialBeats).toHaveLength(3);
    expect(infusionReadings).toHaveLength(4);
    expect(enteralReadings).toHaveLength(3);
    expect(pressureTrend).toHaveLength(6);
  });
});
