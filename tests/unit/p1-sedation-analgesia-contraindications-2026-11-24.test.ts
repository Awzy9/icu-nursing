import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [
  [
    "MD-06-propofol",
    "L-PROPOFOL",
    [
      "prior anaphylaxis to egg or soy",
      "not indicated for paediatric ICU sedation",
      "impaired tissue oxygen delivery"
    ]
  ],
  [
    "MD-07-midazolam",
    "L-MIDAZOLAM",
    [
      "acute narrow-angle glaucoma",
      "benzyl alcohol content",
      "CYP3A inhibitors"
    ]
  ],
  [
    "MD-08-dexmedetomidine",
    "L-DEXMEDETOMIDINE",
    [
      "reported diabetes insipidus",
      "during and after treatment",
      "Reduced hepatic clearance"
    ]
  ],
  [
    "MD-09-fentanyl",
    "L-FENTANYL",
    [
      "starting a CYP3A4 inhibitor",
      "stopping an inducer",
      "precipitate withdrawal"
    ]
  ],
  [
    "MD-10-morphine",
    "L-MORPHINE",
    [
      "paralytic ileus",
      "monoamine oxidase inhibitor",
      "opioid-induced hyperalgesia"
    ]
  ],
  [
    "MD-11-ketamine",
    "L-KETAMINE",
    [
      "substantial blood-pressure increase",
      "reported intracranial pressure increases",
      "theophylline or aminophylline"
    ]
  ]
] as const;
describe("sedation and analgesia registered-label safety reconciliation", () => {
  for (const [file, source, terms] of cases) {
    it(file + " retains source-traced product-specific safeguards", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      for (const term of terms) expect(JSON.stringify(d.sections).toLowerCase()).toContain(term.toLowerCase());
      expect(d.monitoring.at(-1)).toMatchObject({critical:true, support:"partial", sources:[source]});
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
