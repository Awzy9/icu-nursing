import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (n: string) => JSON.parse(readFileSync("content/drafts/medications/" + n + ".json", "utf8"));
describe("exact-label targeted safety reconciliation — batch 1", () => {
  it("MD-02-epinephrine retains targeted safety and review gates", () => {
    const d = read("MD-02-epinephrine");
    expect(JSON.stringify(d)).toContain("potassium and glucose");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-05-milrinone retains targeted safety and review gates", () => {
    const d = read("MD-05-milrinone");
    expect(JSON.stringify(d)).toContain("prolonged elimination");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
  it("MD-07-midazolam retains targeted safety and review gates", () => {
    const d = read("MD-07-midazolam");
    expect(JSON.stringify(d)).toContain("delayed awakening");
    expect(d.clinically_reviewed).toBe(false);
    expect(d.pharmacist_reviewed).toBe(false);
  });
});
