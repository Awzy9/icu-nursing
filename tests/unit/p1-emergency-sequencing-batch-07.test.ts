import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateScenarioDraft } from "@/lib/scenario-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";

const load = (name: string) => JSON.parse(readFileSync(`content/drafts/scenarios/${name}`, "utf8"));
const hypotension = load("SC-16-acute-hypotension.json");
const aspiration = load("SC-18-aspiration-event.json");
const anaphylaxis = load("SC-19-anaphylaxis.json");
const correct = (s: {options:{points:number;text:string;feedback:string;consequence:string;sources:string[]}[]}) =>
  s.options.find(o => o.points === 2)!;

describe("P1 batch 07 emergency response sequencing safeguards", () => {
  it("calls for urgent help at the first hypotension step, not after serial monitoring", () => {
    const a = correct(hypotension.steps[0]);
    expect(hypotension.steps[0].info).toMatch(/drowsy/);
    expect(a.text).toMatch(/activate urgent clinical help now/);
    expect(a.text).toMatch(/while you remain with the patient/);
    expect(a.consequence).toMatch(/summoned immediately/);
    expect(a.sources).toContain("S-ESICM-SHOCK-2025");
    expect(hypotension.sources.find((x:{id:string}) => x.id === "S-ESICM-SHOCK-2025")?.read).toBe("partial");
    expect(correct(hypotension.steps[2]).text).toMatch(/Escalate again/);
  });

  it("includes serial perfusion findings without prescribing a shock subtype or treatment", () => {
    const b = correct(hypotension.steps[1]);
    expect(b.text).toMatch(/capillary refill/);
    expect(b.text).toMatch(/vasopressors/);
    expect(b.feedback).toMatch(/not sufficient evidence to diagnose only hypovolaemia/);
    expect(b.text).toMatch(/protocol-authorised care/);
  });

  it("treats feeding-associated respiratory distress as urgent without inventing a diagnosis", () => {
    const a = correct(aspiration.steps[0]);
    const b = correct(aspiration.steps[1]);
    expect(a.text).toMatch(/Stop the feed immediately/);
    expect(a.text).toMatch(/urgently call/);
    expect(a.feedback).toMatch(/does not by itself establish an aspiration diagnosis/);
    expect(b.text).toMatch(/locally approved method/);
    expect(b.text).toMatch(/persisting respiratory distress/);
    expect(aspiration.gaps.join(" ")).toMatch(/does not teach suctioning/);
  });

  it("does not delay first-line anaphylaxis therapy for a later injection-site question", () => {
    const a = correct(anaphylaxis.steps[0]);
    const b = correct(anaphylaxis.steps[1]);
    expect(a.text).toMatch(/prompt IM adrenaline/);
    expect(a.text).toMatch(/without awaiting routine ward-round orders/);
    expect(a.feedback).toMatch(/never treat an antihistamine as the first-line substitute/);
    expect(anaphylaxis.steps[1].info).toMatch(/emergency anaphylaxis pathway has been activated/);
    expect(b.feedback).toMatch(/not a reason to delay a time-critical/);
    expect(anaphylaxis.gaps.join(" ")).toMatch(/May 2021/);
  });

  it("retains original 20-case structure, unreviewed status and validation", () => {
    const known = loadScenarioKnownSources();
    for(const x of [hypotension, aspiration, anaphylaxis]) {
      expect(x.status).toBe("DRAFT");
      expect(x.clinically_reviewed).toBe(false);
      expect(x.clinical_reviewers).toEqual([]);
      expect(x.banner).toContain("NOT clinically reviewed");
      expect(validateScenarioDraft(x, known), x.scenario_id).toEqual([]);
      expect(x.steps).toHaveLength(3);
    }
  });
});
