import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { caseSeedSql, loadCaseFixtures, type CaseFixture } from "@/lib/cases/fixtures";
import { createCaseFixtureService, type CaseStore } from "@/lib/cases/fixture-service";
import { CaseError, type CaseAttemptView } from "@/lib/cases/types";
import { scoreTenths } from "@/lib/question-bank/score";
import { validateScenarioDraft, type ScenarioDraft } from "@/lib/scenario-draft-validator";
import { loadScenarioDrafts, loadScenarioKnownSources } from "../../scripts/validate-scenario-drafts";
import { ConversionRefused, scenarioToCase } from "./support/scenario-to-case";
import { SYNTHETIC_SCENARIO, SYNTHETIC_SOURCES } from "./support/synthetic-scenario";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const fx = scenarioToCase(SYNTHETIC_SCENARIO, SYNTHETIC_SOURCES, "SYN-CASE-901");
const mk = (cases: CaseFixture[] = [fx]) => { const store: CaseStore = new Map(); return (u = "u") => createCaseFixtureService(u, { store, cases }); };
const optId = (c: CaseFixture, pos: number, points: number, nth = 0) => c.steps[pos - 1]!.options.filter((o) => o.points === points)[nth]!.id;
const text = (l: Record<string, string>) => l.en!;

/** Every route through a converted graph as option-index lists, with the points each earns. */
function routes(c: CaseFixture): { picks: { pos: number; id: string }[]; points: number }[] {
  const walk = (pos: number, picks: { pos: number; id: string }[], pts: number): { picks: { pos: number; id: string }[]; points: number }[] =>
    c.steps[pos - 1]!.options.flatMap((o) => { const p = [...picks, { pos, id: o.id }]; return o.next === null ? [{ picks: p, points: pts + o.points }] : walk(o.next, p, pts + o.points); });
  return walk(1, [], 0);
}
async function play(svc: ReturnType<ReturnType<typeof mk>>, c: CaseFixture, picks: { pos: number; id: string }[]): Promise<CaseAttemptView> {
  const id = await svc.start(c.id); let v = (await svc.get(id))!;
  for (const p of picks) v = await svc.choose(id, p.pos, p.id);
  return v;
}

