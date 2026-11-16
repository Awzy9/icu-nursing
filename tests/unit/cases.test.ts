import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { caseSeedSql, loadCaseFixtures } from "@/lib/cases/fixtures";
import { createCaseFixtureService, type CaseStore } from "@/lib/cases/fixture-service";
import { CaseError } from "@/lib/cases/types";
import { scoreTenths } from "@/lib/question-bank/score";

const cases = loadCaseFixtures();
const mk = () => { const store: CaseStore = new Map(); return (u = "u") => createCaseFixtureService(u, { store }); };
const best = (c: (typeof cases)[number], pos: number) => c.steps[pos - 1]!.options.find((o) => o.points === 2)!;
const worst = (c: (typeof cases)[number], pos: number) => c.steps[pos - 1]!.options.find((o) => o.points === 0)!;

describe("case fixtures", () => {
  it("are labelled synthetic and nonclinical, with 0-2 point decisions and valid branching", () => {
    expect(cases.length).toBeGreaterThanOrEqual(3);
    for (const c of cases) {
      expect(c.code).toMatch(/^SYN-CASE-\d{3}$/);
      expect(c.vignette.en).toMatch(/no clinical content/i);
      expect(c.steps.length).toBeGreaterThanOrEqual(3);
      const reach = new Set<number>([1]);
      for (const s of c.steps) {
        if (!reach.has(s.position)) continue;
        expect(s.options.length).toBeGreaterThanOrEqual(2);
        expect(s.options.some((o) => o.points === 2)).toBe(true);
        expect(s.options.some((o) => o.points < 2)).toBe(true);
        for (const o of s.options) {
          expect([0, 1, 2]).toContain(o.points);
          expect(o.feedback.en!.length).toBeGreaterThan(20);
          if (o.next !== null) { expect(o.next).toBeGreaterThan(s.position); reach.add(o.next); }
        }
      }
      expect([...reach].sort()).toEqual(c.steps.map((s) => s.position)); // every step reachable
      for (const o of c.steps.at(-1)!.options) expect(o.next).toBeNull();
    }
  });
  it("branch: at least one case has a decision that skips or diverts to a different step", () => {
    expect(cases.some((c) => c.steps.some((s) => new Set(s.options.map((o) => o.next)).size > 1))).toBe(true);
  });
  it("vary which position holds the best option, and cover every scope-of-practice label used", () => {
    const pos = new Set(cases.flatMap((c) => c.steps.map((s) => s.options.findIndex((o) => o.points === 2))));
    expect(pos.size).toBeGreaterThan(1);
    expect(new Set(cases.flatMap((c) => c.steps.flatMap((s) => s.options.map((o) => o.scope)))).size).toBeGreaterThanOrEqual(4);
  });
  it("never reuse clinical draft text, and the seed SQL only creates demo_synthetic cases", () => {
    const sql = caseSeedSql();
    expect(sql).not.toMatch(/'clinical'/);
    expect((sql.match(/'demo_synthetic'/g) ?? []).length).toBe(cases.length);
    expect(sql).toMatch(/DEVELOPMENT ONLY/);
    const root = path.resolve(__dirname, "../../content/drafts");
    const drafts: string[] = [];
    const walk = (d: string) => { for (const f of readdirSync(d)) { const p = path.join(d, f); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith(".md")) drafts.push(readFileSync(p, "utf8").toLowerCase()); } };
    walk(root);
    for (const c of cases) for (const s of c.steps) for (const o of s.options) for (const d of drafts) expect(d.includes((o.text.en ?? "").toLowerCase())).toBe(false);
  });
  it("the source tree never connects clinical drafts to case tables or learner case code", () => {
    const root = path.resolve(__dirname, "../..");
    const walk = (dir: string, out: string[] = []): string[] => { for (const f of readdirSync(dir)) { if (f === "node_modules" || f.startsWith(".next")) continue; const p = path.join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx|sql)$/.test(f)) out.push(p); } return out; };
    for (const f of [...walk(path.join(root, "src")), ...walk(path.join(root, "supabase/migrations"))]) {
      const t = readFileSync(f, "utf8");
      if (/content\/drafts/.test(t)) expect(/case_items|case_steps|cs_/.test(t), f).toBe(false);
    }
    for (const f of [...walk(path.join(root, "src/app")), ...walk(path.join(root, "src/components"))]) expect(readFileSync(f, "utf8")).not.toMatch(/case_option_keys|\.from\(["']case_/);
  });
});

