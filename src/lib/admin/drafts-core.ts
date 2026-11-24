// Pure logic for the staff draft pages (no server-only import so it is unit-testable). Operates on metadata only.
import type { DraftHistory, DraftIndex, DraftType, HistoryEntry, IndexEntry, IndexSource } from "../../../scripts/build-draft-index";

export const DRAFT_TYPES: { type: DraftType; label: string }[] = [
  { type: "topics", label: "Topics" }, { type: "questions", label: "Questions" }, { type: "cases", label: "Cases (scenarios)" },
  { type: "skills", label: "Skills" }, { type: "medications", label: "Medications" }, { type: "equipment", label: "Equipment" }, { type: "practice", label: "Practice exercises" },
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

/** A staff workflow *triage aid*, not an automated clinical risk score or approval. */
export type ReviewLane = "patient-safety" | "source-verification" | "rights-review" | "general";
const PATIENT_SAFETY_KEYS = new Set([
  "D01-T06", "D01-T07", "D01-T09", "D01-T11", "D01-T17",
  "D02-T08", "D02-T09", "D02-T12", "D02-T14",
  "D04-T06", "D04-T08", "D04-T09", "D08-T02", "D08-T03",
  "SK-06", "SK-07", "SK-09", "SK-13", "SK-17", "SK-22", "SK-23",
  "MD-01", "MD-02", "MD-18", "MD-19", "MD-20", "MD-30", "MD-31", "MD-44",
]);
export const REVIEW_LANES: { key: ReviewLane; label: string }[] = [
  { key: "patient-safety", label: "Clinical priority (suggested)" },
  { key: "source-verification", label: "Missing or unverified sources" },
  { key: "rights-review", label: "Restricted source reuse" },
  { key: "general", label: "Other outstanding reviews" },
];
export function reviewLane(e: IndexEntry): ReviewLane {
  // Decision-graph answers affect clinical teaching, so every scenario is prioritised
  // along with explicitly named airway, shock, high-alert and rescue modules.
  if (e.type === "cases" || PATIENT_SAFETY_KEYS.has(e.key)) return "patient-safety";
  if (!e.sources.length || e.sources.some((s) => ["UNVERIFIED", "UNREGISTERED"].includes(s.licence_class))) return "source-verification";
  if (e.sources.some((s) => s.licence_class === "RED")) return "rights-review";
  return "general";
}
const LANE_ORDER: ReviewLane[] = ["patient-safety", "source-verification", "rights-review", "general"];
export function orderReviewQueue(entries: IndexEntry[]): IndexEntry[] {
  // Highest declared gap count first *within* each staff workflow lane.
  // Validation success and this sorting never imply clinical or licensing approval.
  return [...entries].sort((a, b) =>
    LANE_ORDER.indexOf(reviewLane(a)) - LANE_ORDER.indexOf(reviewLane(b)) ||
    b.gaps - a.gaps ||
    a.key.localeCompare(b.key));
}

export interface Filter { type?: string; evidence?: string; validation?: string; licence?: string; freshness?: string; notes?: string; review?: string; q?: string }
export function filterDrafts(entries: IndexEntry[], f: Filter, today: Date, withNotes: Set<string> = new Set()): IndexEntry[] {
  const q = (f.q ?? "").trim().toLowerCase().slice(0, 80);
  return entries.filter((e) =>
    (!f.type || e.type === f.type) &&
    (!f.evidence || e.evidence_status === f.evidence) &&
    (!f.validation || (f.validation === "issues" ? e.issues.length > 0 : e.issues.length === 0)) &&
    (!f.licence || worstLicence(e) === f.licence) &&
    (!f.freshness || draftFreshness(e, today) === f.freshness) &&
    (!f.notes || (f.notes === "with" ? withNotes.has(e.key) : !withNotes.has(e.key))) &&
    (!f.review || reviewLane(e) === f.review) &&
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
export const PLAN: Record<string, number> = { topics: 40, skills: 25, medications: 50, cases: 20, equipment: 8, practice: 12 };
