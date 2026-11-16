import "server-only";
import { DEMO_DOMAINS } from "@/content/demo";
import { seededOrder, newSeed } from "@/lib/question-bank/shuffle";
import { scoreTenths } from "@/lib/question-bank/score";
import { loadCaseFixtures, type CaseFixture } from "./fixtures";
import { CaseError, type CaseAttemptView, type CaseListItem, type CaseProgress, type CaseService } from "./types";

/** In-memory engine for fixture mode (development and end-to-end tests). Mirrors the cs_* database functions and their secrecy rules. */
interface Fx { id: string; caseId: string; seed: string; status: "in_progress" | "completed" | "abandoned"; position: number; startedAt: Date; completedAt: Date | null; taken: { position: number; optionId: string; points: number }[] }
interface FxUser { attempts: Map<string, Fx> }
export type CaseStore = Map<string, FxUser>;
const g = globalThis as unknown as { __csFixtureStore?: CaseStore };
export const sharedCaseStore = (): CaseStore => (g.__csFixtureStore ??= new Map());

export function createCaseFixtureService(userKey: string, opts: { store?: CaseStore; now?: () => Date; cases?: CaseFixture[] } = {}): CaseService {
  const store = opts.store ?? sharedCaseStore();
  const now = opts.now ?? (() => new Date());
  const cases = opts.cases ?? loadCaseFixtures();
  if (!store.has(userKey)) {
    if (store.size >= 200) store.delete(store.keys().next().value as string);
    store.set(userKey, { attempts: new Map() });
  }
  const me = store.get(userKey)!;
  const dom = (slug: string) => DEMO_DOMAINS.find((d) => d.slug === slug)!;
  const own = (id: string) => { const a = me.attempts.get(id); if (!a) throw new CaseError("not_found", "attempt not found"); return a; };

  const debrief = (c: CaseFixture, a: Fx) => {
    const scopes: Record<string, number> = {};
    for (const t of a.taken) { const o = c.steps.find((x) => x.position === t.position)!.options.find((x) => x.id === t.optionId)!; scopes[o.scope] = (scopes[o.scope] ?? 0) + 1; }
    return { learning_points: c.debrief?.learning_points ?? null, links: c.debrief?.links ?? [], scope_counts: scopes, revisit_positions: a.taken.filter((t) => t.points < 2).map((t) => t.position).sort((x, y) => x - y) };
  };
  const view = (a: Fx): CaseAttemptView => {
    const c = cases.find((x) => x.id === a.caseId)!;
    const done = a.status !== "in_progress";
    const order = (stepId: string, ids: string[]) => seededOrder(ids, a.seed, stepId);
    const trail = a.taken.map((t) => {
      const s = c.steps.find((x) => x.position === t.position)!;
      return {
        position: s.position, info: s.info, prompt: s.prompt, observations: s.observations, chosen_option_id: t.optionId, points: t.points,
        options: order(s.id, s.options.map((o) => o.id)).map((id) => { const o = s.options.find((x) => x.id === id)!; return { id: o.id, text: o.text, points: o.points, scope: o.scope, feedback: o.feedback, consequence: o.consequence }; }),
      };
    });
    const cur = done ? null : c.steps.find((s) => s.position === a.position)!;
    const points = a.taken.reduce((n, t) => n + t.points, 0);
    return {
      id: a.id, status: a.status, started_at: a.startedAt.toISOString(), completed_at: a.completedAt?.toISOString() ?? null, current_position: a.position,
      case: { id: c.id, code: c.code, title: c.title, vignette: c.vignette, difficulty: c.difficulty, synthetic: true, steps: c.steps.length, domain_slug: c.domainSlug, domain_title: dom(c.domainSlug).title },
      trail,
      current: cur ? { position: cur.position, info: cur.info, prompt: cur.prompt, observations: cur.observations, options: order(cur.id, cur.options.map((o) => o.id)).map((id) => { const o = cur.options.find((x) => x.id === id)!; return { id: o.id, text: o.text }; }) } : null,
      summary: a.status === "completed" ? { points, max_points: 2 * a.taken.length, score_tenths: scoreTenths(points, 2 * a.taken.length), steps: a.taken.length, duration_seconds: Math.round(((a.completedAt ?? now()).getTime() - a.startedAt.getTime()) / 1000), debrief: debrief(c, a) } : null,
    };
  };

  return {
    mode: "fixtures",
    async progress(): Promise<CaseProgress> {
      const completed = [...me.attempts.values()].filter((a) => a.status === "completed");
      const tenths = completed.map((a) => scoreTenths(a.taken.reduce((n, t) => n + t.points, 0), 2 * a.taken.length));
      return {
        available: cases.length, completed_cases: new Set(completed.map((a) => a.caseId)).size,
        in_progress: [...me.attempts.values()].filter((a) => a.status === "in_progress").length,
        average_tenths: tenths.length ? Math.round(tenths.reduce((n, x) => n + x, 0) / tenths.length) : null, synthetic_fixtures: true,
      };
    },
    async list(): Promise<CaseListItem[]> {
      return cases.map((c) => {
        const mine = [...me.attempts.values()].filter((a) => a.caseId === c.id).sort((x, y) => y.startedAt.getTime() - x.startedAt.getTime());
        const open = mine.find((a) => a.status === "in_progress");
        const done = mine.filter((a) => a.status === "completed");
        const scores = done.map((a) => scoreTenths(a.taken.reduce((n, t) => n + t.points, 0), 2 * a.taken.length));
        return {
          id: c.id, code: c.code, title: c.title, difficulty: c.difficulty, synthetic: true, domain_slug: c.domainSlug, domain_title: dom(c.domainSlug).title, steps: c.steps.length,
          in_progress_attempt: open?.id ?? null, in_progress_position: open?.position ?? null, completed: done.length,
          best_score_tenths: scores.length ? Math.max(...scores) : null, last_completed_attempt: done[0]?.id ?? null,
        };
      });
    },
    async start(caseId) {
      const c = cases.find((x) => x.id === caseId);
      if (!c) throw new CaseError("not_found", "case not found");
      const open = [...me.attempts.values()].find((a) => a.caseId === caseId && a.status === "in_progress");
      if (open) return open.id;
      if ([...me.attempts.values()].filter((a) => a.status === "in_progress").length >= 5) throw new CaseError("limit", "too many unfinished cases");
      const id = crypto.randomUUID();
      me.attempts.set(id, { id, caseId, seed: newSeed(), status: "in_progress", position: 1, startedAt: now(), completedAt: null, taken: [] });
      return id;
    },
    async get(id) { const a = me.attempts.get(id); return a ? view(a) : null; },
    async choose(id, position, optionId) {
      const a = own(id);
      if (a.status !== "in_progress") throw new CaseError("conflict", "this case attempt is no longer in progress");
      if (position !== a.position) throw new CaseError("conflict", "that step is not the current step");
      const c = cases.find((x) => x.id === a.caseId)!;
      const s = c.steps.find((x) => x.position === a.position)!;
      const o = s.options.find((x) => x.id === optionId);
      if (!o) throw new CaseError("invalid", "option does not belong to this step");
      a.taken.push({ position: a.position, optionId, points: o.points });
      if (o.next === null) { a.status = "completed"; a.completedAt = now(); } else a.position = o.next;
      return view(a);
    },
    async discard(id) { const a = own(id); if (a.status === "in_progress") a.status = "abandoned"; },
  };
}
