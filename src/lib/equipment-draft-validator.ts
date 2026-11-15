// Rules for DRAFT equipment-learning specifications (content/drafts/equipment). Drafts stay outside the learner-facing app.
import { EQUIPMENT_CATEGORIES } from "@/lib/equipment/types";

export type EquipmentIssue = { rule: string; message: string };
type Support = "sourced" | "partial" | "local_protocol";
interface Concept { text: string; support: Support; sources: string[]; section: string }
export interface EquipmentDraft {
  equipment_id: string; number: number; title: string; category: string; status: string; origin: string; clinically_reviewed: boolean; clinical_reviewers: string[]; banner: string;
  device_neutral: boolean; manufacturer_documents: { source_id: string; device: string }[]; related_skill: string; evidence_status: string;
  diagram: { kind: string; original_graphic: boolean; parts: string[]; alt_text_needed: boolean };
  parameters: { name: string; explanation: string | null; support: string; sources?: string[] }[];
  safety_concepts: Concept[]; monitoring_concepts: Concept[]; escalation_concepts: Concept[];
  sources: { id: string; read: string; use: string }[]; required_sources: string[]; gaps: string[]; permissions: string[];
}
const dose = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b|\b\d+(\.\d+)?\s?(mcg|µg|mg|units?|mEq)\b/i;
const verdict = /\b(you are competent|passed|certified|approved by|reviewed by|signed off by|endorsed by)\b/i;
const proprietary = /\b(reproduced from|screenshot of|alarm table from|copied from the manual)\b/i;

export function validateEquipmentDraft(d: EquipmentDraft, known: Set<string>): EquipmentIssue[] {
  const out: EquipmentIssue[] = [];
  const id = d.equipment_id ?? "?";
  const add = (rule: string, message: string) => out.push({ rule, message });
  if (!/^EQ-0[1-8]$/.test(id) || id !== `EQ-0${d.number}`) add("id", `${id}: equipment_id must be EQ-01..EQ-08 matching its number`);
  if (!(EQUIPMENT_CATEGORIES as readonly string[])[d.number - 1] || EQUIPMENT_CATEGORIES[d.number - 1] !== d.category) add("category", `${id}: category must be ${EQUIPMENT_CATEGORIES[d.number - 1]} (the initial device list, in order)`);
  if (d.status !== "DRAFT" || d.origin !== "ai_generated") add("status", `${id}: status must be DRAFT and origin ai_generated`);
  if (d.clinically_reviewed !== false || (d.clinical_reviewers ?? []).length) add("review", `${id}: must not claim clinical review`);
  if (!/NOT clinically reviewed/.test(d.banner ?? "") || !/never imported/i.test(d.banner ?? "")) add("banner", `${id}: banner must say NOT clinically reviewed and never imported`);
  if (!["partial", "unsupported"].includes(d.evidence_status)) add("evidence", `${id}: evidence_status may only be partial or unsupported`);
  if (!/^SK-\d\d$/.test(d.related_skill ?? "")) add("related", `${id}: related_skill required`);
  if (!d.diagram?.original_graphic || !d.diagram.alt_text_needed || (d.diagram.parts ?? []).length < 3) add("diagram", `${id}: diagram must be an original graphic with at least 3 parts and a text alternative to be written`);
  if (!d.required_sources?.length || !d.gaps?.length || !d.permissions?.length) add("gaps", `${id}: required_sources, gaps and permissions must be declared`);
  const listed = new Set((d.sources ?? []).map((s) => s.id));
  for (const s of d.sources ?? []) if (!known.has(s.id)) add("source", `${id}: source ${s.id} is not registered`);
  const mfrIds = new Set((d.manufacturer_documents ?? []).map((m) => m.source_id));
  for (const m of d.manufacturer_documents ?? []) if (!/model|device|family|manual|instructions/i.test(m.device) || !/only/i.test(m.device)) add("manufacturer", `${id}: ${m.source_id} must name the device/version and say the statements apply to it only`);
  if (/HAMILTON|DRAEGER|PRISM|BAXTER/i.test([...listed].join(" ")) && ![...listed].some((s) => mfrIds.has(s))) add("manufacturer", `${id}: manufacturer sources must be declared in manufacturer_documents`);
  if (mfrIds.size > 0 && d.device_neutral) add("manufacturer", `${id}: a draft using manufacturer sources cannot claim to be device-neutral`);
  for (const p of d.parameters ?? []) {
    if (p.explanation !== null && p.support === "needs_source") add("parameter", `${id}: ${p.name} has an explanation but no source support`);
    if (p.explanation !== null) {
      if (!["sourced", "partial"].includes(p.support) || !(p.sources ?? []).length) add("parameter", `${id}: ${p.name} needs sourced or partial support with at least one source`);
      for (const sid of p.sources ?? []) if (!listed.has(sid)) add("parameter", `${id}: ${p.name} cites ${sid} which is not listed in sources`);
      if (dose.test(p.explanation)) add("dosing", `${id}: ${p.name} explanation must not contain doses or rates`);
      if (verdict.test(p.explanation)) add("verdict", `${id}: ${p.name} explanation must not claim approval or review`);
    }
    if (p.explanation === null && p.support !== "needs_source") add("parameter", `${id}: ${p.name} is unexplained and must be marked needs_source`);
  }
  for (const [where, list] of [["safety", d.safety_concepts], ["monitoring", d.monitoring_concepts], ["escalation", d.escalation_concepts]] as const) {
    for (const c of list ?? []) {
      if (dose.test(c.text)) add("dosing", `${id} ${where}: dose or rate content is not allowed`);
      if (verdict.test(c.text)) add("verdict", `${id} ${where}: must not claim approval or review`);
      if (proprietary.test(c.text)) add("proprietary", `${id} ${where}: must not reproduce proprietary material`);
      for (const s of c.sources ?? []) if (!listed.has(s)) add("source", `${id} ${where}: cites ${s} which is not listed in sources`);
      if (c.support !== "local_protocol" && !(c.sources ?? []).length) add("sourced", `${id} ${where}: a ${c.support} statement needs a source`);
      if (c.support === "sourced" && !(c.sources ?? []).some((s) => (d.sources ?? []).find((x) => x.id === s)?.read === "full")) add("sourced", `${id} ${where}: a sourced statement must cite a source read in full`);
    }
  }
  if (!d.safety_concepts?.length && d.evidence_status !== "unsupported") add("evidence", `${id}: without safety statements the draft must be marked unsupported`);
  return out;
}
export function validateEquipmentSet(drafts: EquipmentDraft[]): EquipmentIssue[] {
  const nums = drafts.map((d) => d.number).sort((a, b) => a - b).join(",");
  return nums === "1,2,3,4,5,6,7,8" ? [] : [{ rule: "scope", message: `drafts must cover equipment 1..8 exactly once (found ${nums})` }];
}
