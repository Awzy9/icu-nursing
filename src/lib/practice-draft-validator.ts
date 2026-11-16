// Rules for DRAFT practical-education exercises (content/drafts/practice). Drafts stay outside the learner-facing app: the practice pages only serve
// SYN-PX-nnn fixtures, whose schema requires synthetic: true.
import { PRACTICE_AREAS, PRACTICE_KINDS } from "@icu/schemas/practice";

export type PracticeIssue = { rule: string; message: string };
type Support = "sourced" | "partial" | "local_protocol";
interface Traced { support: Support; sources: string[]; text?: string; why?: string; feedback?: string }
export interface PracticeDraft {
  practice_id: string; number: number; title: string; area: string; kind: string; status: string; origin: string; clinically_reviewed: boolean; clinical_reviewers: unknown[]; banner: string;
  fictional: boolean; evidence_status: string; arabic_status: string; objectives: string[]; setup: string; sources: { id: string; read: "full" | "partial" | "not_read"; use: string }[];
  required_sources: string[]; gaps: string[]; permissions: string[]; self_assessment_only?: boolean;
  categories?: { id: string; label: string }[]; items?: (Traced & { id: string; category?: string })[]; prompt?: string; lines?: (Traced & { id: string; problem: boolean })[];
  steps?: (Traced & { id: string })[]; stem?: string; options?: (Traced & { id: string; correct: boolean })[]; skills?: string[]; levels?: string[];
}
const dose = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b|\b\d+(\.\d+)?\s?(mcg|µg|mg|units?|mEq)\b/i;
const verdict = /\b(you are competent|passed|certified|certificate|validated (clinical )?(standard|competency)|approved by|reviewed by|signed off by|endorsed by|verified competen)/i;
const ITEM = ["sourced", "partial", "local_protocol"];

