import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const draft = (file: string) => JSON.parse(readFileSync("content/drafts/" + file, "utf8"));
describe("Priority audit 41–50 — medication and respiratory safety", () => {
  const med = (name: string) => draft("medications/" + name + ".json");
  const textOf = (x: unknown) => JSON.stringify(x);
  it("checks contraindicated nitrate interactions and haloperidol route", () => {
    expect(textOf(med("MD-35-nitroglycerin").monitoring)).toContain("riociguat");
    expect(textOf(med("MD-38-haloperidol").sections.safety_alerts)).toContain("not approved for intravenous use");
  });
  it("recognises opioid ventilation failure and recurrence after naloxone", () => {
    expect(textOf(med("MD-39-hydromorphone").monitoring)).toContain("preserves saturation");
    expect(textOf(med("MD-40-naloxone").sections.safety_alerts)).toContain("outlast naloxone");
  });
  it("checks alteplase airway swelling and tranexamic acid route safeguards", () => {
    expect(textOf(med("MD-45-alteplase").monitoring)).toContain("tongue");
    expect(textOf(med("MD-46-tranexamic-acid").monitoring)).toContain("neuraxial medicines");
  });
  it("includes selected metabolic surveillance for pantoprazole and hydrocortisone", () => {
    expect(textOf(med("MD-49-pantoprazole").monitoring)).toContain("magnesium");
    expect(textOf(med("MD-50-hydrocortisone").monitoring)).toContain("potassium");
  });
  it("does not reward delay during respiratory deterioration or accidental extubation", () => {
    const r = draft("scenarios/SC-03-acute-respiratory-deterioration.json");
    const x = draft("scenarios/SC-06-accidental-extubation.json");
    expect(r.steps[0].options[2].points).toBe(0);
    expect(r.steps[1].options[0].feedback).toContain("higher response");
    expect(x.steps[1].options[0].text).toContain("if ventilation is inadequate");
  });
});
