import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const med = (file: string) => JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
describe("P1 correction implementation: third medication safety batch", () => {
  it("MD-04-dobutamine: revised monitoring and review flags", () => {
    const d = med("MD-04-dobutamine");
    expect(JSON.stringify(d.monitoring)).toContain("potassium");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-18-magnesium-sulfate: revised monitoring and review flags", () => {
    const d = med("MD-18-magnesium-sulfate");
    expect(JSON.stringify(d.monitoring)).toContain("urine output");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-20-calcium-gluconate: revised monitoring and review flags", () => {
    const d = med("MD-20-calcium-gluconate");
    expect(JSON.stringify(d.monitoring)).toContain("calcinosis");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-26-cefazolin: revised monitoring and review flags", () => {
    const d = med("MD-26-cefazolin");
    expect(JSON.stringify(d.monitoring)).toContain("renal function");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-27-azithromycin: revised monitoring and review flags", () => {
    const d = med("MD-27-azithromycin");
    expect(JSON.stringify(d.monitoring)).toContain("QTc");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-32-nicardipine: revised monitoring and review flags", () => {
    const d = med("MD-32-nicardipine");
    expect(JSON.stringify(d.monitoring)).toContain("during and after");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-33-labetalol: revised monitoring and review flags", () => {
    const d = med("MD-33-labetalol");
    expect(JSON.stringify(d.monitoring)).toContain("asthma");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-34-esmolol: revised monitoring and review flags", () => {
    const d = med("MD-34-esmolol");
    expect(JSON.stringify(d.monitoring)).toContain("potassium");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-36-furosemide: revised monitoring and review flags", () => {
    const d = med("MD-36-furosemide");
    expect(JSON.stringify(d.monitoring)).toContain("aminoglycosides");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-48-mannitol: revised monitoring and review flags", () => {
    const d = med("MD-48-mannitol");
    expect(JSON.stringify(d.monitoring)).toContain("pulmonary congestion");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
