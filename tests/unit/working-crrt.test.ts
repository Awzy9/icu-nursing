import { describe, expect, it } from "vitest";
import { allCrrtComponents, crrtComponent, allCrrtAlarms, crrtAlarm } from "@/lib/working/crrt";

describe("CRRT circuit components", () => {
  const components = allCrrtComponents();

  it("ships at least one component, each with bilingual label and description", () => {
    expect(components.length).toBeGreaterThan(0);
    for (const c of components) {
      expect(c.label[0].length).toBeGreaterThan(0);
      expect(c.label[1].length).toBeGreaterThan(0);
      expect(c.description[0].length).toBeGreaterThan(20);
      expect(c.description[1].length).toBeGreaterThan(20);
    }
  });

  it("gives every component a unique key", () => {
    const keys = components.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("looks up a known component by key, and returns undefined for an unknown one", () => {
    expect(crrtComponent(components[0]!.key)).toBe(components[0]);
    expect(crrtComponent("not-a-real-component")).toBeUndefined();
  });
});

describe("CRRT alarm-troubleshooting exercises", () => {
  const alarms = allCrrtAlarms();

  it("ships at least one exercise, each with a valid single-correct-answer question", () => {
    expect(alarms.length).toBeGreaterThan(0);
    for (const a of alarms) {
      expect(a.question.options.length).toBeGreaterThanOrEqual(2);
      expect(a.question.answer).toBeGreaterThanOrEqual(0);
      expect(a.question.answer).toBeLessThan(a.question.options.length);
      expect(a.question.explanation.length).toBeGreaterThan(10);
      expect(a.vignette.length).toBeGreaterThan(10);
    }
  });

  it("links every exercise to a real circuit component", () => {
    const componentKeys = new Set(allCrrtComponents().map((c) => c.key));
    for (const a of alarms) expect(componentKeys.has(a.componentKey)).toBe(true);
  });

  it("gives every exercise a unique key", () => {
    const keys = alarms.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("never recommends bypassing or overriding a safety alarm as the correct answer", () => {
    for (const a of alarms) {
      const correct = a.question.options[a.question.answer]!.toLowerCase();
      const recommendsBypass = /\b(bypass|override|ignore)\b/.test(correct) && !/\b(do not|never|not)\b.{0,20}\b(bypass|override|ignore)\b/.test(correct);
      expect(recommendsBypass).toBe(false);
    }
  });

  it("looks up a known exercise by key, and returns undefined for an unknown one", () => {
    expect(crrtAlarm(alarms[0]!.key)).toBe(alarms[0]);
    expect(crrtAlarm("NOT-REAL")).toBeUndefined();
  });
});
