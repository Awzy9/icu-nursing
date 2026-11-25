import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [
  [
    "MD-16-amiodarone",
    "L-AMIODARONE",
    [
      "Acute pulmonary injury",
      "thyroid dysfunction"
    ]
  ],
  [
    "MD-17-adenosine",
    "L-ADENOSINE",
    [
      "functioning artificial pacemaker",
      "does not convert atrial fibrillation"
    ]
  ],
  [
    "MD-18-magnesium-sulfate",
    "L-MAGNESIUM",
    [
      "not approved for continuous treatment of preterm labour",
      "neonatal neuromuscular or respiratory depression"
    ]
  ],
  [
    "MD-20-calcium-gluconate",
    "L-CALCIUM",
    [
      "reduce the response to calcium channel blockers"
    ]
  ],
  [
    "MD-21-sodium-bicarbonate",
    "L-BICARBONATE",
    [
      "continuous gastrointestinal suction",
      "hypochloraemic alkalosis"
    ]
  ]
] as const;
describe("antiarrhythmic and electrolyte registered-label safeguards", () => {
  for (const [file, source, terms] of cases) {
    it(file + " preserves label-traced safeguards and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      for (const term of terms) expect(JSON.stringify(d.sections)).toContain(term);
      expect(d.monitoring.at(-1)).toMatchObject({critical:true, support:"partial", sources:[source]});
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
