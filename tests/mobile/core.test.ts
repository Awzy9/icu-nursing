import { describe, expect, it } from "vitest";
import { cases, equipment, findEquipment, medications, questions, skills } from "../../mobile/src/core/content";
import { isRtl, localized, localizedList, messages, translate, usedFallback } from "../../mobile/src/core/i18n";
import { answer, caseSummary, choose, currentStep, isCorrect, practiceResult, scoreTenths as mobileScore, seededOrder, startCase, startPractice } from "../../mobile/src/core/engines";
import { clearProgress, discardSession, emptyProgress, getSession, loadProgress, markViewed, progressSchema, recordAttempt, recordCase, recordPractice, saveProgress, saveSession, setComplete, toggleBookmark, toggleTick, viewedCount, type KeyValueStore } from "../../mobile/src/core/progress";
import { scoreTenths as webScore } from "@/lib/question-bank/score";
import { createCaseFixtureService } from "@/lib/cases/fixture-service";
import { loadCaseFixtures } from "@/lib/cases/fixtures";

const mem = (): KeyValueStore & { data: Map<string, string> } => { const data = new Map<string, string>(); return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => void data.set(k, v), remove: async (k) => void data.delete(k) }; };

describe("language: English and Arabic with RTL", () => {
  it("describes factual educational drafts and fictional practice accurately without claiming clinical approval", () => {
    expect(messages.en["app.sampleBanner"]).toContain("educational drafts");
    expect(messages.en["app.sampleBanner"]).toContain("practice cases and simulated values are fictional");
    expect(messages.en["app.sampleBanner"]).toContain("not use this app as patient-care guidance");
    expect(messages.en["app.noticeShort"]).toContain("Clinical review pending");
    expect(messages.ar["app.sampleBanner"]).toContain("المراجعة السريرية جارية");
    expect(messages.ar["app.sampleBanner"]).toContain("افتراضية");
    expect(messages.ar["app.noticeShort"]).toContain("قيد المراجعة السريرية");
    expect(messages.en["app.sampleBanner"]).not.toContain("all content is synthetic");
  });
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
  it("bookmarks, viewed lessons, ticks, cases and practice update immutably and respect limits", () => {
    let p = emptyProgress(); const before = JSON.stringify(p);
    p = toggleBookmark(p, "equipment:EQ-01"); expect(p.bookmarks).toEqual(["equipment:EQ-01"]); p = toggleBookmark(p, "equipment:EQ-01"); expect(p.bookmarks).toEqual([]);
    for (const key of ["D01-T19", "SK-18", "D01-T19"]) p = markViewed(p, key);
    expect(p.viewed).toEqual(["D01-T19", "SK-18"]); expect(viewedCount(p)).toBe(2);
    p = toggleTick(p, "SK-01", 2); p = toggleTick(p, "SK-01", 0); expect(p.ticks["SK-01"]).toEqual([0, 2]); p = toggleTick(p, "SK-01", 2); expect(p.ticks["SK-01"]).toEqual([0]);
    p = recordCase(p, "SC-01", 500, "t"); p = recordCase(p, "SC-01", 300, "t2"); expect(p.cases["SC-01"]!.scoreTenths).toBe(500);
    for (let i = 0; i < 110; i++) p = recordPractice(p, 1, 2, "t"); expect(p.practice).toHaveLength(100);
    expect(JSON.stringify(emptyProgress())).toBe(before); expect(progressSchema.safeParse(p).success).toBe(true);
  });
  it("saves, resumes and discards an in-progress quiz or case session", () => {
    let p = emptyProgress();
    expect(getSession(p, "D01-T19")).toBeUndefined();
    p = saveSession(p, "D01-T19", { kind: "quiz", version: "v1", position: 2, score: 0, finished: false, at: "t1" });
    expect(getSession(p, "D01-T19")).toEqual({ kind: "quiz", version: "v1", position: 2, score: 0, finished: false, at: "t1" });
    p = saveSession(p, "SC-01", { kind: "scenario", version: "v1", position: 1, score: 0, finished: false, at: "t2" });
    expect(Object.keys(p.sessions).sort()).toEqual(["D01-T19", "SC-01"]);
    // finishing a session clears it rather than leaving a stale "finished" entry to resume
    p = saveSession(p, "D01-T19", { kind: "quiz", version: "v1", position: 5, score: 4, finished: true, at: "t3" });
    expect(getSession(p, "D01-T19")).toBeUndefined();
    p = discardSession(p, "SC-01");
    expect(p.sessions).toEqual({});
    expect(discardSession(p, "NOT-THERE")).toBe(p); // no-op returns the same reference
  });
  it("marks and unmarks a lesson complete idempotently, returning the same reference when nothing changes", () => {
    const p = emptyProgress();
    expect(p.completed).toEqual([]);
    const marked = setComplete(p, "D01-T19", true);
    expect(marked.completed).toEqual(["D01-T19"]);
    expect(setComplete(marked, "D01-T19", true)).toBe(marked); // already true: no-op, same reference
    const unmarked = setComplete(marked, "D01-T19", false);
    expect(unmarked.completed).toEqual([]);
    expect(setComplete(unmarked, "D01-T19", false)).toBe(unmarked); // already false: no-op
  });
  it("rejects a bookmark key with an unknown kind or an invalid catalog key shape", () => {
    expect(progressSchema.safeParse({ ...emptyProgress(), bookmarks: ["equipment:EQ-01"] }).success).toBe(true);
    expect(progressSchema.safeParse({ ...emptyProgress(), bookmarks: ["notakind:EQ-01"] }).success).toBe(false);
    expect(progressSchema.safeParse({ ...emptyProgress(), bookmarks: ["equipment:syn-eq-001"] }).success).toBe(false); // lowercase real keys never occur
  });
  it("persists through a storage adapter and survives corrupt, hostile or old-schema stored data", async () => {
    const s = mem(); const p = toggleBookmark(emptyProgress(), "skills:SK-02"); await saveProgress(s, p);
    expect(await loadProgress(s)).toEqual(p);
    s.data.set("icu.progress.v2", "{not json"); expect(await loadProgress(s)).toEqual(emptyProgress());
    s.data.set("icu.progress.v1", JSON.stringify({ v: 1, bookmarks: ["equipment:SYN-EQ-001"], viewed: {}, ticks: {}, cases: {}, practice: [] })); expect(await loadProgress(s)).toEqual(emptyProgress()); // the old synthetic-only schema is discarded, not migrated
    await saveProgress(s, p); await clearProgress(s); expect(await loadProgress(s)).toEqual(emptyProgress());
  });
  it("still loads v2 data saved before the 'completed' field existed, defaulting it to empty rather than discarding the whole record", async () => {
    const s = mem();
    s.data.set("icu.progress.v2", JSON.stringify({ v: 2, bookmarks: ["skills:SK-02"], viewed: ["D01-T19"], ticks: {}, cases: {}, practice: [], sessions: {} }));
    const loaded = await loadProgress(s);
    expect(loaded.bookmarks).toEqual(["skills:SK-02"]);
    expect(loaded.completed).toEqual([]);
    expect(loaded.attempts).toEqual({}); // field added after `completed`: same back-compat default
  });
  it("recordAttempt advances a question's Leitner box exactly like the website's own recordAttempt, and never lets an older attempt overwrite a newer one", () => {
    let p = emptyProgress();
    p = recordAttempt(p, "Q1", true, "2026-01-01T00:00:00.000Z");
    expect(p.attempts.Q1).toEqual({ correct: true, at: "2026-01-01T00:00:00.000Z", box: 2 }); // new question enters at box 1, correct -> box 2
    p = recordAttempt(p, "Q1", true, "2026-01-02T00:00:00.000Z");
    expect(p.attempts.Q1!.box).toBe(3);
    p = recordAttempt(p, "Q1", false, "2026-01-03T00:00:00.000Z");
    expect(p.attempts.Q1!.box).toBe(1); // a miss always resets to box 1, regardless of prior box
    const stale = recordAttempt(p, "Q1", true, "2026-01-02T12:00:00.000Z"); // older than the stored "at"
    expect(stale).toBe(p); // no-op: an older write must never undo a newer one
  });
});
