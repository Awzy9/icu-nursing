// Pure logic for the staff draft pages (no server-only import so it is unit-testable). Operates on metadata only.
import type { DraftHistory, DraftIndex, DraftType, HistoryEntry, IndexEntry, IndexSource } from "../../../scripts/build-draft-index";

export const DRAFT_TYPES: { type: DraftType; label: string }[] = [
  { type: "topics", label: "Topics" }, { type: "questions", label: "Questions" }, { type: "cases", label: "Cases (scenarios)" },
  { type: "skills", label: "Skills" }, { type: "medications", label: "Medications" }, { type: "equipment", label: "Equipment" },
];
export const STALE_DAYS = 180;
export type Freshness = "fresh" | "stale" | "unknown";

/** Days since a verification date; null when there is no date. */
export function ageDays(verified: string | null, today: Date): number | null {
  if (!verified) return null;
  return Math.floor((today.getTime() - new Date(`${verified}T00:00:00Z`).getTime()) / 86_400_000);
}
export function sourceFreshness(s: IndexSource, today: Date): Freshness {
  const a = ageDays(s.verified, today);
  return a === null ? "unknown" : a > STALE_DAYS ? "stale" : "fresh";
}
/** Worst freshness across a draft's sources: any stale -> stale, else any unknown -> unknown, else fresh. A draft with no sources is unknown. */
export function draftFreshness(e: IndexEntry, today: Date): Freshness {
  if (!e.sources.length) return "unknown";
  const f = e.sources.map((s) => sourceFreshness(s, today));
  return f.includes("stale") ? "stale" : f.includes("unknown") ? "unknown" : "fresh";
}
export const LICENCE_ORDER = ["RED", "UNVERIFIED", "YELLOW", "GREEN", "N/A", "UNREGISTERED"] as const;
export function worstLicence(e: IndexEntry): string {
  for (const l of LICENCE_ORDER) if (e.sources.some((s) => s.licence_class === l)) return l;
  return "NONE";
}

export interface Filter { type?: string; evidence?: string; validation?: string; licence?: string; freshness?: string; notes?: string; q?: string }
export function filterDrafts(entries: IndexEntry[], f: Filter, today: Date, withNotes: Set<string> = new Set()): IndexEntry[] {
  const q = (f.q ?? "").trim().toLowerCase().slice(0, 80);
  return entries.filter((e) =>
    (!f.type || e.type === f.type) &&
    (!f.evidence || e.evidence_status === f.evidence) &&
    (!f.validation || (f.validation === "issues" ? e.issues.length > 0 : e.issues.length === 0)) &&
    (!f.licence || worstLicence(e) === f.licence) &&
    (!f.freshness || draftFreshness(e, today) === f.freshness) &&
    (!f.notes || (f.notes === "with" ? withNotes.has(e.key) : !withNotes.has(e.key))) &&
    (!q || e.key.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)));
}

export interface SnapshotDiff { from: HistoryEntry | null; to: HistoryEntry; changes: string[] }
/** Compares the latest snapshot with the previous one (metadata only; the body text is never stored here). */
export function compareLatest(h: DraftHistory, key: string): SnapshotDiff | null {
  const list = h.entries[key]; if (!list?.length) return null;
  const to = list.at(-1)!, from = list.length > 1 ? list.at(-2)! : null;
  if (!from) return { from, to, changes: [] };
  const changes: string[] = [];
  if (from.evidence_status !== to.evidence_status) changes.push(`Evidence status: ${from.evidence_status} -> ${to.evidence_status}`);
  const added = to.sources.filter((s) => !from.sources.includes(s)), removed = from.sources.filter((s) => !to.sources.includes(s));
  if (added.length) changes.push(`Sources added: ${added.join(", ")}`);
  if (removed.length) changes.push(`Sources removed: ${removed.join(", ")}`);
  if (from.gaps !== to.gaps) changes.push(`Declared gaps: ${from.gaps} -> ${to.gaps}`);
  if (from.required_sources !== to.required_sources) changes.push(`Sources still needed: ${from.required_sources} -> ${to.required_sources}`);
  if (from.issues !== to.issues) changes.push(`Validator issues: ${from.issues} -> ${to.issues}`);
  if (!changes.length) changes.push("Content changed (hash differs); no change in the tracked metadata.");
  return { from, to, changes };
}

export interface CoverageRow { type: DraftType; label: string; total: number; clean: number; withIssues: number; reviewed: number; evidence: Record<string, number>; unfresh: number; redOrUnverified: number; extra: string }
export function coverage(d: DraftIndex, today: Date): CoverageRow[] {
  return DRAFT_TYPES.map(({ type, label }) => {
    const es = d.entries.filter((e) => e.type === type);
    const evidence: Record<string, number> = {};
    for (const e of es) evidence[e.evidence_status] = (evidence[e.evidence_status] ?? 0) + 1;
    const graphs = es.filter((e) => e.spec_level === "decision_graph").length;
    return {
      type, label, total: es.length, clean: es.filter((e) => e.issues.length === 0).length, withIssues: es.filter((e) => e.issues.length > 0).length,
      reviewed: es.filter((e) => e.clinically_reviewed).length, evidence,
      unfresh: es.filter((e) => draftFreshness(e, today) !== "fresh").length,
      redOrUnverified: es.filter((e) => ["RED", "UNVERIFIED"].includes(worstLicence(e))).length,
      extra: type === "cases" ? `${graphs} decision graphs, ${es.length - graphs} outlines` : "",
    };
  });
}
/** What the original plan expects. Used only to show the gap between planned and drafted, never to enable anything. */
export const PLAN: Record<string, number> = { topics: 40, skills: 25, medications: 50, cases: 20, equipment: 8 };
