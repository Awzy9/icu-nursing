import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (name: string) => JSON.parse(readFileSync("content/drafts/equipment/" + name + ".json", "utf8"));
describe("equipment evidence reconciliation", () => {
  it("EQ-02-ventilator-waveforms retains sourced explanations and draft status", () => {
    const d = read("EQ-02-ventilator-waveforms");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(5);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-03-arterial-pressure retains sourced explanations and draft status", () => {
    const d = read("EQ-03-arterial-pressure");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(3);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-04-infusion-pumps retains sourced explanations and draft status", () => {
    const d = read("EQ-04-infusion-pumps");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(3);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-05-defibrillators retains sourced explanations and draft status", () => {
    const d = read("EQ-05-defibrillators");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(3);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-07-enteral-feeding-pumps retains sourced explanations and draft status", () => {
    const d = read("EQ-07-enteral-feeding-pumps");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(3);
    expect(d.clinically_reviewed).toBe(false);
  });
  it("EQ-08-pressure-relieving-equipment retains sourced explanations and draft status", () => {
    const d = read("EQ-08-pressure-relieving-equipment");
    expect(d.parameters.filter((p: { explanation: string | null }) => p.explanation !== null)).toHaveLength(3);
    expect(d.clinically_reviewed).toBe(false);
  });
});
