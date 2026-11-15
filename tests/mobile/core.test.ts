import { describe, expect, it } from "vitest";
import { cases, equipment, findEquipment, medications, questions, skills } from "../../mobile/src/core/content";
import { isRtl, localized, localizedList, messages, translate, usedFallback } from "../../mobile/src/core/i18n";
import { answer, caseSummary, choose, currentStep, isCorrect, practiceResult, scoreTenths as mobileScore, seededOrder, startCase, startPractice } from "../../mobile/src/core/engines";
import { clearProgress, emptyProgress, loadProgress, markViewed, progressSchema, recordCase, recordPractice, saveProgress, toggleBookmark, toggleTick, viewedCount, type KeyValueStore } from "../../mobile/src/core/progress";
import { scoreTenths as webScore } from "@/lib/question-bank/score";
import { createCaseFixtureService } from "@/lib/cases/fixture-service";
import { loadCaseFixtures } from "@/lib/cases/fixtures";

const mem = (): KeyValueStore & { data: Map<string, string> } => { const data = new Map<string, string>(); return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => void data.set(k, v), remove: async (k) => void data.delete(k) }; };

describe("language: English and Arabic with RTL", () => {
  it("has exactly the same message keys in both languages, all non-empty, and consistent placeholders", () => {
    const en = Object.keys(messages.en).sort(), ar = Object.keys(messages.ar).sort();
    expect(ar).toEqual(en);
    for (const k of en) {
      const a = messages.en[k as keyof typeof messages.en], b = messages.ar[k as keyof typeof messages.ar];
      expect(a.length, k).toBeGreaterThan(0); expect(b.length, k).toBeGreaterThan(0);
      expect([...b.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), k).toEqual([...a.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());
    }
  });
  it("translates with variables, falls back to English then to the key, and flags Arabic as right-to-left", () => {
    expect(translate("en", "quiz.result", { right: 3, total: 4 })).toBe("You answered 3 of 4 correctly.");
    expect(translate("ar", "quiz.result", { right: 3, total: 4 })).toContain("3");
    expect(translate("ar", "no.such.key")).toBe("no.such.key");
    expect(isRtl("ar")).toBe(true); expect(isRtl("en")).toBe(false);
    expect(localized({ en: "Hello" }, "ar")).toBe("Hello"); expect(usedFallback({ en: "Hello" }, "ar")).toBe(true);
    expect(localized({ en: "Hello", ar: "مرحبا" }, "ar")).toBe("مرحبا"); expect(localizedList({ en: ["a"] }, "ar")).toEqual(["a"]);
  });
  it("every equipment module has Arabic text for its title, summary, diagram, parts and safety lists", () => {
    for (const m of equipment) { expect(m.title.ar, m.code).toBeTruthy(); expect(m.summary.ar, m.code).toBeTruthy(); expect(m.diagram.alt.ar, m.code).toBeTruthy(); expect(m.safety.ar?.length, m.code).toBeGreaterThan(0); for (const p of m.diagram.parts) { expect(p.label.ar).toBeTruthy(); expect(p.detail.ar).toBeTruthy(); } }
  });
});

describe("content adapters read only the synthetic fixtures", () => {
  it("exposes 8 equipment modules, skills, medications, cases and questions, all SYN-coded and labelled nonclinical", () => {
    expect(equipment).toHaveLength(8); expect(skills.length).toBeGreaterThanOrEqual(3); expect(medications.length).toBeGreaterThanOrEqual(3); expect(cases.length).toBeGreaterThanOrEqual(3); expect(questions.length).toBeGreaterThanOrEqual(10);
    for (const x of [...equipment, ...skills, ...medications, ...cases, ...questions]) expect(x.code).toMatch(/^SYN-/);
    expect(findEquipment("SYN-EQ-001")).toBeTruthy(); expect(findEquipment("EQ-01")).toBeUndefined();
    for (const c of cases) expect(c.vignette.en).toMatch(/no clinical content/i);
  });
});

describe("case engine (local) matches the web engine", () => {
  it("never reveals points, scope, feedback or consequence before a decision", () => {
    const view = currentStep(cases[0]!, startCase(cases[0]!, 1));
    expect(JSON.stringify(view)).not.toMatch(/points|scope|feedback|consequence/);
    for (const o of view.options) expect(Object.keys(o).sort()).toEqual(["index", "text"]);
  });
  it("every route of every case ends with exactly the points and score the web engine gives", async () => {
    const web = loadCaseFixtures();
    for (const c of cases) {
      const wc = web.find((w) => w.code === c.code)!;
      const routes: number[][] = [];
      const walk = (pos: number, picks: number[]) => c.steps[pos - 1]!.options.forEach((o, i) => (o.next === null ? routes.push([...picks, i]) : walk(o.next, [...picks, i])));
      walk(1, []);
      expect(routes.length).toBeGreaterThan(1);
      for (const [n, r] of routes.entries()) {
        let run = startCase(c, n + 1); const svc = createCaseFixtureService(`u-${c.code}-${n}`, { store: new Map() });
        const id = await svc.start(wc.id); let pos = 1;
        for (const idx of r) { const o = c.steps[pos - 1]!.options[idx]!; run = choose(c, run, idx).run; await svc.choose(id, pos, wc.steps[pos - 1]!.options[idx]!.id); pos = o.next ?? pos; }
        const mine = caseSummary(c, run), theirs = (await svc.get(id))!.summary!;
        expect([mine.points, mine.max, mine.scoreTenths, mine.revisit, mine.scopeCounts]).toEqual([theirs.points, theirs.max_points, theirs.score_tenths, theirs.debrief.revisit_positions, theirs.debrief.scope_counts]);
        expect(run.done).toBe(true);
      }
    }
  });
  it("refuses a finished run and an option from another step; option order is stable per seed", () => {
    const c = cases[0]!; let run = startCase(c, 5);
    expect(() => choose(c, run, 99)).toThrow();
    expect(currentStep(c, run).options.map((o) => o.index)).toEqual(currentStep(c, startCase(c, 5)).options.map((o) => o.index));
    while (!run.done) run = choose(c, run, c.steps[run.position - 1]!.options.findIndex((o) => o.points === 2)).run;
    expect(() => choose(c, run, 0)).toThrow(); expect(caseSummary(c, run).scoreTenths).toBe(1000);
  });
  it("scores like the website", () => { for (const [p, m] of [[0, 6], [3, 6], [5, 6], [6, 6], [1, 7]] as const) expect(mobileScore(p, m)).toBe(webScore(p, m)); });
});

describe("question practice (local)", () => {
  it("shuffles options deterministically, scores the shown index against the key, and reports the result", () => {
    const p0 = startPractice(questions, 5, 42);
    expect(p0.items).toHaveLength(5); expect(startPractice(questions, 5, 42)).toEqual(p0); expect(new Set(p0.items.map((i) => i.code)).size).toBe(5);
    let p = p0;
    p0.items.forEach((it, n) => { const q = questions.find((x) => x.code === it.code)!; const shownCorrect = it.order.indexOf(q.correct); p = answer(p, n, n % 2 === 0 ? shownCorrect : (shownCorrect + 1) % q.options.length); });
    const res = practiceResult(questions, p); expect(res).toEqual({ right: 3, total: 5 });
    expect(answer(p, 0, 0)).toBe(p); // a recorded answer cannot be changed
    expect(isCorrect(questions.find((x) => x.code === p.items[0]!.code)!, p, 0)).toBe(true);
    expect(seededOrder(4, 1, 1).slice().sort()).toEqual([0, 1, 2, 3]);
  });
});

describe("local progress", () => {
  it("bookmarks, viewed parts, ticks, cases and practice update immutably and respect limits", () => {
    let p = emptyProgress(); const before = JSON.stringify(p);
    p = toggleBookmark(p, "equipment:SYN-EQ-001"); expect(p.bookmarks).toEqual(["equipment:SYN-EQ-001"]); p = toggleBookmark(p, "equipment:SYN-EQ-001"); expect(p.bookmarks).toEqual([]);
    for (const part of ["a", "b", "c", "d", "e", "f", "g", "h", "i"]) p = markViewed(p, "SYN-EQ-001", part);
    expect(p.viewed["SYN-EQ-001"]).toHaveLength(8); expect(viewedCount(p)).toBe(8);
    p = toggleTick(p, "SYN-SKILL-001", 2); p = toggleTick(p, "SYN-SKILL-001", 0); expect(p.ticks["SYN-SKILL-001"]).toEqual([0, 2]); p = toggleTick(p, "SYN-SKILL-001", 2); expect(p.ticks["SYN-SKILL-001"]).toEqual([0]);
    p = recordCase(p, "SYN-CASE-001", 500, "t"); p = recordCase(p, "SYN-CASE-001", 300, "t2"); expect(p.cases["SYN-CASE-001"]!.scoreTenths).toBe(500);
    for (let i = 0; i < 60; i++) p = recordPractice(p, 1, 2, "t"); expect(p.practice).toHaveLength(50);
    expect(JSON.stringify(emptyProgress())).toBe(before); expect(progressSchema.safeParse(p).success).toBe(true);
  });
  it("persists through a storage adapter and survives corrupt or hostile stored data", async () => {
    const s = mem(); const p = toggleBookmark(emptyProgress(), "skill:SYN-SKILL-002"); await saveProgress(s, p);
    expect(await loadProgress(s)).toEqual(p);
    s.data.set("icu.progress.v1", "{not json"); expect(await loadProgress(s)).toEqual(emptyProgress());
    s.data.set("icu.progress.v1", JSON.stringify({ v: 1, bookmarks: ["equipment:EQ-01"], viewed: {}, ticks: {}, cases: {}, practice: [] })); expect(await loadProgress(s)).toEqual(emptyProgress()); // a clinical-draft key is refused
    await saveProgress(s, p); await clearProgress(s); expect(await loadProgress(s)).toEqual(emptyProgress());
  });
});