describe("scenario authoring format -> case engine (synthetic nonclinical fixture)", () => {
  it("the synthetic draft passes the scenario validator and converts; clinical-style drafts do not pass as fixtures", () => {
    expect(validateScenarioDraft(SYNTHETIC_SCENARIO, SYNTHETIC_SOURCES)).toEqual([]);
    const bad = clone(SYNTHETIC_SCENARIO); bad.setting = "A fictional office."; // missing the nonclinical statement
    expect(() => scenarioToCase(bad, SYNTHETIC_SOURCES, "SYN-CASE-902")).toThrow(ConversionRefused);
    const unreviewedClaim = clone(SYNTHETIC_SCENARIO); unreviewedClaim.clinically_reviewed = true;
    expect(() => scenarioToCase(unreviewedClaim, SYNTHETIC_SOURCES, "SYN-CASE-903")).toThrow(ConversionRefused);
    const outline = clone(SYNTHETIC_SCENARIO); outline.spec_level = "outline"; outline.steps = undefined;
    expect(() => scenarioToCase(outline, SYNTHETIC_SOURCES, "SYN-CASE-904")).toThrow(ConversionRefused);
    expect(fx.steps).toHaveLength(4);
  });

  it("branches: different first choices lead to different next steps, and every route terminates", async () => {
    const svc = mk()();
    const a = await svc.start(fx.id);
    expect((await svc.choose(a, 1, optId(fx, 1, 2))).current!.position).toBe(2);
    const b = await svc.start(fx.id); // resumes: same attempt
    expect(b).toBe(a);
    await svc.discard(a);
    const c = await svc.start(fx.id);
    expect((await svc.choose(c, 1, optId(fx, 1, 0))).current!.position).toBe(3);
    for (const r of routes(fx)) {
      const v = await play(mk()(`r-${Math.random()}`), fx, r.picks);
      expect(v.status).toBe("completed");
      expect(v.summary!.points).toBe(r.points);
    }
  });

  it("observations change from step to step and come from the draft", async () => {
    const svc = mk()();
    const id = await svc.start(fx.id);
    const v1 = (await svc.get(id))!;
    expect(v1.current!.observations.map((o) => text(o.label))).toEqual(["Queue length (fictional)", "Bell"]);
    expect(v1.current!.observations[0]!.value).toBe(12);
    const v2 = await svc.choose(id, 1, optId(fx, 1, 2));
    expect(v2.current!.observations.find((o) => o.key === "queue")!.value).toBe(15);
    expect(v2.current!.observations.map((o) => o.key)).toContain("gate");
    expect(v2.trail[0]!.observations[0]!.value).toBe(12); // the earlier reading is kept in the trail
    expect(v1.current!.observations.every((o) => o.low === undefined && o.high === undefined)).toBe(true); // no asserted normal bands
  });

  it("keeps scoring, scope, feedback and consequences secret until a choice, then reveals them for that step only", async () => {
    const svc = mk()();
    const id = await svc.start(fx.id);
    const open = (await svc.get(id))!;
    expect(JSON.stringify(open.current)).not.toMatch(/points|scope|feedback|consequence|Silencing hides/);
    for (const o of open.current!.options) expect(Object.keys(o).sort()).toEqual(["id", "text"]);
    expect(open.summary).toBeNull();
    const after = await svc.choose(id, 1, optId(fx, 1, 0));
    const revealed = after.trail[0]!;
    expect(revealed.options.every((o) => o.consequence && o.feedback && typeof o.points === "number")).toBe(true);
    expect(text(revealed.options.find((o) => o.points === 0)!.consequence!)).toBe("The bell returns and the queue grows.");
    expect(JSON.stringify(after.current)).not.toMatch(/points|scope|feedback|consequence/); // the next step is still hidden
  });

  it("scores the best route 100%, the worst 0%, and mixed routes in between", async () => {
    const all = routes(fx);
    const maxPts = Math.max(...all.map((r) => r.points)), minPts = Math.min(...all.map((r) => r.points));
    const bestRoute = all.find((r) => r.points === maxPts)!, worstRoute = all.find((r) => r.points === minPts)!;
    const vb = await play(mk()("b"), fx, bestRoute.picks);
    expect(vb.summary!.score_tenths).toBe(scoreTenths(vb.summary!.points, vb.summary!.max_points));
    expect(vb.summary!.points).toBe(vb.summary!.max_points); // every decision on the best route earns the full 2 points
    expect(vb.summary!.score_tenths).toBe(1000);
    const vw = await play(mk()("w"), fx, worstRoute.picks);
    expect(vw.summary!.points).toBe(minPts);
    expect(vw.summary!.score_tenths).toBeLessThan(vb.summary!.score_tenths);
    const mixed = all.find((r) => r.points > minPts && r.points < maxPts);
    if (mixed) { const vm = await play(mk()("m"), fx, mixed.picks); expect(vm.summary!.score_tenths).toBeGreaterThan(vw.summary!.score_tenths); expect(vm.summary!.score_tenths).toBeLessThan(1000); }
  });

  it("shows the structured debrief only after completion, with scope counts and revisit positions", async () => {
    const svc = mk()();
    const id = await svc.start(fx.id);
    await svc.choose(id, 1, optId(fx, 1, 0));
    expect((await svc.get(id))!.summary).toBeNull();
    await svc.choose(id, 3, optId(fx, 3, 2));
    const done = await svc.choose(id, 4, optId(fx, 4, 2));
    const d = done.summary!.debrief;
    expect(d.learning_points!.en).toEqual(SYNTHETIC_SCENARIO.debrief!.learning_points);
    expect(d.revisit_positions).toEqual([1]);
    expect(d.scope_counts).toMatchObject({ independent_nursing: 1, escalation: 2 });
    expect(Object.values(d.scope_counts).reduce((n, x) => n + x, 0)).toBe(3);
  });

  it("resumes an unfinished attempt at the same step, across service instances, with the same option order", async () => {
    const store: CaseStore = new Map();
    const s1 = createCaseFixtureService("learner", { store, cases: [fx] });
    const id = await s1.start(fx.id);
    await s1.choose(id, 1, optId(fx, 1, 2));
    const before = (await s1.get(id))!;
    const s2 = createCaseFixtureService("learner", { store, cases: [fx] }); // a new request / device sharing the same account state
    expect(await s2.start(fx.id)).toBe(id);
    const after = (await s2.get(id))!;
    expect(after.current_position).toBe(2);
    expect(after.current!.options.map((o) => o.id)).toEqual(before.current!.options.map((o) => o.id));
    expect((await s2.list())[0]).toMatchObject({ in_progress_attempt: id, in_progress_position: 2 });
  });

  it("enforces ownership, step order, option membership and finished attempts", async () => {
    const make = mk(); const owner = make("owner"), other = make("other");
    const id = await owner.start(fx.id);
    expect(await other.get(id)).toBeNull();
    await expect(other.choose(id, 1, optId(fx, 1, 2))).rejects.toMatchObject({ code: "not_found" });
    await expect(other.discard(id)).rejects.toBeInstanceOf(CaseError);
    await expect(owner.choose(id, 2, optId(fx, 2, 2))).rejects.toMatchObject({ code: "conflict" }); // wrong step
    await expect(owner.choose(id, 1, optId(fx, 2, 2))).rejects.toMatchObject({ code: "invalid" }); // option from another step
    const best = routes(fx).sort((a, b) => b.points - a.points)[0]!;
    const done = await play(make("finisher"), fx, best.picks);
    await expect(make("finisher").choose(done.id, 4, optId(fx, 4, 2))).rejects.toMatchObject({ code: "conflict" });
    expect((await other.progress()).in_progress).toBe(0); // one learner's attempts never count for another
  });
});

