import { describe, expect, it } from "vitest";
import { listPractice } from "@/lib/practice";
import { practiceSchema, presentedOrder, scoreChoice, scoreClassify, scoreSequence, scoreSpot, summariseLevels, type ChoiceExercise, type ClassifyExercise, type SequenceExercise, type SpotExercise } from "@icu/schemas/practice";

const all = listPractice();
const of = <T,>(k: string) => all.filter((e) => e.kind === k) as unknown as T[];
describe("practice fixtures", () => {
  it("cover all six areas, are synthetic, bilingual and valid", () => {
    expect(new Set(all.map((e) => e.area))).toEqual(new Set(["sbar", "documentation", "monitoring-escalation", "infection-prevention", "equipment-practice", "competency"]));
    for (const e of all) { expect(practiceSchema.safeParse(e).success, e.code).toBe(true); expect(e.synthetic).toBe(true); expect(e.title.ar!.length).toBeGreaterThan(2); expect(e.debrief.ar!.length).toBeGreaterThan(0); }
  });
  it("contain no clinical vocabulary or doses (they are nonclinical demonstrations)", () => {
    const text = JSON.stringify(all).toLowerCase();
    for (const w of ["patient", "icu", "ventilator", "dose", "mg ", "medication", "intubat", "nurse"]) expect(text, w).not.toContain(w);
  });
  it("rejects a non-synthetic or malformed exercise", () => {
    expect(practiceSchema.safeParse({ ...all[0], synthetic: false }).success).toBe(false);
    expect(practiceSchema.safeParse({ ...all.find((e) => e.kind === "choice")!, options: [] }).success).toBe(false);
    const c = JSON.parse(JSON.stringify(all.find((e) => e.kind === "choice"))); c.options[1].correct = true; expect(practiceSchema.safeParse(c).success).toBe(false);
  });
});
describe("scoring is deterministic and exact", () => {
  it("classify", () => { for (const e of of<ClassifyExercise>("classify")) { const right = Object.fromEntries(e.items.map((i) => [i.id, i.category])); expect(scoreClassify(e, right).correct).toBe(e.items.length); expect(scoreClassify(e, {}).correct).toBe(0); } });
  it("spot counts misses and false flags", () => {
    const e = of<SpotExercise>("spot")[0]!;
    const right = new Set(e.lines.filter((l) => l.problem).map((l) => l.id));
    expect(scoreSpot(e, right).correct).toBe(e.lines.length);
    const wrong = new Set(e.lines.filter((l) => !l.problem).map((l) => l.id)); const s = scoreSpot(e, wrong);
    expect(s.correct).toBe(0); expect(s.extra!.missed).toBe(right.size); expect(s.extra!.falseFlags).toBe(wrong.size);
  });
  it("sequence: the presented order is repeatable and never already correct", () => {
    for (const e of of<SequenceExercise>("sequence")) {
      const ids = e.steps.map((s) => s.id); const a = presentedOrder(ids, e.code), b = presentedOrder(ids, e.code);
      expect(a).toEqual(b); expect(a).not.toEqual(ids); expect([...a].sort()).toEqual([...ids].sort());
      expect(scoreSequence(e, ids).correct).toBe(ids.length); expect(scoreSequence(e, a).correct).toBeLessThan(ids.length);
    }
  });
  it("choice", () => { for (const e of of<ChoiceExercise>("choice")) { const ok = e.options.find((o) => o.correct)!; expect(scoreChoice(e, ok.id).correct).toBe(1); expect(scoreChoice(e, e.options.find((o) => !o.correct)!.id).correct).toBe(0); expect(scoreChoice(e, undefined).correct).toBe(0); } });
  it("self-assessment counts only what the learner says, and ignores invented levels", () => {
    expect(summariseLevels({ a: "independent", b: "learning", c: "expert" as never }, ["a", "b", "c", "d"])).toEqual({ not_started: 2, learning: 1, with_support: 0, independent: 1 });
  });
  it("answer position is not a giveaway in choice exercises", () => {
    const pos = of<ChoiceExercise>("choice").map((e) => e.options.findIndex((o) => o.correct));
    expect(new Set(pos).size).toBeGreaterThan(0);
  });
});
