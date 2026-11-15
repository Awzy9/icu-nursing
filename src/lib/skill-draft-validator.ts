// Validates the Phase 7 clinical skill drafts (content/drafts/skills/SK-*.json). Drafts are never learner-facing and must never claim review,
// approval, validation or competency. Every statement must be traceable, and unsupported areas must be declared as gaps instead of being filled.
import { CHECKLIST_PHASES, SKILL_CATEGORIES, SKILL_SECTIONS } from "@/lib/skills/types";

export type SkillDraftIssue = { rule: string; message: string };
type Support = "sourced" | "partial" | "local_protocol";
export interface DraftItem { text: string; support: Support; sources: string[] }
export interface SkillDraft {
  skill_id: string; number: number; title: string; category: string; status: string; origin: string; clinically_reviewed: boolean; clinical_reviewers: unknown[];
  banner: string; evidence_status: string; license_status: string; topic_drafts: string[];
  sources: { id: string; read: "full" | "partial" | "not_read"; use: string }[];
  objectives: string[]; prerequisites: string[];
  sections: Record<string, { support: string; items: DraftItem[] }>;
  checklist: { phase: string; text: string; critical: boolean; support: Support; sources: string[] }[];
  gaps: string[]; permissions: string[]; references: { id: string; url: string; accessed: string }[];
}

/** The authoritative scope: the 25 skills of the original master prompt (Part 6), in order. */
export const MASTER_SKILLS = [
  "Arterial line care", "Central venous catheter care", "Peripheral IV care", "Endotracheal tube care", "Tracheostomy care", "suctioning", "Ventilator safety checks",
  "Oxygen delivery devices", "Blood transfusion", "Enteral feeding", "Nasogastric tube care", "Urinary catheter care", "Chest drain monitoring", "Pressure injury prevention",
  "Patient repositioning", "Safe patient mobilization", "CRRT circuit monitoring", "ECG monitoring", "Defibrillator safety", "patient transport", "Infection prevention",
  "infusion pump safety", "Sedation assessment", "Neurological assessment", "Pain assessment",
] as const;

const dose = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b/i;
const verdict = /\b(you are competent|competence (achieved|verified|confirmed)|passed|certified|certificate (issued|awarded)|validated (clinical )?(standard|competency)|approved competency)\b/i;
const approval = /\b(approved by|reviewed by|signed off by|endorsed by)\b/i;
const ITEM_SUPPORT = ["sourced", "partial", "local_protocol"];
const SECTION_SUPPORT = ["full", "partial", "local_protocol", "permission_required"];

