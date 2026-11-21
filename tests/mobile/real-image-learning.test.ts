import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = (file: string) => readFileSync(path.resolve(__dirname, "../../mobile", file), "utf8");

describe("licensed real-image bedside learning", () => {
  it("includes a genuine normal PA chest X-ray with CC0 provenance and system-based reading prompts", () => {
    const lesson = source("src/ui/real-image-learning.tsx");
    expect(lesson).toContain("Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg");
    expect(lesson).toContain("commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg");
    expect(lesson).toContain("CC0 1.0");
    expect(lesson).toContain("Mikael Häggström");
    expect(lesson).toContain("How do you orient this image?");
    expect(lesson).toContain("Where should you inspect the airway?");
    expect(lesson).toContain("What is your lung and pleural survey?");
    expect(lesson).toContain("Which additional structures matter?");
    expect(source("app/(tabs)/visuals.tsx")).toContain('<RealImageLearning kind="chest-xray" />');
  });

  it("includes a genuine haemofiltration machine photo with attribution and safe CRRT prompts", () => {
    const lesson = source("src/ui/real-image-learning.tsx");
    expect(lesson).toContain("https://upload.wikimedia.org/wikipedia/commons/e/e6/Haemofilter.png");
    expect(lesson).toContain("https://commons.wikimedia.org/wiki/File:Haemofilter.png");
    expect(lesson).toContain("CC BY-SA 3.0");
    expect(lesson).toContain("Jfdwolff");
    expect(lesson).toContain("older haemofiltration machine");
    expect(lesson).toContain("Which paths need to be distinguished?");
    expect(lesson).toContain("never configure treatment from this photo");
    expect(source("app/(tabs)/visuals.tsx")).toContain('<RealImageLearning kind="crrt-machine" />');
    expect(source("app/crrt/index.tsx")).toContain('<RealImageLearning kind="crrt-machine" />');
    expect(source("app/equipment/[code].tsx")).toContain('<RealImageLearning kind="crrt-machine" />');
  });

  it("keeps photo learning accessible with image alt text, reveal on request, retry and source links", () => {
    const lesson = source("src/ui/real-image-learning.tsx");
    expect(lesson).toContain("accessibilityLabel={study.alt[lang]}");
    expect(lesson).toContain("useWindowDimensions()");
    expect(lesson).toContain("onError={() => setFailed(true)}");
    expect(lesson).toContain('label={rtl ? "إعادة المحاولة" : "Retry image"}');
    expect(lesson).toContain("setActive((current) => current === i ? null : i)");
    expect(lesson).toContain("Linking.openURL(study.sourceUrl)");
    expect(lesson).toContain("Linking.openURL(study.licenseUrl)");
    expect(lesson).toContain("Unmodified image");
  });
});
