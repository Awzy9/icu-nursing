import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { newSeed, seededOrder } from "@/lib/question-bank/shuffle";
import { scoreAttempt, scoreTenths, tenthsToPercentString } from "@/lib/question-bank/score";
import { fixtureSeedSql, loadFixtures, stableId } from "@/lib/question-bank/fixtures";
import { createFixtureService, type FixtureStore } from "@/lib/question-bank/fixture-service";
import { QuestionBankError } from "@/lib/question-bank/types";

const fx = loadFixtures();
const correct = (qid: string) => fx.find((q) => q.id === qid)!.correctOptionId;
const wrong = (qid: string) => fx.find((q) => q.id === qid)!.options.find((o) => o.id !== correct(qid))!.id;

describe("seeded shuffle", () => {
  const ids = Array.from({ length: 20 }, (_, i) => stableId(`x${i}`));
  it("is deterministic for a seed and a permutation of the input", () => {
    expect(seededOrder(ids, "abc")).toEqual(seededOrder(ids, "abc"));
    expect([...seededOrder(ids, "abc")].sort()).toEqual([...ids].sort());
  });
  it("differs between seeds and between scopes", () => {
    expect(seededOrder(ids, "abc")).not.toEqual(seededOrder(ids, "abd"));
    expect(seededOrder(ids, "abc", "q1")).not.toEqual(seededOrder(ids, "abc", "q2"));
  });
  it("does not depend on the input order", () => {
    expect(seededOrder([...ids].reverse(), "seed")).toEqual(seededOrder(ids, "seed"));
  });
  it("spreads the first position roughly evenly across seeds", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      const first = seededOrder(ids.slice(0, 4), `s${i}`)[0]!;
      counts.set(first, (counts.get(first) ?? 0) + 1);
    }
    for (const c of counts.values()) expect(c).toBeGreaterThan(380);
  });
  it("produces 16-character hex seeds", () => expect(newSeed()).toMatch(/^[0-9a-f]{16}$/));
  it("never changes the answer key: the key is an option id, not a position", () => {
    const q = fx[0]!;
    for (const seed of ["a", "b", "c", "d"]) {
      const order = seededOrder(q.options.map((o) => o.id), seed, q.id);
      expect(order).toContain(q.correctOptionId);
      expect(order.indexOf(q.correctOptionId)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("scoring", () => {
  it("rounds half up in tenths with integer arithmetic", () => {
    expect(scoreTenths(1, 3)).toBe(333);
    expect(scoreTenths(2, 3)).toBe(667);
    expect(scoreTenths(1, 6)).toBe(167);
    expect(scoreTenths(1, 16)).toBe(63);
    expect(scoreTenths(5, 5)).toBe(1000);
    expect(scoreTenths(0, 5)).toBe(0);
    expect(scoreTenths(0, 0)).toBe(0);
  });
  it("formats tenths as a percentage string", () => {
    expect(tenthsToPercentString(833)).toBe("83.3");
    expect(tenthsToPercentString(1000)).toBe("100.0");
    expect(tenthsToPercentString(0)).toBe("0.0");
  });
  it("counts unanswered as incorrect and excludes voided items", () => {
    const r = scoreAttempt([
      { voided: false, selectedOptionId: "a", correctOptionId: "a" },
      { voided: false, selectedOptionId: "b", correctOptionId: "a" },
      { voided: false, selectedOptionId: null, correctOptionId: "a" },
      { voided: true, selectedOptionId: null, correctOptionId: "a" },
    ]);
    expect(r).toEqual({ total: 3, correct: 1, answered: 2, unanswered: 1, scoreTenths: 333 });
  });
});

describe("synthetic fixtures", () => {
  it("are all labelled, nonclinical, four-option, with an explanation per option", () => {
    expect(fx.length).toBeGreaterThanOrEqual(12);
    for (const q of fx) {
      expect(q.code).toMatch(/^SYN-\d{3}$/);
      expect(q.options).toHaveLength(4);
      expect(q.options.every((o) => (o.explanation.en ?? "").length >= 5)).toBe(true);
      expect(q.rationale.en).toMatch(/no clinical content/i);
    }
  });
  it("vary the stored correct position across the bank", () => {
    const positions = new Set(fx.map((q) => q.options.find((o) => o.id === q.correctOptionId)!.position));
    expect(positions.size).toBe(4);
  });
  it("are not copies of any clinical draft MCQ", () => {
    const root = path.resolve(__dirname, "../../content/drafts");
    const drafts: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = path.join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".md")) drafts.push(readFileSync(p, "utf8").toLowerCase());
      }
    };
    walk(root);
    expect(drafts.length).toBeGreaterThan(30);
    for (const q of fx) for (const d of drafts) expect(d.includes((q.stem.en ?? "").toLowerCase())).toBe(false);
  });
  it("generate seed SQL that publishes only demo_synthetic items and never clinical ones", () => {
    const sql = fixtureSeedSql({ makeVisible: true });
    expect(sql).toMatch(/DEVELOPMENT ONLY/);
    expect(sql).not.toMatch(/'clinical'/);
    expect((sql.match(/'demo_synthetic'/g) ?? []).length).toBe(fx.length);
    expect(sql).toContain("SYNTHETIC FIXTURE");
  });
});

