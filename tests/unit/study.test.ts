import { describe, expect, it } from "vitest";
import { dueAfter, daysForBox, nextBox, MAX_BOX } from "@/lib/question-bank/leitner";
import { loadFixtures } from "@/lib/question-bank/fixtures";
import { createFixtureService, type FixtureStore } from "@/lib/question-bank/fixture-service";

const fx = loadFixtures();
const correct = (q: string) => fx.find((f) => f.id === q)!.correctOptionId;
const wrong = (q: string) => fx.find((f) => f.id === q)!.options.find((o) => o.id !== correct(q))!.id;

describe("Leitner scheduling", () => {
  it("moves up one box per correct answer, capped, and resets on a lapse", () => {
    let b = 1;
    const seen: number[] = [];
    for (let i = 0; i < 6; i++) { b = nextBox(b, true); seen.push(b); }
    expect(seen).toEqual([2, 3, 4, 5, 5, 5]);
    expect(nextBox(MAX_BOX, false)).toBe(1);
  });
  it("uses the documented intervals", () => {
    expect([1, 2, 3, 4, 5].map(daysForBox)).toEqual([0, 1, 3, 7, 14]);
    expect(daysForBox(0)).toBe(0);
    expect(daysForBox(99)).toBe(14);
  });
  it("computes due dates from a given instant (pure, deterministic)", () => {
    const t = new Date("2026-03-01T10:00:00Z");
    expect(dueAfter(3, t).toISOString()).toBe("2026-03-04T10:00:00.000Z");
    expect(dueAfter(1, t).toISOString()).toBe(t.toISOString());
  });
});

describe("fixture engine: study mode", () => {
  const make = () => {
    let t = new Date("2026-03-01T10:00:00Z");
    const store: FixtureStore = new Map();
    return { advance: (days: number) => { t = new Date(t.getTime() + days * 86_400_000); }, svc: (u = "u") => createFixtureService(u, { store, now: () => t }) };
  };
  async function answerAll(s: ReturnType<ReturnType<typeof make>["svc"]>, pattern: string, kind?: Parameters<typeof s.startRevision>[0]) {
    const id = kind ? await s.startRevision(kind, 20) : await s.startAttempt({ mode: "practice", count: 16 });
    const a = (await s.getAttempt(id))!;
    for (let i = 0; i < pattern.length; i++) {
      const q = a.items[i]!.question_id;
      if (pattern[i] === "c") await s.submitAnswer(id, i + 1, correct(q));
      if (pattern[i] === "w") await s.submitAnswer(id, i + 1, wrong(q));
    }
    await s.discardAttempt(id);
    return a;
  }

  it("a wrong answer is due immediately, a correct one after a day, and becomes due again as time passes", async () => {
    const { svc, advance } = make();
    const s = svc();
    await answerAll(s, "wc");
    let o = await s.studyOverview();
    expect(o).toMatchObject({ due: 1, incorrect: 1, reviewed_today: 2 });
    expect(o.boxes).toEqual([1, 1, 0, 0, 0]);
    expect(o.next_due_at).toBe("2026-03-02T10:00:00.000Z");
    advance(1);
    o = await s.studyOverview();
    expect(o.due).toBe(2);
    expect(o.next_due_at).toBeNull();
  });
  it("revision sets contain exactly the right questions and keep answer secrecy", async () => {
    const { svc } = make();
    const s = svc();
    const a = await answerAll(s, "wwcc");
    const id = await s.startRevision("incorrect", 20);
    const g = (await s.getAttempt(id))!;
    expect(g.items.map((i) => i.question_id).sort()).toEqual([a.items[0]!.question_id, a.items[1]!.question_id].sort());
    expect(JSON.stringify(g)).not.toMatch(/correct_option_id|rationale|explanations/);
    await s.submitAnswer(id, 1, correct(g.items[0]!.question_id));
    expect((await s.studyOverview()).incorrect).toBe(1);
  });
  it("flagged and bookmarked sets use the learner's own flags and bookmarks; empty sets are refused", async () => {
    const { svc } = make();
    const s = svc();
    const id = await s.startAttempt({ mode: "practice", count: 5 });
    const a = (await s.getAttempt(id))!;
    await s.setFlag(id, 2, true);
    await s.setBookmark(a.items[3]!.question_id, true);
    await s.discardAttempt(id);
    const f = await s.startRevision("flagged", 10);
    expect((await s.getAttempt(f))!.items.map((i) => i.question_id)).toEqual([a.items[1]!.question_id]);
    await s.discardAttempt(f);
    const b = await s.startRevision("bookmarked", 10);
    expect((await s.getAttempt(b))!.items.map((i) => i.question_id)).toEqual([a.items[3]!.question_id]);
    await expect(svc("other").startRevision("flagged", 10)).rejects.toMatchObject({ code: "not_found" });
    await expect(svc("other").startRevision("due", 10)).rejects.toMatchObject({ code: "not_found" });
  });
  it("records history of revealed answers only, newest first, per learner", async () => {
    const { svc } = make();
    const s = svc();
    const id = await s.startAttempt({ mode: "exam", count: 3 });
    const a = (await s.getAttempt(id))!;
    await s.submitAnswer(id, 1, wrong(a.items[0]!.question_id));
    expect(await s.history()).toHaveLength(0); // exam answers are not revealed (or scheduled) until submission
    await s.submitAttempt(id);
    const h = await s.history();
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ is_correct: false, mode: "exam", synthetic: true });
    expect(await svc("someone-else").history()).toEqual([]);
  });
  it("reports per-topic progress and due counts", async () => {
    const { svc } = make();
    const s = svc();
    await answerAll(s, "wwww");
    const o = await s.studyOverview();
    expect(o.domains.reduce((n, d) => n + d.answered, 0)).toBe(4);
    expect(o.domains.reduce((n, d) => n + d.due, 0)).toBe(4);
    expect(o.domains.reduce((n, d) => n + d.correct, 0)).toBe(0);
  });
});
