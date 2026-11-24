import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const draft = (file: string) => JSON.parse(readFileSync("content/drafts/" + file, "utf8"));
describe("Priority audit 51–60 — consistent emergency and practice teaching", () => {
  it("requires an indicated shock and complete safety check", () => {
    const d = draft("scenarios/SC-13-cardiac-arrest.json");
    expect(d.steps[1].options[0].feedback).toContain("Not every arrest rhythm is shockable");
    expect(d.steps[2].options[2].points).toBe(0);
    expect(d.steps[2].info).toContain("shockable rhythm");
  });
  it("aligns CRRT equipment with trained blood-return boundaries", () => {
    const d = draft("equipment/EQ-06-crrt-systems.json");
    expect(d.escalation_concepts[0].text).toContain("Do not attempt blood return when circuit safety is uncertain");
    expect(d.parameters[0].explanation).toBeNull();
    expect(d.parameters[1].explanation).toBeNull();
    expect(d.parameters[2].sources).toContain("S-KDIGO-AKI-2012");
  });
  it("does not automatically interrupt an essential infusion", () => {
    const d = draft("practice/PX-09-checking-an-infusion-pump-before-and-after-a-cha.json");
    expect(d.steps[4].why).toContain("Do not assume every alert");
    expect(d.steps[5].text).toContain("independent check");
  });
  it("distinguishes glove use from hand hygiene", () => {
    const d = draft("practice/PX-07-what-counts-as-hand-hygiene.json");
    expect(d.items.find((x: {id: string}) => x.id === "i5").category).toBe("no");
    expect(d.items[0].why).toContain("visibly soiled");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("preserves date, time and identity in late entries", () => {
    const d = draft("practice/PX-11-self-assessment--keeping-a-clear-and-safe-record.json");
    expect(d.self_assessment_only).toBe(true);
    expect(d.items[5].text).toContain("entry date and time");
  });
});