describe("content gate in the source tree", () => {
  const read = (rel: string) => readFileSync(path.resolve(__dirname, "../..", rel), "utf8");
  const walk = (dir: string, out: string[] = []) => {
    for (const f of readdirSync(dir)) {
      if (f === "node_modules" || f === ".next" || f.startsWith(".next")) continue;
      const p = path.join(dir, f);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.(ts|tsx|sql|json|mjs)$/.test(f)) out.push(p);
    }
    return out;
  };
  it("nothing in src/, supabase/ or scripts/ imports clinical draft MCQs into the question bank", () => {
    const root = path.resolve(__dirname, "../..");
    const offenders = [...walk(path.join(root, "src")), ...walk(path.join(root, "supabase")), ...walk(path.join(root, "scripts"))].filter((f) => {
      const t = readFileSync(f, "utf8");
      return /content\/drafts/.test(t) && /question_items|question_options|qb_/.test(t);
    });
    // scripts/audit-mcqs.ts only READS drafts to audit them; it never references the question-bank tables.
    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
  it("the migration seeds no questions and keeps the fixtures setting off by default", () => {
    const sql = read("supabase/migrations/0006_question_bank.sql");
    expect(sql).toMatch(/question_fixtures_visible boolean not null default false/);
    expect(sql).not.toMatch(/insert into public\.question_items/i);
  });
  it("learner-facing code never selects answer keys or explanations directly from tables", () => {
    const root = path.resolve(__dirname, "../..");
    const files = [...walk(path.join(root, "src/app")), ...walk(path.join(root, "src/components"))];
    for (const f of files) expect(readFileSync(f, "utf8")).not.toMatch(/question_answer_keys|question_explanations|\.from\(["']question_(items|options)/);
  });
});

describe("fixture service (in-memory engine used for development and end-to-end tests)", () => {
  const make = (now = () => new Date("2026-01-01T10:00:00Z")) => {
    const store: FixtureStore = new Map();
    return { store, svc: (u = "u1") => createFixtureService(u, { store, now }) };
  };
  it("practice: reveals feedback only after submission, and answers are final", async () => {
    const { svc } = make();
    const s = svc();
    const id = await s.startAttempt({ mode: "practice", count: 4 });
    const a = (await s.getAttempt(id))!;
    expect(JSON.stringify(a)).not.toMatch(/correct_option_id|rationale|explanations/);
    const q0 = a.items[0]!.question_id;
    const r = await s.submitAnswer(id, 1, wrong(q0));
    expect(r.feedback?.correct_option_id).toBe(correct(q0));
    await expect(s.submitAnswer(id, 1, correct(q0))).rejects.toMatchObject({ code: "conflict" });
    const b = (await s.getAttempt(id))!;
    expect(b.items[1]!.feedback).toBeNull();
  });
  it("exam: no feedback until submitted; answers can change; unanswered scores zero", async () => {
    const { svc } = make();
    const s = svc();
    const id = await s.startAttempt({ mode: "exam", count: 4 });
    const items = (await s.getAttempt(id))!.items;
    await s.submitAnswer(id, 1, wrong(items[0]!.question_id));
    await s.submitAnswer(id, 1, correct(items[0]!.question_id));
    await s.submitAnswer(id, 2, correct(items[1]!.question_id));
    expect((await s.getAttempt(id))!.items[0]!.feedback).toBeNull();
    const done = await s.submitAttempt(id);
    expect(done.summary).toMatchObject({ correct: 2, total: 4, answered: 2, score_tenths: 500 });
    expect(done.items.every((i) => i.feedback)).toBe(true);
    await expect(s.submitAnswer(id, 3, correct(items[2]!.question_id))).rejects.toMatchObject({ code: "conflict" });
  });
  it("keeps attempts private between fixture sessions", async () => {
    const { svc } = make();
    const id = await svc("a").startAttempt({ mode: "practice", count: 2 });
    expect(await svc("b").getAttempt(id)).toBeNull();
    await expect(svc("b").submitAnswer(id, 1, null)).rejects.toMatchObject({ code: "not_found" });
  });
  it("expires timed exams on the server clock", async () => {
    let t = new Date("2026-01-01T10:00:00Z");
    const { svc } = make(() => t);
    const s = svc();
    const id = await s.startAttempt({ mode: "exam", count: 3, timeLimitMinutes: 5 });
    const items = (await s.getAttempt(id))!.items;
    await s.submitAnswer(id, 1, correct(items[0]!.question_id));
    t = new Date("2026-01-01T10:06:00Z");
    await expect(s.submitAnswer(id, 2, correct(items[1]!.question_id))).rejects.toMatchObject({ code: "conflict" });
    const a = (await s.getAttempt(id))!;
    expect(a.status).toBe("completed");
    expect(a.summary).toMatchObject({ timed_out: true, correct: 1 });
  });
  it("validates input, limits unfinished attempts and supports domain filtering and bookmarks", async () => {
    const { svc } = make();
    const s = svc();
    await expect(s.startAttempt({ mode: "practice", count: 0 })).rejects.toBeInstanceOf(QuestionBankError);
    await expect(s.startAttempt({ mode: "practice", count: 3, timeLimitMinutes: 10 })).rejects.toMatchObject({ code: "invalid" });
    const id = await s.startAttempt({ mode: "practice", count: 50, domains: ["renal-metabolic"] });
    const a = (await s.getAttempt(id))!;
    expect(a.items.length).toBe(fx.filter((q) => q.domainSlug === "renal-metabolic").length);
    await s.setBookmark(a.items[0]!.question_id, true);
    expect((await s.progress()).bookmarked).toBe(1);
    const only = await s.startAttempt({ mode: "practice", count: 9, bookmarkedOnly: true });
    expect((await s.getAttempt(only))!.items).toHaveLength(1);
    for (let i = 0; i < 3; i++) await s.startAttempt({ mode: "practice", count: 1 });
    await expect(s.startAttempt({ mode: "practice", count: 1 })).rejects.toMatchObject({ code: "limit" });
  });
});
