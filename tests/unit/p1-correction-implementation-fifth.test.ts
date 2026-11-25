import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (file: string) => JSON.parse(readFileSync("content/drafts/" + file + ".json", "utf8"));
describe("P1 implementation: emergency scenarios and equipment", () => {
  it("SC-01-septic-shock preserves safeguards and draft status", () => {
    const d = read("scenarios/SC-01-septic-shock");
    expect(JSON.stringify(d.steps[0].options[0].text)).toContain("airway, breathing and circulation");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("SC-14-transfusion-reaction preserves safeguards and draft status", () => {
    const d = read("scenarios/SC-14-transfusion-reaction");
    expect(JSON.stringify(d.steps[0].options[0].text)).toContain("Do not independently restart");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-01-monitors-alarms preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-01-monitors-alarms");
    expect(JSON.stringify(d.safety_concepts)).toContain("without waiting");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-02-ventilator-waveforms preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-02-ventilator-waveforms");
    expect(JSON.stringify(d.parameters)).toContain("predicted body weight");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-03-arterial-pressure preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-03-arterial-pressure");
    expect(JSON.stringify(d.safety_concepts)).toContain("suspect reading");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-04-infusion-pumps preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-04-infusion-pumps");
    expect(JSON.stringify(d.escalation_concepts)).toContain("unplanned treatment interruption");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-05-defibrillators preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-05-defibrillators");
    expect(JSON.stringify(d.safety_concepts)).toContain("pulseless ventricular tachycardia");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-07-enteral-feeding-pumps preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-07-enteral-feeding-pumps");
    expect(JSON.stringify(d.escalation_concepts)).toContain("medication administration or flushing");
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-08-pressure-relieving-equipment preserves safeguards and draft status", () => {
    const d = read("equipment/EQ-08-pressure-relieving-equipment");
    expect(JSON.stringify(d.safety_concepts)).toContain("tissue tolerance");
    expect(d.clinically_reviewed).toBe(false);
  });
});
