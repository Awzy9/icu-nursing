import "server-only";
import { DEMO_DOMAINS } from "@/content/demo";
import { loadFixtures, type FixtureQuestion } from "./fixtures";
import { newSeed, seededOrder } from "./shuffle";
import { scoreAttempt, scoreTenths } from "./score";
import { dueAfter, nextBox } from "./leitner";
import {
  QuestionBankError,
  startInputSchema,
  type AnswerResult,
  type AttemptListItem,
  type AttemptView,
  type FeedbackView,
  type HistoryItem,
  type RevisionKind,
  type StudyOverview,
  type ItemView,
  type ProgressView,
  type QuestionBankService,
  type StartInput,
} from "./types";

/**
 * In-memory implementation used ONLY in fixture mode (synthetic nonclinical questions, local development and end-to-end
 * tests). It mirrors the database functions in 0006_question_bank.sql: the answer key stays in this module and is revealed
 * only for answers already submitted (practice) or completed attempts. State is per fixture-session and lost on restart.
 */
interface FxAnswer { optionId: string; isCorrect: boolean | null; revealed: boolean }
interface FxItem { position: number; q: FixtureQuestion; optionOrder: string[]; flagged: boolean; voided: boolean; answer: FxAnswer | null }
interface FxAttempt {
  id: string; mode: "practice" | "exam"; status: "in_progress" | "completed" | "abandoned"; seed: string; questionCount: number;
  domainFilter: string[]; timeLimitSeconds: number | null; startedAt: Date; expiresAt: Date | null; lastPosition: number;
  completedAt: Date | null; timedOut: boolean; scoredTotal: number | null; correct: number | null; tenths: number | null; items: FxItem[];
}
interface FxSched { box: number; due: Date; lastReviewed: Date }
interface FxHist { attemptId: string; mode: "practice" | "exam"; questionId: string; correct: boolean; at: Date }
interface FxUser { attempts: Map<string, FxAttempt>; bookmarks: Set<string>; stats: Map<string, { answered: number; correct: number; lastCorrect: boolean }>; schedule: Map<string, FxSched>; history: FxHist[] }
export type FixtureStore = Map<string, FxUser>;

const g = globalThis as unknown as { __qbFixtureStore?: FixtureStore };
export const sharedFixtureStore = (): FixtureStore => (g.__qbFixtureStore ??= new Map());

