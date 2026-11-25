import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (n: string) => JSON.parse(readFileSync("content/drafts/medications/" + n + ".json", "utf8"));
describe("exact-label targeted safety reconciliation — batch 3", () => {
  it("MD-21-sodium-bicarbonate retains targeted safety and review gates", () => {
    const d = read("MD-21-sodium-bicarbonate");
    expect(JSON.stringify(d)).toContain("suspected overcorrection");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-22-piperacillin-tazobactam retains targeted safety and review gates", () => {
    const d = read("MD-22-piperacillin-tazobactam");
    expect(JSON.stringify(d)).toContain("hemophagocytic lymphohistiocytosis");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-23-meropenem retains targeted safety and review gates", () => {
    const d = read("MD-23-meropenem");
    expect(JSON.stringify(d)).toContain("platelet falls");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-25-ceftriaxone retains targeted safety and review gates", () => {
    const d = read("MD-25-ceftriaxone");
    expect(JSON.stringify(d)).toContain("biliary and urinary precipitation");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-26-cefazolin retains targeted safety and review gates", () => {
    const d = read("MD-26-cefazolin");
    expect(JSON.stringify(d)).toContain("poor nutritional status");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-27-azithromycin retains targeted safety and review gates", () => {
    const d = read("MD-27-azithromycin");
    expect(JSON.stringify(d)).toContain("myasthenic syndromes");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-28-linezolid retains targeted safety and review gates", () => {
    const d = read("MD-28-linezolid");
    expect(JSON.stringify(d)).toContain("weekly complete blood counts");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-29-gentamicin retains targeted safety and review gates", () => {
    const d = read("MD-29-gentamicin");
    expect(JSON.stringify(d)).toContain("after treatment ends");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-30-phenylephrine retains targeted safety and review gates", () => {
    const d = read("MD-30-phenylephrine");
    expect(JSON.stringify(d)).toContain("reduced cardiac output");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
