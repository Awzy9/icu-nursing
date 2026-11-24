import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (file: string) => JSON.parse(readFileSync("content/drafts/" + file + ".json", "utf8"));
describe("P1 correction implementation: first safety batch", () => {
  it("MD-10-morphine: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-10-morphine");
    expect(JSON.stringify(d.monitoring)).toContain("renal and hepatic function");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-11-ketamine: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-11-ketamine");
    expect(JSON.stringify(d.monitoring)).toContain("laryngospasm");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-12-rocuronium: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-12-rocuronium");
    expect(JSON.stringify(d.monitoring)).toContain("throughout blockade");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-13-cisatracurium: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-13-cisatracurium");
    expect(JSON.stringify(d.monitoring)).toContain("throughout blockade");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-14-heparin: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-14-heparin");
    expect(JSON.stringify(d.monitoring)).toContain("occult bleeding");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-16-amiodarone: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-16-amiodarone");
    expect(JSON.stringify(d.monitoring)).toContain("QTc");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-17-adenosine: revised monitoring remains unreviewed", () => {
    const d = read("medications/MD-17-adenosine");
    expect(JSON.stringify(d.monitoring)).toContain("bronchospasm");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("does not mark prescribed fluid treatment inherently unsafe", () => {
    const d = read("scenarios/SC-16-acute-hypotension");
    expect(d.steps[0].options[2].text).toContain("unprescribed fluid bolus");
    expect(d.steps[0].options[2].points).toBe(0);
    expect(d.steps[0].options[0].points).toBe(2);
    expect(d.clinically_reviewed).toBe(false);
  });
});