export function validatePracticeDraft(d: PracticeDraft, known: Set<string>): PracticeIssue[] {
  const out: PracticeIssue[] = [];
  const id = d.practice_id ?? "?";
  const add = (rule: string, message: string) => out.push({ rule, message });
  if (!/^PX-(0[1-9]|1[0-2])$/.test(id) || id !== `PX-${String(d.number).padStart(2, "0")}`) add("id", `${id}: practice_id must be PX-01..PX-12 matching its number (never a SYN- fixture code)`);
  if (!(PRACTICE_AREAS as readonly string[]).includes(d.area)) add("area", `${id}: unknown area ${d.area}`);
  if (!(PRACTICE_KINDS as readonly string[]).includes(d.kind)) add("kind", `${id}: unknown kind ${d.kind}`);
  if (d.status !== "DRAFT" || d.origin !== "ai_generated") add("status", `${id}: status must be DRAFT and origin ai_generated`);
  if (d.clinically_reviewed !== false || (d.clinical_reviewers ?? []).length) add("review", `${id}: must not claim clinical review`);
  if (!/NOT clinically reviewed/.test(d.banner ?? "") || !/never imported/i.test(d.banner ?? "")) add("banner", `${id}: banner must say NOT clinically reviewed and never imported`);
  if (d.fictional !== true) add("fictional", `${id}: examples must be fictional`);
  if (!["partial", "unsupported"].includes(d.evidence_status)) add("evidence", `${id}: evidence_status may only be partial or unsupported`);
  if (!d.objectives?.length || !d.setup) add("shape", `${id}: objectives and a setup are required`);
  if (!d.gaps?.length || !d.permissions?.length || !d.required_sources?.length) add("gaps", `${id}: gaps, permissions and required_sources must be declared`);
  if (d.area === "competency" && d.self_assessment_only !== true) add("competency", `${id}: a competency exercise must be self_assessment_only (no verification, scoring or certificates)`);
  if (d.area !== "competency" && d.self_assessment_only) add("competency", `${id}: only competency exercises may be self-assessment`);
  const listed = new Map((d.sources ?? []).map((s) => [s.id, s.read]));
  for (const s of d.sources ?? []) if (!known.has(s.id)) add("source", `${id}: source ${s.id} is not registered`);
  const scan = (where: string, t: string | undefined) => { if (!t) return; if (dose.test(t)) add("dosing", `${id} ${where}: dose or rate content is not allowed`); if (verdict.test(t)) add("verdict", `${id} ${where}: must not claim approval, review, certification or competence`); };
  for (const t of [d.setup, d.title, d.prompt, d.stem, ...(d.objectives ?? [])]) scan("text", t);
  const traced = (list: Traced[] | undefined, where: string, needSource = true) => {
    for (const [i, c] of (list ?? []).entries()) {
      const w = `${where}[${i}]`;
      if (!ITEM.includes(c.support)) add("support", `${id} ${w}: bad support ${c.support}`);
      for (const s of c.sources ?? []) if (!listed.has(s)) add("source", `${id} ${w}: cites ${s} which is not listed in sources`);
      if (needSource && c.support !== "local_protocol" && !(c.sources ?? []).length) add("sourced", `${id} ${w}: ${c.support} statements need a source`);
      if (c.support === "sourced" && !(c.sources ?? []).some((s) => listed.get(s) === "full")) add("sourced", `${id} ${w}: a 'sourced' statement must cite a source read in full`);
      for (const f of [c.text, c.why, c.feedback]) scan(w, f);
    }
  };
  const k = d.kind;
  if (k === "classify") {
    const cats = new Set((d.categories ?? []).map((c) => c.id));
    if (cats.size < 2) add("shape", `${id}: classify needs at least two categories`);
    if ((d.items ?? []).length < 3) add("shape", `${id}: classify needs at least three items`);
    for (const i of d.items ?? []) if (!cats.has(i.category ?? "")) add("shape", `${id}: item ${i.id} names an unknown category`);
    for (const c of cats) if (!(d.items ?? []).some((i) => i.category === c)) add("shape", `${id}: category ${c} has no item`);
    traced(d.items, "item");
    if (d.area === "sbar" && !["s", "b", "a", "r"].every((c) => cats.has(c))) add("sbar", `${id}: an SBAR exercise needs S, B, A and R categories`);
  } else if (k === "spot") {
    if (!(d.lines ?? []).some((l) => l.problem) || !(d.lines ?? []).some((l) => !l.problem)) add("shape", `${id}: spot needs a problem line and a sound line`);
    traced(d.lines, "line");
  } else if (k === "sequence") {
    if ((d.steps ?? []).length < 3) add("shape", `${id}: sequence needs at least three steps`);
    traced(d.steps, "step");
  } else if (k === "choice") {
    if ((d.options ?? []).filter((o) => o.correct).length !== 1 || (d.options ?? []).length < 3) add("shape", `${id}: choice needs 3 or 4 options with exactly one correct`);
    traced(d.options, "option");
  } else if (k === "checklist") {
    if (!(d.items ?? []).length && !(d.skills ?? []).length) add("shape", `${id}: a checklist needs items or a skills list`);
    for (const s of d.skills ?? []) if (!/^SK-(0[1-9]|1\d|2[0-5])$/.test(s)) add("related", `${id}: bad skill reference ${s}`);
    if ((d.items ?? []).length) traced(d.items, "item");
    else if (!(d.levels ?? []).length) add("shape", `${id}: a skills map needs levels`);
  }
  if ((d.sources ?? []).length === 0 && !(k === "checklist" && (d.skills ?? []).length)) add("source", `${id}: at least one source is required`);
  return out;
}
export function validatePracticeSet(drafts: PracticeDraft[]): PracticeIssue[] {
  const nums = drafts.map((x) => x.number).sort((a, b) => a - b).join(",");
  const want = Array.from({ length: 12 }, (_, i) => i + 1).join(",");
  const issues: PracticeIssue[] = nums === want ? [] : [{ rule: "scope", message: `practice drafts must be PX-01..PX-12 exactly once (found ${nums})` }];
  for (const a of PRACTICE_AREAS) if (!drafts.some((x) => x.area === a)) issues.push({ rule: "scope", message: `no draft covers the area ${a}` });
  return issues;
}
