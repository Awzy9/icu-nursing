import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [
  [
    "MD-12-rocuronium",
    "L-ROCURONIUM",
    [
      "Lambert-Eaton syndrome",
      "Hepatic impairment",
      "incompletely delivered dose"
    ]
  ],
  [
    "MD-13-cisatracurium",
    "L-CISATRACURIUM",
    [
      "low birth-weight infants",
      "phenytoin or carbamazepine",
      "non-paretic limb"
    ]
  ],
  [
    "MD-43-succinylcholine",
    "L-SUCCINYLCHOLINE",
    [
      "bradycardia can progress to asystole",
      "penetrating eye injury",
      "medicines that may enhance blockade"
    ]
  ],
  [
    "MD-40-naloxone",
    "L-NALOXONE",
    [
      "Known hypersensitivity to naloxone",
      "ventilation support must not be delayed"
    ]
  ],
  [
    "MD-41-flumazenil",
    "L-FLUMAZENIL",
    [
      "head injury",
      "residual neuromuscular blockade remains",
      "Hepatic impairment reduces flumazenil clearance"
    ]
  ]
] as const;
describe("neuromuscular blockade and reversal product-specific safety", () => {
  for (const [file, source, terms] of cases) {
    it(file + " preserves label-traced safeguards and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      for (const term of terms) expect(JSON.stringify(d.sections).toLowerCase()).toContain(term.toLowerCase());
      expect(d.monitoring.at(-1)).toMatchObject({critical:true, support:"partial", sources:[source]});
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