describe("case fixture engine", () => {
  it("never sends scoring keys or later steps before a decision is committed", async () => {
    const s = mk()();
    const c = cases[0]!;
    const id = await s.start(c.id);
    const v = (await s.get(id))!;
    const text = JSON.stringify(v);
    expect(v.trail).toEqual([]);
    expect(text).not.toMatch(/points|scope|feedback|next/);
    for (const st of c.steps.slice(1)) expect(text).not.toContain(st.info.en!);
    for (const st of c.steps) for (const o of st.options) expect(text).not.toContain(o.feedback.en!);
  });
  it("scores 0-2 per decision, follows the chosen branch and completes with a deterministic summary", async () => {
    const s = mk()();
    const c = cases[0]!;
    const id = await s.start(c.id);
    let v = await s.choose(id, 1, worst(c, 1).id);
    expect(v.current!.position).toBe(worst(c, 1).next);
    expect(v.trail[0]).toMatchObject({ position: 1, points: 0 });
    v = await s.choose(id, v.current!.position, best(c, v.current!.position).id);
    v = await s.choose(id, v.current!.position, best(c, v.current!.position).id);
    expect(v.status).toBe("completed");
    expect(v.summary).toMatchObject({ points: 4, max_points: 6, steps: 3, score_tenths: scoreTenths(4, 6) });
    expect(v.trail.map((t) => t.position)).not.toContain(2);
  });
  it("decisions are final and must follow the current step", async () => {
    const s = mk()();
    const c = cases[1]!;
    const id = await s.start(c.id);
    await s.choose(id, 1, best(c, 1).id);
    await expect(s.choose(id, 1, best(c, 1).id)).rejects.toMatchObject({ code: "conflict" });
    await expect(s.choose(id, 2, "00000000-0000-4000-8000-000000000000")).rejects.toMatchObject({ code: "invalid" });
  });
  it("resumes the same attempt, keeps learners separate and caps unfinished attempts", async () => {
    const svc = mk();
    const a = svc("a"), b = svc("b");
    const id = await a.start(cases[0]!.id);
    expect(await a.start(cases[0]!.id)).toBe(id);
    await a.choose(id, 1, best(cases[0]!, 1).id);
    expect((await a.list()).find((x) => x.id === cases[0]!.id)).toMatchObject({ in_progress_attempt: id, in_progress_position: 2 });
    expect(await b.get(id)).toBeNull();
    await expect(b.choose(id, 1, best(cases[0]!, 1).id)).rejects.toBeInstanceOf(CaseError);
    expect((await b.progress())).toMatchObject({ completed_cases: 0, in_progress: 0 });
  });
});

describe("observations, consequences and the debrief in the fixture engine", () => {
  it("shows the current step's readings only, reveals consequences with committed decisions and the debrief only on completion", async () => {
    const svc = mk()("u");
    const c = cases[0]!;
    const id = await svc.start(c.id);
    const v0 = (await svc.get(id))!;
    expect(v0.current!.observations).toEqual(c.steps[0]!.observations);
    expect(JSON.stringify(v0)).not.toContain(c.steps[0]!.options[0]!.consequence!.en!);
    expect(v0.summary).toBeNull();
    let pos = 1; let v = v0;
    while (v.status !== "completed") { const o = best(c, pos); v = await svc.choose(id, pos, o.id); expect(v.trail.at(-1)!.options.find((x) => x.id === o.id)!.consequence).toEqual(o.consequence); pos = o.next ?? 0; }
    expect(v.summary!.debrief.learning_points).toEqual(c.debrief!.learning_points);
    expect(v.summary!.debrief.revisit_positions).toEqual([]);
  });
  it("every synthetic case has readings with an authored band, a consequence for every option and a debrief", () => {
    for (const c of cases) {
      expect(c.debrief?.learning_points.en?.length).toBeGreaterThanOrEqual(1);
      for (const s of c.steps) {
        expect(s.observations.length).toBeGreaterThanOrEqual(2);
        for (const ob of s.observations) expect(ob.key).toMatch(/^[a-z][a-z0-9_]{1,30}$/);
        for (const o of s.options) expect(o.consequence?.en?.length).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
