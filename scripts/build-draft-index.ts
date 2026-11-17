// Builds src/content/draft-index.json (METADATA ONLY about each unpublished draft: key, type, title, evidence status, cited source ids with licence class
// and verification date, validator feedback, counts, a content hash) and appends to src/content/draft-history.json when a draft's hash changes.
// Used by the staff-only /admin/content pages. It never copies draft body text, never writes to a database, and imports nothing into learner-facing code.
// Both files are deterministic for unchanged drafts; CI regenerates them and fails on a diff.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseFrontMatter, validateDraft } from "../src/lib/draft-validator";
import { validateSkillDraft } from "../src/lib/skill-draft-validator";
import { validateMedicationDraft } from "../src/lib/medication-draft-validator";
import { validateScenarioDraft } from "../src/lib/scenario-draft-validator";
import { validateEquipmentDraft } from "../src/lib/equipment-draft-validator";
import { loadKnownSources, loadSkillDrafts } from "./validate-skill-drafts";
import { loadMedicationDrafts, loadMedicationLabels, loadMedicationPlan, loadGuidelineSources } from "./validate-medication-drafts";
import { loadScenarioDrafts, loadScenarioKnownSources } from "./validate-scenario-drafts";
import { loadEquipmentDrafts } from "./validate-equipment-drafts";
import { validatePracticeDraft } from "../src/lib/practice-draft-validator";
import { loadPracticeDrafts } from "./validate-practice-drafts";

export type DraftType = "topics" | "questions" | "skills" | "medications" | "cases" | "equipment" | "practice";
export interface IndexSource { id: string; licence_class: string; verified: string | null }
export interface IndexEntry {
  key: string; type: DraftType; title: string; domain: string | null; evidence_status: string; spec_level: string | null; clinically_reviewed: boolean;
  sources: IndexSource[]; issues: { rule: string; message: string }[]; gaps: number; required_sources: number; hash: string;
}
export interface DraftIndex { note: string; entries: IndexEntry[] }
export interface HistoryEntry { hash: string; recorded: string; evidence_status: string; sources: string[]; gaps: number; required_sources: number; issues: number }
export interface DraftHistory { note: string; entries: Record<string, HistoryEntry[]> }

/** Minimal RFC 4180 reader (quoted fields, doubled quotes, embedded commas and newlines). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []; let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); if (row.some((x) => x !== "")) rows.push(row); }
  const head = rows.shift() ?? [];
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
const csv = (file: string): Record<string, string>[] => (existsSync(file) ? parseCsv(readFileSync(file, "utf8")) : []);
// Hash canonical LF content so Windows CRLF checkouts do not create false draft revisions.\nconst sha = (s: string) => createHash("sha256").update(s.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);
const list = (v: string | undefined) => (v ?? "").replace(/^\[|\]$/g, "").split(",").map((x) => x.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);

/** Collapses the free-text licence classes in the registers to one band, taking the most restrictive reading when several appear (e.g. YELLOW/RED -> RED). */
export function licenceBand(raw: string): "RED" | "UNVERIFIED" | "YELLOW" | "GREEN" | "N/A" {
  const t = raw.toUpperCase();
  if (/\bRED\b/.test(t)) return "RED";
  if (/UNVERIFIED|UNCONFIRMED|UNASSESSED/.test(t) || t.trim() === "") return "UNVERIFIED";
  if (/YELLOW/.test(t)) return "YELLOW";
  if (/GREEN/.test(t)) return "GREEN";
  return t.includes("N/A") ? "N/A" : "UNVERIFIED";
}
export function loadSourceTable(root = "."): Map<string, { licence_class: string; verified: string | null }> {
  const m = new Map<string, { licence_class: string; verified: string | null }>();
  for (const r of csv(path.join(root, "sources/source_register.csv"))) m.set(r.source_id!, { licence_class: licenceBand(r.licence_class ?? ""), verified: /^\d{4}-\d\d-\d\d$/.test(r.verification_date ?? "") ? r.verification_date! : null });
  for (const r of csv(path.join(root, "content/drafts/skills/NEW_SOURCES.csv"))) m.set(r.source_id!, { licence_class: licenceBand(r.licence_class ?? ""), verified: null });
  for (const r of csv(path.join(root, "content/drafts/medications/LABEL_SOURCES.csv"))) m.set(r.source_id!, { licence_class: licenceBand(r.licence_class ?? ""), verified: /^\d{4}-\d\d-\d\d$/.test(r.accessed ?? "") ? r.accessed! : null });
  return m;
}

