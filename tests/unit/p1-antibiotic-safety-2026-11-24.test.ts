import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { medicationTextViolation } from "@/lib/medications/no-dosing";
const cases = [
  [
    "MD-22-piperacillin-tazobactam",
    "L-PIPTAZO",
    "monitoring",
    "methotrexate elimination"
  ],
  [
    "MD-23-meropenem",
    "L-MEROPENEM",
    "monitoring",
    "Probenecid"
  ],
  [
    "MD-24-vancomycin",
    "L-VANCOMYCIN",
    "monitoring",
    "Concurrent anaesthetic agents"
  ],
  [
    "MD-25-ceftriaxone",
    "L-CEFTRIAXONE",
    "safety_alerts",
    "41 weeks postmenstrual age"
  ],
  [
    "MD-26-cefazolin",
    "L-CEFAZOLIN",
    "monitoring",
    "Probenecid"
  ],
  [
    "MD-27-azithromycin",
    "L-AZITHROMYCIN",
    "safety_alerts",
    "cholestatic jaundice"
  ],
  [
    "MD-28-linezolid",
    "L-LINEZOLID",
    "safety_alerts",
    "mortality imbalance"
  ],
  [
    "MD-29-gentamicin",
    "L-GENTAMICIN",
    "monitoring",
    "Dehydration"
  ]
] as const;
describe("antibiotic registered-label safety additions", () => {
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
