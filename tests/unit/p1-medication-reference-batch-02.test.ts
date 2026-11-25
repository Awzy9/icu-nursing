import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (n: string) => JSON.parse(readFileSync("content/drafts/medications/" + n + ".json", "utf8"));
describe("exact-label targeted safety reconciliation — batch 2", () => {
  it("MD-11-ketamine retains targeted safety and review gates", () => {
    const d = read("MD-11-ketamine");
    expect(JSON.stringify(d)).toContain("recurrent ketamine exposure");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-13-cisatracurium retains targeted safety and review gates", () => {
    const d = read("MD-13-cisatracurium");
    expect(JSON.stringify(d)).toContain("possible increased seizure risk");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-14-heparin retains targeted safety and review gates", () => {
    const d = read("MD-14-heparin");
    expect(JSON.stringify(d)).toContain("beyond five days");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-17-adenosine retains targeted safety and review gates", () => {
    const d = read("MD-17-adenosine");
    expect(JSON.stringify(d)).toContain("seizure or unexpected conduction disturbance");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-20-calcium-gluconate retains targeted safety and review gates", () => {
    const d = read("MD-20-calcium-gluconate");
    expect(JSON.stringify(d)).toContain("unless the treating clinician determines");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