export function buildDraftIndex(root = "."): DraftIndex {
  const base = path.join(root, "content/drafts");
  const table = loadSourceTable(root);
  const src = (ids: string[]): IndexSource[] => [...new Set(ids)].sort().map((id) => ({ id, licence_class: table.get(id)?.licence_class ?? "UNREGISTERED", verified: table.get(id)?.verified ?? null }));
  const entries: IndexEntry[] = [];
  // topics (markdown) and MCQ expansion sets (markdown)
  for (const d of readdirSync(base).filter((x) => /^batch-\d+$/.test(x)).sort()) for (const f of readdirSync(path.join(base, d)).filter((x) => x.endsWith(".md")).sort()) {
    const text = readFileSync(path.join(base, d, f), "utf8"); const fm = parseFrontMatter(text);
    entries.push({ key: fm.topic_id!, type: "topics", title: fm.title ?? f, domain: fm.domain ?? null, evidence_status: /partial/i.test(fm.title ?? "") ? "partial" : "stated_in_text", spec_level: null, clinically_reviewed: fm.clinically_reviewed === "true", sources: src(list(fm.sources)), issues: validateDraft(text).map(({ rule, message }) => ({ rule, message })), gaps: 0, required_sources: list(fm.sources_not_read).length, hash: sha(text) });
  }
  for (const f of readdirSync(path.join(base, "mcq-expansion")).filter((x) => /^XQ-\d\d-.*\.md$/.test(x)).sort()) {
    const text = readFileSync(path.join(base, "mcq-expansion", f), "utf8"); const fm = parseFrontMatter(text);
    entries.push({ key: fm.set_id!, type: "questions", title: fm.title ?? f, domain: null, evidence_status: "partial", spec_level: null, clinically_reviewed: fm.clinically_reviewed === "true", sources: src(list(fm.sources)), issues: [], gaps: 0, required_sources: 0, hash: sha(text) });
  }
  const sk = loadSkillDrafts(root); const skKnown = loadKnownSources(root);
  for (const d of sk) entries.push({ key: d.skill_id, type: "skills", title: d.title, domain: d.category, evidence_status: d.evidence_status, spec_level: null, clinically_reviewed: d.clinically_reviewed, sources: src(d.sources.map((s) => s.id)), issues: validateSkillDraft(d, skKnown).map(({ rule, message }) => ({ rule, message })), gaps: d.gaps.length, required_sources: 0, hash: sha(JSON.stringify(d)) });
  const meds = loadMedicationDrafts(root); const plan = loadMedicationPlan(root); const mKnown = new Set([...loadMedicationLabels(root), ...loadGuidelineSources(root), "S-FDA-PUMP", "S-AHRQ-TS"]);
  for (const d of meds) entries.push({ key: d.med_id, type: "medications", title: d.name, domain: d.category, evidence_status: d.evidence_status, spec_level: null, clinically_reviewed: d.clinically_reviewed || d.pharmacist_reviewed, sources: src(d.sources.map((s) => s.id)), issues: validateMedicationDraft(d, mKnown, plan).map(({ rule, message }) => ({ rule, message })), gaps: d.gaps.length, required_sources: 0, hash: sha(JSON.stringify(d)) });
  const scKnown = loadScenarioKnownSources(root);
  for (const d of loadScenarioDrafts(root)) entries.push({ key: d.scenario_id, type: "cases", title: d.title, domain: d.domain, evidence_status: d.evidence_status, spec_level: d.spec_level, clinically_reviewed: d.clinically_reviewed, sources: src(d.sources.map((s) => s.id)), issues: validateScenarioDraft(d, scKnown).map(({ rule, message }) => ({ rule, message })), gaps: d.gaps.length, required_sources: d.required_sources.length, hash: sha(JSON.stringify(d)) });
  for (const d of loadEquipmentDrafts(root)) entries.push({ key: d.equipment_id, type: "equipment", title: d.title, domain: d.category, evidence_status: d.evidence_status, spec_level: null, clinically_reviewed: d.clinically_reviewed, sources: src(d.sources.map((s) => s.id)), issues: validateEquipmentDraft(d, scKnown).map(({ rule, message }) => ({ rule, message })), gaps: d.gaps.length, required_sources: d.required_sources.length, hash: sha(JSON.stringify(d)) });
  for (const d of loadPracticeDrafts(root)) entries.push({ key: d.practice_id, type: "practice", title: d.title, domain: d.area, evidence_status: d.evidence_status, spec_level: d.kind, clinically_reviewed: d.clinically_reviewed, sources: src(d.sources.map((x) => x.id)), issues: validatePracticeDraft(d, scKnown).map(({ rule, message }) => ({ rule, message })), gaps: d.gaps.length, required_sources: d.required_sources.length, hash: sha(JSON.stringify(d)) });
  return { note: "Metadata only (no draft body text). Generated by scripts/build-draft-index.ts. None of these drafts is reviewed, imported or published.", entries };
}

export function updateHistory(index: DraftIndex, prev: DraftHistory | null, recorded: string): DraftHistory {
  const entries: Record<string, HistoryEntry[]> = JSON.parse(JSON.stringify(prev?.entries ?? {}));
  for (const e of index.entries) {
    const h = entries[e.key] ?? (entries[e.key] = []);
    if (h.at(-1)?.hash !== e.hash) h.push({ hash: e.hash, recorded, evidence_status: e.evidence_status, sources: e.sources.map((s) => s.id), gaps: e.gaps, required_sources: e.required_sources, issues: e.issues.length });
  }
  return { note: "Snapshots begin in Phase 11 (earlier history is in git). A snapshot is added only when a draft's content hash changes.", entries };
}

export const INDEX_PATH = "src/content/draft-index.json", HISTORY_PATH = "src/content/draft-history.json";
if (process.argv[1]?.endsWith("build-draft-index.ts")) {
  const index = buildDraftIndex();
  const prev = existsSync(HISTORY_PATH) ? (JSON.parse(readFileSync(HISTORY_PATH, "utf8")) as DraftHistory) : null;
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 1) + "\n");
  writeFileSync(HISTORY_PATH, JSON.stringify(updateHistory(index, prev, process.env.DRAFT_HISTORY_DATE ?? new Date().toISOString().slice(0, 10)), null, 1) + "\n");
  console.log(`wrote ${INDEX_PATH} (${index.entries.length} drafts) and ${HISTORY_PATH}`);
}
