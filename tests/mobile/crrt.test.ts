import { describe, expect, it } from "vitest";
import { crrtComponentSchema, crrtAlarmExerciseSchema } from "@icu/schemas/working-crrt";
import { allCrrtComponents, allCrrtAlarms } from "@/lib/working/crrt";

describe("working-crrt shared schema and the real dataset", () => {
  const components = allCrrtComponents();
  const alarms = allCrrtAlarms();

  it("ships at least one real component and alarm exercise to validate against", () => {
    expect(components.length).toBeGreaterThan(0);
    expect(alarms.length).toBeGreaterThan(0);
  });

  it("validates every real component against the shared schema (same shape the content API serves)", () => {
    for (const c of components) expect(crrtComponentSchema.safeParse(c).success, `component ${c.key}`).toBe(true);
  });

  it("validates every real alarm exercise against the shared schema", () => {
    for (const a of alarms) expect(crrtAlarmExerciseSchema.safeParse(a).success, `alarm ${a.key}`).toBe(true);
  });

  it("gives every component and alarm exercise a unique key", () => {
    expect(new Set(components.map((c) => c.key)).size).toBe(components.length);
    expect(new Set(alarms.map((a) => a.key)).size).toBe(alarms.length);
  });
});
