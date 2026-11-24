import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const cases = [
  ["MD-01-norepinephrine","L-NOREPINEPHRINE",["linezolid","tricyclic antidepressants","insulin sensitivity"]],
  ["MD-02-epinephrine","L-EPINEPHRINE",["lists no contraindications","soft-tissue infection","without delaying time-critical"]],
  ["MD-03-vasopressin","L-VASOPRESSIN",["chlorobutanol hypersensitivity","additive pressor effects","Indomethacin"]],
  ["MD-04-dobutamine","L-DOBUTAMINE",["idiopathic hypertrophic subaortic stenosis","known hypersensitivity"]],
  ["MD-05-milrinone","L-MILRINONE",["not a substitute for relief of mechanical obstruction","atrial flutter or fibrillation"]]
] as const;
describe("vasoactive registered-label safety reconciliation", () => {
  for (const [file, source, terms] of cases) {
    it(file + " retains product-specific safety and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      for (const term of terms) expect(JSON.stringify(d.sections)).toContain(term);
      expect(d.monitoring.some((m: {critical:boolean; sources:string[]}) => m.critical && m.sources.includes(source))).toBe(true);
      expect(d.status).toBe("DRAFT");
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
