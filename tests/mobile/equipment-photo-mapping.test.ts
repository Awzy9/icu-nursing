import { describe, expect, it } from "vitest";
import { visualsForModule } from "../../mobile/src/content/equipment-visuals";

describe("native equipment image coverage", () => {
  it("shows attributed photos for core equipment lessons", () => {
    for (const key of ["EQ-01", "EQ-02", "EQ-03", "EQ-04", "EQ-05", "EQ-06", "EQ-07", "EQ-08"]) {
      const visuals = visualsForModule(key);
      expect(visuals.length, key).toBeGreaterThan(0);
      for (const photo of visuals) {
        expect(photo.path).toMatch(/^\/images\/equipment\/.+\.webp$/);
        expect(photo.label[0]).toBeTruthy();
        expect(photo.credit).toBeTruthy();
        expect(photo.license).toBeTruthy();
      }
    }
  });
  it("reuses relevant photos across skills and topics", () => {
    expect(visualsForModule("SK-22")[0]?.path).toContain("syringe-pump");
    expect(visualsForModule("D01-T06")[0]?.path).toContain("ventilator");
    expect(visualsForModule("D02-T15")[0]?.path).toContain("defibrillator");
    expect(visualsForModule("SK-02")[0]?.coveredForPrivacy).toBe(true);
  });
});