const MAX_USERS = 200;
const MAX_UNFINISHED = 5;
const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function createFixtureService(userKey: string, opts: { store?: FixtureStore; now?: () => Date; questions?: FixtureQuestion[] } = {}): QuestionBankService {
  const store = opts.store ?? sharedFixtureStore();
  const now = opts.now ?? (() => new Date());
  const questions = opts.questions ?? loadFixtures();
  const domainBySlug = new Map(DEMO_DOMAINS.map((d) => [d.slug, d]));

  if (!store.has(userKey)) {
    if (store.size >= MAX_USERS) store.delete(store.keys().next().value as string);
    store.set(userKey, { attempts: new Map(), bookmarks: new Set(), stats: new Map(), schedule: new Map(), history: [] });
  }
  const me = store.get(userKey)!;

  const own = (id: string): FxAttempt => {
    const a = me.attempts.get(id);
    if (!a) throw new QuestionBankError("not_found", "attempt not found");
    return a;
  };
  const reveal = (it: FxItem, a: FxAttempt) => {
    if (!it.answer || it.answer.revealed) return;
    it.answer.isCorrect = it.answer.optionId === it.q.correctOptionId;
    it.answer.revealed = true;
    const s = me.stats.get(it.q.id) ?? { answered: 0, correct: 0, lastCorrect: false };
    s.answered += 1;
    if (it.answer.isCorrect) s.correct += 1;
    s.lastCorrect = it.answer.isCorrect;
    me.stats.set(it.q.id, s);
    const t = now();
    const box = nextBox(me.schedule.get(it.q.id)?.box ?? 1, it.answer.isCorrect);
    me.schedule.set(it.q.id, { box, due: dueAfter(box, t), lastReviewed: t });
    me.history.unshift({ attemptId: a.id, mode: a.mode, questionId: it.q.id, correct: it.answer.isCorrect, at: t });
    if (me.history.length > 200) me.history.pop();
  };
  const feedbackFor = (it: FxItem): FeedbackView => ({
    correct_option_id: it.q.correctOptionId,
    is_correct: it.answer?.optionId === it.q.correctOptionId,
    rationale: it.q.rationale,
    explanations: Object.fromEntries(it.q.options.map((o) => [o.id, o.explanation])),
  });
  const finalize = (a: FxAttempt, timedOut: boolean) => {
    if (a.status !== "in_progress") return;
    for (const it of a.items) {
      if (!it.answer) continue;
      reveal(it, a);
    }
    const r = scoreAttempt(a.items.map((i) => ({ voided: i.voided, selectedOptionId: i.answer?.optionId ?? null, correctOptionId: i.q.correctOptionId })));
    a.status = "completed";
    a.completedAt = now();
    a.timedOut = timedOut;
    a.scoredTotal = r.total;
    a.correct = r.correct;
    a.tenths = scoreTenths(r.correct, r.total);
  };
  const expireIfDue = (a: FxAttempt) => {
    if (a.status === "in_progress" && a.expiresAt && a.expiresAt.getTime() <= now().getTime()) finalize(a, true);
  };

  const view = (a: FxAttempt): AttemptView => {
    const done = a.status !== "in_progress";
    const items: ItemView[] = a.items.map((it) => {
      const d = domainBySlug.get(it.q.domainSlug)!;
      const revealed = done || Boolean(it.answer?.revealed);
      return {
        position: it.position,
        question_id: it.q.id,
        domain_slug: it.q.domainSlug,
        domain_title: d.title,
        difficulty: it.q.difficulty,
        synthetic: true,
        flagged: it.flagged,
        bookmarked: me.bookmarks.has(it.q.id),
        voided: it.voided,
        unavailable: false,
        selected_option_id: it.answer?.optionId ?? null,
        revealed,
        stem: it.q.stem,
        options: it.optionOrder.map((id) => ({ id, text: it.q.options.find((o) => o.id === id)!.text })),
        feedback: revealed ? feedbackFor(it) : null,
      };
    });
    let summary: AttemptView["summary"] = null;
    if (a.status === "completed") {
      const byDomain = new Map<string, { correct: number; total: number }>();
      for (const it of a.items) {
        const e = byDomain.get(it.q.domainSlug) ?? { correct: 0, total: 0 };
        if (!it.voided) e.total += 1;
        if (it.answer?.isCorrect) e.correct += 1;
        byDomain.set(it.q.domainSlug, e);
      }
      summary = {
        correct: a.correct ?? 0, total: a.scoredTotal ?? 0, score_tenths: a.tenths ?? 0, timed_out: a.timedOut,
        answered: a.items.filter((i) => i.answer).length, flagged: a.items.filter((i) => i.flagged).length,
        duration_seconds: Math.round(((a.completedAt ?? now()).getTime() - a.startedAt.getTime()) / 1000),
        by_domain: DEMO_DOMAINS.filter((d) => byDomain.has(d.slug)).map((d) => ({ slug: d.slug, title: d.title, ...byDomain.get(d.slug)! })),
      };
    }
    return {
      id: a.id, mode: a.mode, status: a.status, question_count: a.questionCount, started_at: a.startedAt.toISOString(), expires_at: iso(a.expiresAt),
      time_limit_seconds: a.timeLimitSeconds, server_now: now().toISOString(), last_position: a.lastPosition, completed_at: iso(a.completedAt),
      domain_filter: a.domainFilter, items, summary,
    };
  };

  return {
    mode: "fixtures",

    async progress(): Promise<ProgressView> {
      const completed = [...me.attempts.values()].filter((a) => a.status === "completed");
      return {
        domains: DEMO_DOMAINS.map((d) => {
          const qs = questions.filter((q) => q.domainSlug === d.slug);
          const st = qs.map((q) => me.stats.get(q.id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
          return { slug: d.slug, title: d.title, available: qs.length, answered: st.length, correct: st.filter((s) => s.lastCorrect).length };
        }),
        completed_attempts: completed.length,
        average_tenths: completed.length ? Math.round(completed.reduce((n, a) => n + (a.tenths ?? 0), 0) / completed.length) : null,
        bookmarked: me.bookmarks.size,
        synthetic_fixtures: true,
      };
    },

    async listAttempts(): Promise<AttemptListItem[]> {
      return [...me.attempts.values()]
        .filter((a) => a.status !== "abandoned")
        .sort((x, y) => y.startedAt.getTime() - x.startedAt.getTime())
        .slice(0, 20)
        .map((a) => {
          expireIfDue(a);
          return {
            id: a.id, mode: a.mode, status: a.status, question_count: a.questionCount, answered: a.items.filter((i) => i.answer).length,
            correct: a.correct, total: a.scoredTotal, score_tenths: a.tenths, timed_out: a.timedOut, started_at: a.startedAt.toISOString(),
            completed_at: iso(a.completedAt), expires_at: iso(a.expiresAt), time_limit_seconds: a.timeLimitSeconds,
          };
        });
    },

    async startAttempt(raw: StartInput, only?: Set<string>): Promise<string> {
      const parsed = startInputSchema.safeParse(raw);
      if (!parsed.success) throw new QuestionBankError("invalid", "invalid selection");
      const i = parsed.data;
      if (i.timeLimitMinutes !== null && i.mode !== "exam") throw new QuestionBankError("invalid", "a time limit is only available in exam mode");
      if ([...me.attempts.values()].filter((a) => a.status === "in_progress").length >= MAX_UNFINISHED) throw new QuestionBankError("limit", "too many unfinished attempts");
      const pool = questions.filter((q) => (i.domains.length === 0 || i.domains.includes(q.domainSlug)) && (!i.bookmarkedOnly || me.bookmarks.has(q.id)) && (!only || only.has(q.id)));
      if (pool.length === 0) throw new QuestionBankError("not_found", "no questions are available for this selection");
      const seed = newSeed();
      const n = Math.min(pool.length, i.count);
      const order = seededOrder(pool.map((q) => q.id), seed).slice(0, n);
      const id = crypto.randomUUID();
      const t = now();
      const a: FxAttempt = {
        id, mode: i.mode, status: "in_progress", seed, questionCount: n, domainFilter: i.domains,
        timeLimitSeconds: i.timeLimitMinutes ? i.timeLimitMinutes * 60 : null, startedAt: t,
        expiresAt: i.timeLimitMinutes ? new Date(t.getTime() + i.timeLimitMinutes * 60_000) : null,
        lastPosition: 1, completedAt: null, timedOut: false, scoredTotal: null, correct: null, tenths: null, items: [],
      };
      a.items = order.map((qid, idx) => {
        const q = pool.find((x) => x.id === qid)!;
        return { position: idx + 1, q, optionOrder: seededOrder(q.options.map((o) => o.id), seed, q.id), flagged: false, voided: false, answer: null };
      });
      me.attempts.set(id, a);
      return id;
    },

    async getAttempt(id: string) {
      const a = me.attempts.get(id);
      if (!a) return null;
      expireIfDue(a);
      return view(a);
    },

    async submitAnswer(id, position, optionId): Promise<AnswerResult> {
      const a = own(id);
      expireIfDue(a);
      if (a.status !== "in_progress") throw new QuestionBankError("conflict", "this attempt is no longer in progress");
      const it = a.items.find((x) => x.position === position);
      if (!it) throw new QuestionBankError("not_found", "no such question in this attempt");
      if (optionId === null) {
        if (a.mode !== "exam") throw new QuestionBankError("conflict", "answers cannot be cleared in practice mode");
        it.answer = null;
        a.lastPosition = position;
        return { cleared: true };
      }
      if (!it.optionOrder.includes(optionId)) throw new QuestionBankError("invalid", "option does not belong to this question");
      if (a.mode === "practice") {
        if (it.answer) throw new QuestionBankError("conflict", "this question has already been answered");
        it.answer = { optionId, isCorrect: null, revealed: false };
        reveal(it, a);
        a.lastPosition = position;
        return { feedback: feedbackFor(it) };
      }
      it.answer = { optionId, isCorrect: null, revealed: false };
      a.lastPosition = position;
      return {};
    },

    async setFlag(id, position, flagged) {
      const a = own(id);
      expireIfDue(a);
      if (a.status !== "in_progress") throw new QuestionBankError("conflict", "this attempt is no longer in progress");
      const it = a.items.find((x) => x.position === position);
      if (!it) throw new QuestionBankError("not_found", "no such question in this attempt");
      it.flagged = flagged;
    },

    async setPosition(id, position) {
      const a = own(id);
      expireIfDue(a);
      if (a.status !== "in_progress") return;
      if (position < 1 || position > a.questionCount) throw new QuestionBankError("invalid", "invalid position");
      a.lastPosition = position;
    },

    async submitAttempt(id) {
      const a = own(id);
      if (a.status === "abandoned") throw new QuestionBankError("conflict", "this attempt was discarded");
      finalize(a, Boolean(a.expiresAt && a.expiresAt.getTime() <= now().getTime()));
      return view(a);
    },

    async discardAttempt(id) {
      const a = own(id);
      if (a.status === "in_progress") a.status = "abandoned";
    },

    async setBookmark(questionId, bookmarked) {
      if (bookmarked) {
        if (!questions.some((q) => q.id === questionId)) throw new QuestionBankError("not_found", "question not found");
        me.bookmarks.add(questionId);
      } else me.bookmarks.delete(questionId);
    },

    async studyOverview(): Promise<StudyOverview> {
      const t = now().getTime();
      const visible = new Map(questions.map((q) => [q.id, q]));
      const sched = [...me.schedule.entries()].filter(([id]) => visible.has(id));
      const flagged = new Set<string>();
      for (const a of me.attempts.values()) for (const it of a.items) if (it.flagged) flagged.add(it.q.id);
      const dayStart = new Date(now()); dayStart.setUTCHours(0, 0, 0, 0);
      const upcoming = sched.map(([, s]) => s.due).filter((d) => d.getTime() > t).sort((x, y) => x.getTime() - y.getTime())[0];
      return {
        due: sched.filter(([, s]) => s.due.getTime() <= t).length,
        incorrect: [...me.stats.entries()].filter(([id, s]) => visible.has(id) && !s.lastCorrect).length,
        flagged: [...flagged].filter((id) => visible.has(id)).length,
        bookmarked: [...me.bookmarks].filter((id) => visible.has(id)).length,
        reviewed_today: sched.filter(([, s]) => s.lastReviewed.getTime() >= dayStart.getTime()).length,
        next_due_at: upcoming ? upcoming.toISOString() : null,
        boxes: [1, 2, 3, 4, 5].map((b) => sched.filter(([, s]) => s.box === b).length),
        domains: DEMO_DOMAINS.map((d) => {
          const qs = questions.filter((q) => q.domainSlug === d.slug);
          const st = qs.map((q) => me.stats.get(q.id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
          return {
            slug: d.slug, title: d.title, available: qs.length, answered: st.length, correct: st.filter((x) => x.lastCorrect).length,
            due: qs.filter((q) => { const s = me.schedule.get(q.id); return s ? s.due.getTime() <= t : false; }).length,
          };
        }),
        synthetic_fixtures: true,
      };
    },

    async startRevision(kind: RevisionKind, count: number, domains: string[] = []) {
      const t = now().getTime();
      const ids = new Set<string>();
      if (kind === "due") for (const [id, s] of me.schedule) if (s.due.getTime() <= t) ids.add(id);
      if (kind === "incorrect") for (const [id, s] of me.stats) if (!s.lastCorrect) ids.add(id);
      if (kind === "flagged") for (const a of me.attempts.values()) for (const it of a.items) if (it.flagged) ids.add(it.q.id);
      if (kind === "bookmarked") for (const id of me.bookmarks) ids.add(id);
      return (this.startAttempt as (raw: StartInput, only?: Set<string>) => Promise<string>).call(this, { mode: "practice", count, domains }, ids);
    },

    async history(limit = 30): Promise<HistoryItem[]> {
      return me.history.slice(0, Math.max(1, Math.min(limit, 100))).flatMap((h) => {
        const q = questions.find((x) => x.id === h.questionId);
        const d = q ? domainBySlug.get(q.domainSlug) : undefined;
        return q && d ? [{ attempt_id: h.attemptId, mode: h.mode, question_id: q.id, domain_slug: d.slug, domain_title: d.title, stem: q.stem, is_correct: h.correct, answered_at: h.at.toISOString(), synthetic: true }] : [];
      });
    },
  };
}
