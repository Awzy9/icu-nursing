import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(path.resolve(__dirname, "../..", file), "utf8");

describe("clinical alarm teaching — 2026-11-21 verification", () => {
  it("does not market fictional ventilator alarm thresholds as device defaults", () => {
    const webModel = read("src/lib/working/vent-model.ts");
    const mobileModel = read("mobile/src/core/vent-model.ts");
    for (const source of [webModel, mobileModel]) {
      expect(source).toContain("HIGH_PRESSURE_ALARM_THRESHOLD = 40");
      expect(source).toContain("Fictional illustrative trigger only");
      expect(source).not.toContain("a common default ventilator high-pressure limit");
      expect(source).toContain("NOT a validated low-pressure detector");
    }
    expect(read("src/components/working/vent-lab.tsx")).toContain("High-pressure alarm (simulation only)");
    expect(read("mobile/src/core/i18n.ts")).toContain("High-pressure alarm (simulation only)");
    expect(read("mobile/src/core/i18n.ts")).toContain("إنذار ضغط مرتفع (محاكاة فقط)");
  });

  it("requires patient-first assessment in English and Arabic before circuit reconnection", () => {
    const sources = ["src/components/working/vent-lab.tsx", "mobile/app/vent-lab.tsx"];
    for (const file of sources) {
      const s = read(file);
      expect(s).toContain("Assess the patient and adequacy of ventilation immediately");
      expect(s).toContain("قيّم المريض وفعالية التهوية فوراً");
      expect(s).not.toContain("reconnect before troubleshooting anything else");
      expect(s).toContain("A real ventilator's alarm behaviour varies");
      expect(s).toContain("A real patient needs airway, circuit, mechanics and waveform assessment");
      expect(s).not.toContain("both unremarkable");
    }
  });

  it("keeps CRRT blood return conditional on circuit safety and fixes HIT exposure language", () => {
    const src = read("content/drafts/mcq-expansion/XQ-07-crrt-alarms.md");
    const q3 = src.split("**Q3 (escalation).**")[1]?.split("**Q4 (application).**")[0] ?? "";
    const q6 = src.split("**Q6 (safety).**")[1]?.split("## 18. References")[0] ?? "";
    expect(src).toContain("clinically_reviewed: false");
    expect(q3).toContain("**Answer: A.**");
    expect(q3).toContain("only if safe under the device and unit protocol");
    expect(q3).toContain("blood return is not always appropriate");
    expect(q6).toContain("**Answer: B.**");
    expect(q6).toContain("Heparin flushes and catheter locks count as heparin exposure");
    expect(q6).not.toContain("local policy decides the extent");
    expect(src).toContain("pmc.ncbi.nlm.nih.gov/articles/PMC6258919/");
  });
});