describe("content gating: no scenario draft can reach the learner-facing application", () => {
  const root = process.cwd();
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  it("nothing in src/ refers to the draft directories or scenario ids", () => {
    for (const f of walk(path.join(root, "src")).filter((x) => /\.(ts|tsx|json)$/.test(x))) {
      const raw = readFileSync(f, "utf8");
      const t = f.endsWith(".json") ? raw : raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      expect(t, f).not.toMatch(/(?:from|import|require|readFileSync|readdirSync|readFile)\b[^\n]*content\/drafts/); // comments may name the folder; code may not load from it
      // The staff-only draft metadata (src/content/draft-*.json) and its admin readers legitimately name draft keys; see the importer test below.
      const staffMetadata = /draft-(index|history)\.json$/.test(f) || /[\\/]admin[\\/]/.test(f) || /equipment-draft-validator|scenario-draft-validator|equipment[\\/]/.test(f);
      if (!staffMetadata) expect(t, f).not.toMatch(/\bSC-\d\d\b/);
    }
    expect(caseSeedSql()).not.toMatch(/\bSC-\d\d\b|DRAFT, NOT clinically reviewed/);
  });
  it("the case fixtures served by the engine are all synthetic nonclinical SYN-CASE items", () => {
    for (const c of loadCaseFixtures()) { expect(c.code).toMatch(/^SYN-CASE-\d{3}$/); expect(c.vignette.en).toMatch(/no clinical content/i); }
  });
  it("converted clinical drafts exist only in memory with a non-fixture code, never in the seed", () => {
    const known = loadScenarioKnownSources();
    const graphs = loadScenarioDrafts().filter((d) => d.spec_level === "decision_graph");
    expect(graphs.length).toBeGreaterThanOrEqual(11);
    for (const d of graphs) { const c = scenarioToCase(d, known, `DRAFT-${d.scenario_id}`); expect(c.code).not.toMatch(/^SYN-CASE-/); expect(caseSeedSql()).not.toContain(c.id); }
    expect(() => scenarioToCase(loadScenarioDrafts().find((d) => d.spec_level === "outline")!, known, "DRAFT-X")).toThrow(ConversionRefused);
  });
});

describe("structural round trip of every real decision graph (in memory only; nothing is stored or imported)", () => {
  const known = loadScenarioKnownSources();
  const graphs = loadScenarioDrafts().filter((d: ScenarioDraft) => d.spec_level === "decision_graph");
  for (const d of graphs) {
    it(`${d.scenario_id} converts, every route terminates, the best route scores 100% and the engine matches the authored points`, async () => {
      const c = scenarioToCase(d, known, `DRAFT-${d.scenario_id}`);
      const all = routes(c);
      expect(all.length).toBeGreaterThan(1);
      const maxPts = Math.max(...all.map((r) => r.points));
      const best = all.find((r) => r.points === maxPts)!;
      const make = mk([c]);
      const vb = await play(make("best"), c, best.picks);
      expect(vb.summary!.score_tenths).toBe(1000);
      for (const r of all) { const v = await play(make(`u-${Math.random()}`), c, r.picks); expect(v.status).toBe("completed"); expect(v.summary!.points).toBe(r.points); }
      expect(c.steps.every((s) => s.observations.length >= 2)).toBe(true);
      expect(c.steps.flatMap((s) => s.options).every((o) => o.consequence && o.feedback)).toBe(true);
    });
  }
});

