import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const med = (file: string) => JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
describe("P1 correction implementation: second medication safety batch", () => {
  it("MD-15-insulin: revised monitoring and review flags", () => {
    const d = med("MD-15-insulin");
    expect(JSON.stringify(d.monitoring)).toContain("feed interruption");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-19-potassium-chloride: revised monitoring and review flags", () => {
    const d = med("MD-19-potassium-chloride");
    expect(JSON.stringify(d.monitoring)).toContain("renal function");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-21-sodium-bicarbonate: revised monitoring and review flags", () => {
    const d = med("MD-21-sodium-bicarbonate");
    expect(JSON.stringify(d.monitoring)).toContain("norepinephrine");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-23-meropenem: revised monitoring and review flags", () => {
    const d = med("MD-23-meropenem");
    expect(JSON.stringify(d.monitoring)).toContain("creatine kinase");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-25-ceftriaxone: revised monitoring and review flags", () => {
    const d = med("MD-25-ceftriaxone");
    expect(JSON.stringify(d.monitoring)).toContain("myoclonus");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-37-lorazepam: revised monitoring and review flags", () => {
    const d = med("MD-37-lorazepam");
    expect(JSON.stringify(d.monitoring)).toContain("lactic acidosis");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-41-flumazenil: revised monitoring and review flags", () => {
    const d = med("MD-41-flumazenil");
    expect(JSON.stringify(d.monitoring)).toContain("recurrent sedation");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-43-succinylcholine: revised monitoring and review flags", () => {
    const d = med("MD-43-succinylcholine");
    expect(JSON.stringify(d.monitoring)).toContain("fever is not required");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("does not use a fixed overdose discharge observation interval", () => {
    expect(med("MD-41-flumazenil").monitoring[1].text).not.toContain("120 minutes");
  });
  it("does not require fever to escalate suspected malignant hyperthermia", () => {
    expect(med("MD-43-succinylcholine").sections.escalation.items[0].text).toContain("Do not wait for fever");
  });
});
