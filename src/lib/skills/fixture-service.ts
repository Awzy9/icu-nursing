import "server-only";
import { loadSkillFixtures, type SkillFixture } from "./fixtures";
import { SkillError, type Result, type SkillCard, type SkillDetail, type SkillListFilter, type SkillProgress, type SkillService, type SkillSessionView } from "./types";

/** In-memory engine for fixture mode (development and end-to-end tests). Mirrors the sk_* database functions: self-report only, nothing verified. */
interface Sess { id: string; skillId: string; status: "in_progress" | "completed" | "abandoned"; startedAt: Date; completedAt: Date | null; marks: Map<string, Result>; summary: SkillSessionView["summary"] }
interface FxUser { sessions: Map<string, Sess>; bookmarks: Set<string> }
export type SkillStore = Map<string, FxUser>;
const g = globalThis as unknown as { __skFixtureStore?: SkillStore };
export const sharedSkillStore = (): SkillStore => (g.__skFixtureStore ??= new Map());
const PUBLISHED = "2026-01-01T00:00:00.000Z";

export function createSkillFixtureService(userKey: string, opts: { store?: SkillStore; now?: () => Date; skills?: SkillFixture[] } = {}): SkillService {
  const store = opts.store ?? sharedSkillStore();
  const now = opts.now ?? (() => new Date());
  const skills = opts.skills ?? loadSkillFixtures();
  if (!store.has(userKey)) {
    if (store.size >= 200) store.delete(store.keys().next().value as string);
    store.set(userKey, { sessions: new Map(), bookmarks: new Set() });
  }
  const me = store.get(userKey)!;
  const mine = (skillId: string) => [...me.sessions.values()].filter((s) => s.skillId === skillId).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  const own = (id: string) => { const s = me.sessions.get(id); if (!s) throw new SkillError("not_found", "session not found"); return s; };
  const skill = (id: string) => { const s = skills.find((x) => x.id === id); if (!s) throw new SkillError("not_found", "skill not found"); return s; };

  const card = (s: SkillFixture): SkillCard => {
    const all = mine(s.id);
    const done = all.filter((x) => x.status === "completed");
    return {
      id: s.id, code: s.code, title: s.title, summary: s.summary, category: s.category, synthetic: true, steps: s.checklist.length, bookmarked: me.bookmarks.has(s.id),
      in_progress_session: all.find((x) => x.status === "in_progress")?.id ?? null, sessions_completed: done.length,
      last_completed_at: done[0]?.completedAt?.toISOString() ?? null, last_items_done: done[0]?.summary?.items_done ?? null, last_items_total: done[0]?.summary?.items_total ?? null,
    };
  };
  const sessionView = (a: Sess): SkillSessionView => {
    const s = skill(a.skillId);
    return {
      id: a.id, status: a.status, mode: "self_study", started_at: a.startedAt.toISOString(), completed_at: a.completedAt?.toISOString() ?? null,
      skill: { id: s.id, code: s.code, title: s.title, category: s.category, synthetic: true, version: s.version },
      items: s.checklist.map((c) => ({ id: c.id, position: c.position, phase: c.phase, text: c.text, critical: c.critical, support: c.support, result: a.marks.get(c.id) ?? null })),
      summary: a.summary,
    };
  };

  return {
    mode: "fixtures",
    async progress(): Promise<SkillProgress> {
      const all = [...me.sessions.values()];
      return {
        available: skills.length, practised: new Set(all.filter((x) => x.status === "completed").map((x) => x.skillId)).size,
        in_progress: all.filter((x) => x.status === "in_progress").length, bookmarked: me.bookmarks.size, synthetic_fixtures: true,
      };
    },
    async list(f: SkillListFilter = {}) {
      const q = f.query?.trim().toLowerCase();
      return skills
        .filter((s) => (!f.category || s.category === f.category) && (!f.bookmarked || me.bookmarks.has(s.id))
          && (!q || JSON.stringify([s.title, s.summary, s.code]).toLowerCase().includes(q)))
        .sort((a, b) => a.category.localeCompare(b.category) || a.code.localeCompare(b.code)).map(card);
    },
    async get(code) {
      const s = skills.find((x) => x.code === code);
      if (!s) return null;
      const detail: SkillDetail = {
        ...card(s), objectives: s.objectives, prerequisites: s.prerequisites, sections: s.sections, section_support: s.sectionSupport as SkillDetail["section_support"],
        evidence_status: "unassessed", license_status: "unassessed", evidence_date: null, references: [], version: s.version, published_at: PUBLISHED,
        checklist: s.checklist.map((c) => ({ id: c.id, position: c.position, phase: c.phase, text: c.text, critical: c.critical, support: c.support })),
        revisions: [{ version: s.version, changed_at: PUBLISHED, summary: s.revision }],
        my_sessions: mine(s.id).filter((x) => x.status !== "abandoned").slice(0, 10).map((x) => ({
          id: x.id, status: x.status, started_at: x.startedAt.toISOString(), completed_at: x.completedAt?.toISOString() ?? null,
          items_done: x.summary?.items_done ?? null, items_total: x.summary?.items_total ?? null, critical_done: x.summary?.critical_done ?? null, critical_total: x.summary?.critical_total ?? null,
        })),
      };
      return detail;
    },
    async setBookmark(skillId, on) { skill(skillId); if (on) { if (me.bookmarks.size >= 200) throw new SkillError("limit", "bookmark limit reached"); me.bookmarks.add(skillId); } else me.bookmarks.delete(skillId); },
    async start(skillId) {
      skill(skillId);
      const open = mine(skillId).find((x) => x.status === "in_progress");
      if (open) return open.id;
      if ([...me.sessions.values()].filter((x) => x.status === "in_progress").length >= 10) throw new SkillError("limit", "too many unfinished sessions");
      const id = crypto.randomUUID();
      me.sessions.set(id, { id, skillId, status: "in_progress", startedAt: now(), completedAt: null, marks: new Map(), summary: null });
      return id;
    },
    async getSession(id) { const a = me.sessions.get(id); return a ? sessionView(a) : null; },
    async mark(id, itemId, result) {
      const a = own(id);
      if (a.status !== "in_progress") throw new SkillError("conflict", "this session is no longer in progress");
      if (!skill(a.skillId).checklist.some((c) => c.id === itemId)) throw new SkillError("invalid", "item does not belong to this skill");
      a.marks.set(itemId, result);
    },
    async complete(id) {
      const a = own(id);
      if (a.status !== "in_progress") throw new SkillError("conflict", "this session is no longer in progress");
      const s = skill(a.skillId);
      a.summary = {
        items_total: s.checklist.length, items_done: s.checklist.filter((c) => a.marks.get(c.id) === "done").length, items_unsure: s.checklist.filter((c) => a.marks.get(c.id) === "unsure").length,
        critical_total: s.checklist.filter((c) => c.critical).length, critical_done: s.checklist.filter((c) => c.critical && a.marks.get(c.id) === "done").length,
      };
      a.status = "completed"; a.completedAt = now();
      return sessionView(a);
    },
    async discard(id) { const a = own(id); if (a.status === "in_progress") a.status = "abandoned"; },
  };
}
