import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (n: string) => JSON.parse(readFileSync("content/drafts/medications/" + n + ".json", "utf8"));
describe("exact-label targeted safety reconciliation — batch 4", () => {
  it("MD-31-dopamine retains targeted safety and review gates", () => {
    const d = read("MD-31-dopamine");
    expect(JSON.stringify(d)).toContain("marked hypotension");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-32-nicardipine retains targeted safety and review gates", () => {
    const d = read("MD-32-nicardipine");
    expect(JSON.stringify(d)).toContain("negative inotropic effects");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-33-labetalol retains targeted safety and review gates", () => {
    const d = read("MD-33-labetalol");
    expect(JSON.stringify(d)).toContain("obscure adrenergic warning");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-34-esmolol retains targeted safety and review gates", () => {
    const d = read("MD-34-esmolol");
    expect(JSON.stringify(d)).toContain("severe local tissue reactions");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-35-nitroglycerin retains targeted safety and review gates", () => {
    const d = read("MD-35-nitroglycerin");
    expect(JSON.stringify(d)).toContain("attenuation of heparin");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-37-lorazepam retains targeted safety and review gates", () => {
    const d = read("MD-37-lorazepam");
    expect(JSON.stringify(d)).toContain("severe withdrawal");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-38-haloperidol retains targeted safety and review gates", () => {
    const d = read("MD-38-haloperidol");
    expect(JSON.stringify(d)).toContain("neuroleptic malignant syndrome");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-39-hydromorphone retains targeted safety and review gates", () => {
    const d = read("MD-39-hydromorphone");
    expect(JSON.stringify(d)).toContain("altered drug exposure");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-40-naloxone retains targeted safety and review gates", () => {
    const d = read("MD-40-naloxone");
    expect(JSON.stringify(d)).toContain("suspected pulmonary oedema");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
