import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { visualsForModule } from "../../mobile/src/content/equipment-visuals";
import { light, dark, MIN_TARGET } from "../../mobile/src/ui/theme";

const root = path.resolve(__dirname, "../..");
const mobileApp = (file: string) => fs.readFileSync(path.join(root, "mobile", "app", file), "utf8");
const moduleKeys = [...new Set(fs.readFileSync(path.join(root, "mobile/src/content/equipment-visuals.ts"), "utf8")
  .matchAll(/"(EQ-[0-9]+|SK-[0-9]+|D[0-9]+-T[0-9]+|MD-[0-9]+)"\s*:/g))]
  .map((match) => match[1]!);

describe("mobile visual-library release acceptance", () => {
  it("every mapped educational photo exists, has text alternatives, visible teaching captions and attribution", () => {
    expect(moduleKeys.length).toBeGreaterThan(30);
    for (const key of moduleKeys) {
      const list = visualsForModule(key);
      expect(list.length, key).toBeGreaterThan(0);
      for (const image of list) {
        expect(fs.existsSync(path.join(root, "public", image.path)), `${key} ${image.path}`).toBe(true);
        expect(image.width, key).toBeGreaterThan(0);
        expect(image.height, key).toBeGreaterThan(0);
        for (const variant of [0, 1] as const) {
          expect(image.alt[variant].trim().length, `${key} alt ${variant}`).toBeGreaterThan(8);
          expect(image.label[variant].trim().length, `${key} label ${variant}`).toBeGreaterThan(5);
        }
        expect(image.source.trim(), key).not.toBe("");
        expect(image.credit.trim(), key).not.toBe("");
        expect(image.license.trim(), key).not.toBe("");
      }
    }
  });
  it("keeps patient privacy cover on invasive-procedure photo", () => {
    expect(visualsForModule("SK-02").some((image) => image.coveredForPrivacy)).toBe(true);
  });
  it("has explicit navigation to Learn, Practice, Clinical Tools, Visuals and Account", () => {
    const tabs = mobileApp("(tabs)/_layout.tsx");
    for (const screen of ["home", "library", "practice", "tools", "visuals", "account"]) {
      expect(tabs).toContain(`name="${screen}"`);
    }
    const home = mobileApp("(tabs)/home.tsx");
    for (const href of ["/library", "/(tabs)/practice", "/(tabs)/tools", "/(tabs)/visuals"]) {
      expect(home).toContain(href);
    }
  });
  it("selects gallery images on demand rather than mounting the full photo catalogue", () => {
    const code = mobileApp("(tabs)/visuals.tsx");
    expect(code).toContain("useState");
    expect(code).toContain("<ModuleVisuals moduleKey={equipment}");
    expect(code).toContain("<ModuleVisuals moduleKey={skill}");
    expect(code).toContain("ChestLandmarkDiagram");
  });
  it("keeps legends, alternatives, and user-triggered retry on visual resources", () => {
    const photo = fs.readFileSync(path.join(root, "mobile/src/ui/visual-photo.tsx"), "utf8");
    const chart = fs.readFileSync(path.join(root, "mobile/src/ui/waveform-chart.tsx"), "utf8");
    const cxr = fs.readFileSync(path.join(root, "mobile/src/ui/chest-landmark-diagram.tsx"), "utf8");
    expect(photo).toContain("Retry image");
    expect(photo).toContain("accessibilityLabel");
    expect(chart).toContain("accessibilityLabel");
    expect(cxr).toContain("not an actual X-ray");
    expect(MIN_TARGET).toBeGreaterThanOrEqual(44);
    expect(dark.primary).not.toEqual(dark.bg);
    expect(light.primary).not.toEqual(light.bg);
  });
  it("keeps the standalone pump calculator and learning tools reachable from Tools", () => {
    const screen = mobileApp("(tabs)/tools.tsx");
    for (const href of ["/infusion-calculator", "/vent-lab", "/hemo-lab", "/crrt", "/waveform-compare"]) {
      expect(screen).toContain(href);
    }
  });
});
