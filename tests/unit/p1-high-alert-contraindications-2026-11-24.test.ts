import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const entries = [
  ["MD-14-heparin", "L-HEPARIN", ["history of HIT", "uncontrolled active bleeding", "IV nitroglycerin"]],
  ["MD-15-insulin", "L-INSULIN", ["contraindicated during hypoglycaemia", "immediate cessation", "thiazolidinediones"]],
  ["MD-19-potassium-chloride", "L-POTASSIUM", ["contraindicated with hyperkalaemia", "serious local tissue", "suspected extravasation"]],
] as const;
describe("high-alert product-specific contraindications and adverse-effect safeguards", () => {
  for (const [file, source, phrases] of entries) {
    it(file + " retains source-traced safety and draft gates", () => {
      const d = JSON.parse(readFileSync("content/drafts/medications/" + file + ".json", "utf8"));
      const sections = JSON.stringify(d.sections);
      for (const phrase of phrases) expect(sections).toContain(phrase);
      expect(d.monitoring.some((m: {critical:boolean; sources:string[]}) => m.critical && m.sources.includes(source))).toBe(true);
      expect(d.status).toBe("DRAFT");
      expect(d.high_alert).toBe(true);
      expect(d.clinically_reviewed).toBe(false);
      expect(d.pharmacist_reviewed).toBe(false);
    });
  }
});
