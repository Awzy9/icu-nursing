import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateScenarioDraft } from "../../src/lib/scenario-draft-validator";
import { loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";

const read = (p: string): string => readFileSync(path.resolve(__dirname, "../..", p), "utf8");

describe("2026-11-21 cardiogenic shock and vasoactive draft safety", () => {
  const scenario = () => JSON.parse(read("content/drafts/scenarios/SC-02-cardiogenic-shock.json"));
  const quiz = () => read("content/drafts/mcq-expansion/XQ-08-vasoactive-safety.md");

  it("keeps the full cardiogenic-shock scenario fictional, unpublished and unapproved", () => {
    const sc = scenario();
    expect(sc.scenario_id).toBe("SC-02");
    expect(sc.status).toBe("DRAFT");
    expect(sc.clinically_reviewed).toBe(false);
    expect(sc.fictional_patient).toBe(true);
    expect(sc.clinical_reviewers).toEqual([]);
    expect(validateScenarioDraft(sc, loadScenarioKnownSources())).toEqual([]);
    expect(sc.steps.map((s: { position: number }) => s.position)).toEqual([1, 2, 3]);
  });

  it("traces acute shock recognition and rescue to current sources, not restricted older reading", () => {
    const sc = scenario();
    const ids = sc.sources.map((s: { id: string }) => s.id);
    expect(ids).toContain("S-ACC-CS-2025");
    expect(ids).toContain("S-ESICM-SHOCK-2025");
    expect(ids).not.toContain("S-OPENSTAX-MS-35-2");
    expect(sc.steps[0].options[0].text).toContain("activate the urgent cardiac-shock response");
    expect(sc.steps[0].options[1].points).toBe(0);
    expect(sc.steps[1].options[0].text).toContain("Assess responsiveness, breathing and pulse/perfusion immediately");
    expect(sc.steps[1].options[0].text).toContain("activate emergency cardiac help");
    expect(sc.steps[1].options[1].points).toBe(0);
    expect(sc.steps[2].options[0].feedback).toContain("does not prove perfusion has recovered");
    expect(sc.gaps.join(" ")).toContain("not recommend use during acute myocardial infarction");
    expect(sc.required_sources.join(" ")).toContain("Independent cardiogenic-shock nurse educator");
  });

  it("preserves all six vasoactive answer keys and disambiguates epinephrine IM versus IV products", () => {
    const q = quiz();
    expect(q).toContain("clinically_reviewed: false");
    expect((q.match(/\*\*Q\d \(/g) ?? [])).toHaveLength(6);
    const answers = [...q.matchAll(/\*\*Answer: ([A-D])\.\*\*/g)].map((m) => m[1]);
    expect(answers).toEqual(["B", "A", "D", "C", "B", "A"]);
    const q1 = q.split("**Q1 (safety).**")[1]?.split("**Q2 (judgment).**")[0] ?? "";
    expect(q1).toContain("Stop delivery through that cannula now");
    expect(q1).toContain("do not force-flush a suspected extravasation");
    const q5 = q.split(/^\*\*Q5 \(/m)[1]?.split(/^\*\*Q6 \(/m)[0] ?? "";
    expect(q5).toContain("other causes of deterioration must also be evaluated");
    expect(q5).toContain("renal impairment prolongs its elimination");
    expect(q5).toContain("maintain continuous ECG and blood pressure surveillance");
    const q6 = q.split("**Q6 (application).**")[1]?.split("## 18. References")[0] ?? "";
    expect(q6).toContain("*intramuscular* epinephrine injection");
    expect(q6).toContain("S-ADRENALIN-IM-2025");
    expect(q6).toContain("must not be substituted as evidence for an IM injection site");
  });

  it("rejects renal-protective dopamine teaching and conflicting extravasation advice", () => {
    const lesson = read("content/drafts/batch-07/D05-T03-vasopressor-pharmacology-partial.md");
    expect(lesson).toContain("clinically_reviewed: false");
    expect(lesson).toContain("S-NICE-NG148-DOPAMINE");
    expect(lesson).toContain("NICE NG148 explicitly advises against offering low-dose dopamine to treat AKI");
    expect(lesson).toContain("should not be titrated in response to urine output alone");
    expect(lesson).toContain("stop delivery through the affected cannula");
    expect(lesson).not.toContain("notify the prescriber because the dose may need to be reduced");
    expect(lesson).not.toContain("do not interrupt the infusion without an order");
    expect(lesson).toContain("distractor also incorrectly equates renal receptor effects with kidney protection");
    const source = read("sources/source_register.csv");
    expect(source).toContain("S-NICE-NG148-DOPAMINE,");
    expect(source).toContain("low-dose dopamine must not be used to treat AKI");
  });

  it("registers new sources transparently with the applicable route and source-access limitations", () => {
    const registry = read("sources/source_register.csv");
    const acc = registry.split("\n").find((r) => r.startsWith("S-ACC-CS-2025,")) ?? "";
    const im = registry.split("\n").find((r) => r.startsWith("S-ADRENALIN-IM-2025,")) ?? "";
    expect(acc).toContain("original full JACC consensus NOT read");
    expect(acc).toContain("RED (cite-only)");
    expect(im).toContain("section 2.2 IM anaphylaxis");
    expect(im).toContain("YELLOW");
    expect(quiz()).toContain("3eef2920-0129-6dc2-e063-6294a90ac22a");
  });
});
