import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const draft = (file: string) => JSON.parse(readFileSync("content/drafts/" + file, "utf8"));
describe("Priority audit 31–40 — safety safeguards", () => {
  it("requires prompt tracheostomy airway emergency escalation", () => {
    const s = draft("skills/SK-05-tracheostomy-care.json");
    expect(s.checklist[7].text).toContain("immediately");
    expect(s.checklist[3].text).toContain("single-use");
  });
  it("withholds all NG administration when position is uncertain", () => {
    expect(draft("skills/SK-10-enteral-feeding.json").checklist[0].text).toContain("withhold feed, water, flushes and medicines");
  });
  it("does not convert mobilization targets into mandatory activity", () => {
    expect(draft("skills/SK-16-safe-patient-mobilization.json").checklist[0].text).toContain("do not progress simply");
  });
  it("accounts for oxygen reserve and time-critical transfers", () => {
    const s = draft("skills/SK-20-patient-transport.json");
    expect(s.checklist[2].text).toContain("do not delay time-critical");
    expect(s.checklist.some((x: {text: string}) => x.text.includes("oxygen requirement and reserve"))).toBe(true);
  });
  it("requires independent rather than simultaneous pump checks", () => {
    expect(draft("skills/SK-22-infusion-pump-safety.json").checklist[3].text).toContain("separately");
  });
  it("preserves essential perfusion support during epinephrine site injury", () => {
    expect(draft("medications/MD-02-epinephrine.json").sections.escalation.items[0].text).toContain("continuity of essential");
  });
  it("adds renal/electrolyte and respiratory toxicity monitoring", () => {
    const p = draft("medications/MD-22-piperacillin-tazobactam.json");
    const g = draft("medications/MD-29-gentamicin.json");
    expect(p.monitoring.some((x: {text: string}) => x.text.includes("potassium"))).toBe(true);
    expect(g.monitoring.some((x: {text: string}) => x.text.includes("impaired breathing"))).toBe(true);
    for (const m of [p,g]) expect(m.clinically_reviewed).toBe(false);
  });
});
