import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { medicationTextViolation } from "@/lib/medications/no-dosing";
const cases = [
  [
    "MD-30-phenylephrine",
    "L-PHENYLEPHRINE",
    "monitoring",
    "Oxytocic medicines"
  ],
  [
    "MD-31-dopamine",
    "L-DOPAMINE",
    "safety_alerts",
    "contraindicated in phaeochromocytoma"
  ],
  [
    "MD-32-nicardipine",
    "L-NICARDIPINE",
    "monitoring",
    "cyclosporine or tacrolimus"
  ],
  [
    "MD-33-labetalol",
    "L-LABETALOL",
    "monitoring",
    "blunts compensatory tachycardia"
  ],
  [
    "MD-34-esmolol",
    "L-ESMOLOL",
    "safety_alerts",
    "fatal arrests have been reported"
  ],
  [
    "MD-35-nitroglycerin",
    "L-NITROGLYCERIN",
    "monitoring",
    "Methemoglobinaemia"
  ],
  [
    "MD-36-furosemide",
    "L-FUROSEMIDE",
    "monitoring",
    "renal lithium clearance"
  ]
] as const;
describe("cardiovascular registered-label safety additions", () => {
  for (const [file, source, section, term] of cases) {
    it(file + " preserves traceable non-dosing safety and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      const item = d.sections[section].items.find((i:{text:string})=>i.text.includes(term));
      expect(item).toMatchObject({support:"partial",sources:[source]});
      expect(medicationTextViolation(item.text)).toBeNull();
      expect(d.monitoring.at(-1)).toMatchObject({critical:true,support:"partial",sources:[source]});
      expect(medicationTextViolation(d.monitoring.at(-1).text)).toBeNull();
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
