import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const draft = (file: string) => JSON.parse(readFileSync("content/drafts/" + file + ".json", "utf8"));
const med = (file: string) => draft("medications/" + file);
describe("Priority audit 71–80 — bedside assessment and medication safeguards", () => {
  it("does not continue vasoactive delivery through an injured site", () => {
    const x = med("MD-01-norepinephrine");
    expect(x.monitoring[2].text).toContain("stop delivery through the affected catheter");
    expect(x.monitoring[2].text).toContain("safe alternative access");
  });
  it("covers vasopressin ischemia and milrinone renal surveillance", () => {
    expect(JSON.stringify(med("MD-03-vasopressin").monitoring)).toContain("suspected ischaemia");
    expect(JSON.stringify(med("MD-05-milrinone").monitoring)).toContain("renal function");
  });
  it("checks lipid surveillance and benzodiazepine withdrawal", () => {
    expect(JSON.stringify(med("MD-06-propofol").monitoring)).toContain("triglycerides");
    expect(JSON.stringify(med("MD-07-midazolam").monitoring)).toContain("authorised cessation plan");
  });
  it("distinguishes arousability, unexplained fever and ventilation failure", () => {
    expect(JSON.stringify(med("MD-08-dexmedetomidine").monitoring)).toContain("unexplained fever");
    expect(med("MD-09-fentanyl").sections.escalation.items[0].text).toContain("not proof of adequate breathing");
  });
  it("keeps infection prevention, sedation and neurological assessment aligned", () => {
    const infection = draft("skills/SK-21-infection-prevention");
    const sedation = draft("skills/SK-23-sedation-assessment");
    const neuro = draft("skills/SK-24-neurological-assessment");
    expect(JSON.stringify(infection.checklist)).toContain("between contaminated and clean tasks");
    expect(JSON.stringify(sedation.sections.safety)).toContain("not a universal sedative preference");
    expect(neuro.checklist[2].text).toContain("omit the total");
    expect(neuro.sections.monitoring.items[1].text).toContain("nor occur in a dependable sequence");
    for (const d of [infection, sedation, neuro]) expect(d.clinically_reviewed).toBe(false);
  });
});
