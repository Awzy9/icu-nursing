import { describe, expect, it } from "vitest";
import { bedsideMonitorVisual, centralLineVisual, glucoseMeterVisual, licenseUrl } from "../../mobile/src/content/visuals";

describe("ported lesson visuals (PR #32 parity)", () => {
  it("every named visual has non-empty English and Arabic text for alt, label and detail", () => {
    for (const v of [centralLineVisual, glucoseMeterVisual]) {
      expect(v.alt[0].length).toBeGreaterThan(10); expect(v.alt[1].length).toBeGreaterThan(5);
      expect(v.label[0].length).toBeGreaterThan(3); expect(v.label[1].length).toBeGreaterThan(3);
      expect(v.detail[0].length).toBeGreaterThan(10); expect(v.detail[1].length).toBeGreaterThan(5);
      expect(v.credit.length).toBeGreaterThan(0); expect(v.source.length).toBeGreaterThan(0);
    }
  });

  it("keeps the central-line photo marked for the privacy cover, matching the website", () => {
    expect(centralLineVisual.coveredForPrivacy).toBe(true);
    expect(glucoseMeterVisual.coveredForPrivacy).toBeUndefined();
  });

  it("resolves a valid Creative Commons license URL for every license string in use", () => {
    expect(licenseUrl("BY-SA 3.0")).toBe("https://creativecommons.org/licenses/by-sa/3.0/");
    expect(licenseUrl("BY-SA 4.0")).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  });

  it("the bedside monitor visual has three bilingual feature callouts (ECG/heart rate, SpO2/pulse, alarm priority)", () => {
    expect(bedsideMonitorVisual.features).toHaveLength(3);
    for (const f of bedsideMonitorVisual.features) {
      expect(f.title[0].length).toBeGreaterThan(3); expect(f.title[1].length).toBeGreaterThan(3);
      expect(f.description[0].length).toBeGreaterThan(10); expect(f.description[1].length).toBeGreaterThan(5);
    }
  });

  it("every visual's image path points under the website's public equipment images directory", () => {
    for (const v of [centralLineVisual, glucoseMeterVisual]) expect(v.path).toMatch(/^\/images\/equipment\/[a-z0-9-]+\.(webp|jpg)$/);
    expect(bedsideMonitorVisual.path).toMatch(/^\/images\/equipment\/[a-z0-9-]+\.(webp|jpg)$/);
  });
});