describe("independent oracle: the engine agrees with a direct reading of every converted graph", () => {
  // A small deterministic PRNG so failures are reproducible.
  const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const known = loadScenarioKnownSources();
  const drafts = [{ d: SYNTHETIC_SCENARIO as ScenarioDraft, code: "SYN-CASE-905", src: SYNTHETIC_SOURCES }, ...loadScenarioDrafts().filter((x) => x.spec_level === "decision_graph").map((d) => ({ d, code: `DRAFT-${d.scenario_id}`, src: known }))];
  for (const { d, code, src } of drafts) {
    it(`${d.scenario_id}: 25 random walks match the oracle (next step, points, completion, scope counts, revisit list, debrief) and reveal exactly what was authored`, async () => {
      const c = scenarioToCase(d, src, code);
      const next = rng(d.scenario_id.length * 7919 + c.steps.length);
      const make = mk([c]);
      for (let w = 0; w < 25; w++) {
        const svc = make(`walk-${w}`); const id = await svc.start(c.id);
        let pos = 1, pts = 0; const taken: { pos: number; points: number; scope: string }[] = [];
        for (let guard = 0; guard < 20; guard++) {
          const step = c.steps[pos - 1]!; const o = step.options[Math.floor(next() * step.options.length)]!;
          const v = await svc.choose(id, pos, o.id);
          pts += o.points; taken.push({ pos, points: o.points, scope: o.scope });
          expect(v.trail.at(-1)!.chosen_option_id).toBe(o.id);
          // everything authored for this step is revealed exactly, and nothing from the future
          const revealed = v.trail.at(-1)!.options.find((x) => x.id === o.id)!;
          expect(revealed.feedback.en).toBe(o.feedback.en); expect(revealed.consequence!.en).toBe(o.consequence!.en); expect(revealed.scope).toBe(o.scope); expect(revealed.points).toBe(o.points);
          expect(v.trail.at(-1)!.observations.map((x) => x.key)).toEqual(step.observations.map((x) => x.key));
          if (o.next === null) {
            expect(v.status).toBe("completed");
            expect(v.summary!.points).toBe(pts); expect(v.summary!.max_points).toBe(2 * taken.length); expect(v.summary!.steps).toBe(taken.length);
            expect(v.summary!.score_tenths).toBe(scoreTenths(pts, 2 * taken.length));
            expect(v.summary!.debrief.revisit_positions).toEqual(taken.filter((t) => t.points < 2).map((t) => t.pos));
            const counts: Record<string, number> = {}; for (const t of taken) counts[t.scope] = (counts[t.scope] ?? 0) + 1;
            expect(v.summary!.debrief.scope_counts).toEqual(counts);
            expect(v.summary!.debrief.learning_points?.en).toEqual(d.debrief!.learning_points);
            expect(v.current).toBeNull();
            break;
          }
          expect(v.status).toBe("in_progress"); expect(v.current_position).toBe(o.next); expect(v.summary).toBeNull();
          expect(v.current!.observations.map((x) => x.key)).toEqual(c.steps[o.next - 1]!.observations.map((x) => x.key));
          pos = o.next;
        }
      }
    });
  }
  it("every authored option field survives conversion unchanged (text, points, next, scope, feedback, consequence)", () => {
    for (const { d, code, src } of drafts) {
      const c = scenarioToCase(d, src, code);
      d.steps!.forEach((s, si) => s.options.forEach((o, oi) => { const x = c.steps[si]!.options[oi]!; expect([x.text.en, x.points, x.next, x.scope, x.feedback.en, x.consequence!.en]).toEqual([o.text, o.points, o.next, o.scope, o.feedback, o.consequence]); }));
    }
  });
});
