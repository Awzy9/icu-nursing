import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const skill = (file: string) => JSON.parse(readFileSync("content/drafts/skills/" + file + ".json", "utf8"));
describe("Priority audit 61–70 — core bedside safety", () => {
  it("distinguishes extravasation from routine removal", () => {
    const x = skill("SK-03-peripheral-iv-care");
    expect(x.checklist[4].text).toContain("Do not flush or automatically remove");
    expect(x.sections.escalation.items[0].text).toContain("alternative access");
  });
  it("prioritizes effective ventilation and individualized artificial-airway suction", () => {
    const et = skill("SK-04-endotracheal-tube-care");
    const s = skill("SK-06-suctioning");
    const v = skill("SK-07-ventilator-safety-checks");
    const o = skill("SK-08-oxygen-delivery-devices");
    expect(et.checklist[5].text).toContain("support ventilation");
    expect(s.checklist[2].text).toContain("do not apply a fixed oxygen increase");
    expect(JSON.stringify(s.checklist)).toContain("Never force a catheter");
    expect(JSON.stringify(v.checklist)).toContain("patient synchrony");
    expect(o.sections.escalation.items[0].text).toContain("does not establish adequate ventilation");
  });
  it("prevents unsafe restart, uncertain tube use and unjustified urine cultures", () => {
    expect(skill("SK-09-blood-transfusion").checklist[6].text).toContain("Never independently restart");
    expect(skill("SK-11-nasogastric-tube-care").checklist[2].text).toContain("withhold feed, water, flushes and medicines");
    const c = skill("SK-12-urinary-catheter-care");
    expect(c.checklist[6].text).toContain("alone is not a diagnosis");
    expect(JSON.stringify(c.checklist)).toContain("not the drainage bag");
  });
  it("assesses tissue across skin tones and requires indicated shocks and visual safety checks", () => {
    expect(skill("SK-14-pressure-injury-prevention").checklist[0].text).toContain("do not rely on visible redness alone");
    const s = skill("SK-19-defibrillator-safety");
    expect(s.checklist[2].text).toContain("indicates a shock");
    expect(s.checklist[3].text).toContain("visually confirm");
    expect(s.clinically_reviewed).toBe(false);
  });
});