export function validateSkillDraft(d: SkillDraft, known: Map<string, "full" | "partial" | "not_read" | "registered">): SkillDraftIssue[] {
  const out: SkillDraftIssue[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });
  const id = d.skill_id ?? "?";
  if (!/^SK-(0[1-9]|1\d|2[0-5])$/.test(id)) add("id", `${id}: skill_id must be SK-01..SK-25`);
  const master = MASTER_SKILLS[(d.number ?? 0) - 1];
  if (!master || !d.title?.toLowerCase().includes(master.toLowerCase())) add("scope", `${id}: title "${d.title}" does not match master skill #${d.number} "${master}"`);
  if (d.status !== "DRAFT") add("status", `${id}: status must be DRAFT`);
  if (d.origin !== "ai_generated") add("origin", `${id}: origin must be ai_generated`);
  if (d.clinically_reviewed !== false) add("review", `${id}: clinically_reviewed must be false`);
  if ((d.clinical_reviewers ?? []).length > 0) add("review", `${id}: clinical_reviewers must be empty`);
  if (!/NOT clinically reviewed/.test(d.banner ?? "") || !/not an approved competency assessment/i.test(d.banner ?? "")) add("banner", `${id}: banner must say NOT clinically reviewed and not an approved competency assessment`);
  if (!["partial", "unsupported"].includes(d.evidence_status)) add("evidence", `${id}: a draft's evidence_status may only be partial or unsupported (never supported/unassessed)`);
  if (["original", "cleared"].includes(d.license_status)) add("licence", `${id}: a draft cannot claim cleared or original licensing`);
  if (!(SKILL_CATEGORIES as readonly string[]).includes(d.category)) add("category", `${id}: unknown category ${d.category}`);
  if (!d.title || d.title.length < 3 || d.title.length > 200) add("shape", `${id}: title length`);
  if (!d.objectives?.length || d.objectives.length > 12) add("shape", `${id}: 1-12 objectives required`);
  if (!d.gaps?.length) add("gaps", `${id}: every draft must declare its evidence gaps`);
  if (!d.permissions?.length) add("permissions", `${id}: every draft must declare permission/licensing notes`);

  const listed = new Map((d.sources ?? []).map((s) => [s.id, s.read]));
  for (const s of d.sources ?? []) {
    if (!known.has(s.id)) add("source", `${id}: source ${s.id} is not in sources/source_register.csv or NEW_SOURCES.csv`);
    if (!["full", "partial", "not_read"].includes(s.read)) add("source", `${id}: source ${s.id} needs read = full|partial|not_read`);
  }
  const cited = (ids: string[], where: string, support: string) => {
    for (const s of ids) if (!listed.has(s)) add("source", `${id} ${where}: cites ${s} which is not listed in the draft's sources`);
    if (support === "sourced" && !ids.some((s) => listed.get(s) === "full")) add("sourced", `${id} ${where}: a 'sourced' statement must cite at least one source that was read in full text`);
    if ((support === "sourced" || support === "partial") && ids.length === 0) add("sourced", `${id} ${where}: ${support} statements need a source`);
    if (support === "local_protocol" && ids.some((s) => listed.get(s) === "not_read")) add("sourced", `${id} ${where}: cites an unread source`);
  };

  let anySupported = false;
  for (const [key, s] of Object.entries(d.sections ?? {})) {
    if (!(SKILL_SECTIONS as readonly string[]).includes(key)) { add("section", `${id}: unknown section ${key}`); continue; }
    if (!SECTION_SUPPORT.includes(s.support)) add("section", `${id}.${key}: bad support ${s.support}`);
    if (!s.items?.length) add("section", `${id}.${key}: empty section; omit it instead`);
    if (s.support === "full") {
      const ok = s.items.every((x) => x.support === "sourced" || x.support === "local_protocol") && s.items.some((x) => x.support === "sourced");
      if (!ok) add("support", `${id}.${key}: 'full' requires every statement to be sourced (or an explicit local-protocol referral)`);
    }
    for (const [i, x] of (s.items ?? []).entries()) {
      if (!ITEM_SUPPORT.includes(x.support)) add("support", `${id}.${key}[${i}]: bad support ${x.support}`);
      cited(x.sources ?? [], `${key}[${i}]`, x.support);
      if (x.support !== "local_protocol") anySupported = true;
      if (x.support === "local_protocol" && !/\b(follow|follows|use|unit|local|policy|protocol|manufacturer|competency|set by|varies|decision|not (drafted|reproduced|covered|given)|are not|is not|no source)\b/i.test(x.text)) add("local", `${id}.${key}[${i}]: a local-protocol statement must refer the learner to local policy or the manufacturer, not invent a step`);
      scan(`${id}.${key}[${i}]`, x.text);
    }
  }
  if (d.evidence_status === "unsupported" && anySupported && d.sources.every((s) => s.read === "not_read")) add("evidence", `${id}: unsupported draft contains sourced statements from unread sources`);
  if (d.evidence_status === "unsupported" && Object.values(d.sections ?? {}).some((s) => s.items.some((x) => x.support === "sourced"))) add("evidence", `${id}: an unsupported skill cannot contain 'sourced' statements`);

  if ((d.checklist ?? []).length < 3) add("checklist", `${id}: at least 3 checklist items`);
  if (!(d.checklist ?? []).some((c) => c.critical)) add("checklist", `${id}: at least one critical item`);
  for (const [i, c] of (d.checklist ?? []).entries()) {
    if (!(CHECKLIST_PHASES as readonly string[]).includes(c.phase)) add("checklist", `${id}.checklist[${i}]: bad phase ${c.phase}`);
    if (!ITEM_SUPPORT.includes(c.support)) add("checklist", `${id}.checklist[${i}]: bad support ${c.support}`);
    if (c.text.length < 3 || c.text.length > 400) add("checklist", `${id}.checklist[${i}]: text must be 3-400 characters`);
    cited(c.sources ?? [], `checklist[${i}]`, c.support);
    scan(`${id}.checklist[${i}]`, c.text);
  }
  for (const [i, t] of [...(d.objectives ?? []), ...(d.prerequisites ?? []), ...(d.gaps ?? [])].entries()) scan(`${id}.text[${i}]`, t);
  for (const r of d.references ?? []) if (!/^https?:\/\//.test(r.url) || !/^\d{4}-\d{2}-\d{2}$/.test(r.accessed)) add("refs", `${id}: reference ${r.id} needs a URL and an access date`);
  if ((d.references ?? []).length !== (d.sources ?? []).length) add("refs", `${id}: references must be regenerated (run build_evidence.py)`);
  return out;

  function scan(where: string, text: string) {
    if (dose.test(text)) add("dosing", `${where}: dose/rate pattern; not allowed without pharmacist review`);
    if (verdict.test(text)) add("verdict", `${where}: must not claim competence, validation, certification or review`);
    if (approval.test(text)) add("review", `${where}: must not claim approval or review`);
  }
}

/** Cross-draft checks: exactly the 25 master skills, once each. */
export function validateSkillSet(drafts: SkillDraft[]): SkillDraftIssue[] {
  const out: SkillDraftIssue[] = [];
  const nums = drafts.map((d) => d.number).sort((a, b) => a - b);
  if (nums.join(",") !== Array.from({ length: 25 }, (_, i) => i + 1).join(",")) out.push({ rule: "scope", message: `drafts must cover skills 1..25 exactly once (found ${nums.join(",")})` });
  return out;
}
