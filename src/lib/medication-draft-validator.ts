// Validates the Phase 8 clinical medication drafts (content/drafts/medications/MD-*.json). Drafts are never learner-facing. A medication draft is a
// nursing reference WITHOUT dosing: it may never contain a dose, concentration, infusion rate, titration or compatibility instruction, and it may
// never claim clinical, pharmacist or any other review. The future pharmacist workflow is designed but inactive: pharmacist_reviewed must stay false.
import { MEDICATION_CATEGORIES, MEDICATION_SECTIONS, MONITORING_KINDS } from "@/lib/medications/types";
import { medicationTextViolation } from "@/lib/medications/no-dosing";

export type MedicationDraftIssue = { rule: string; message: string };
type Support = "sourced" | "partial" | "local_protocol";
export interface MedItem { text: string; support: Support; sources: string[] }
export interface MedicationDraft {
  med_id: string; number: number; name: string; drug_class: string; category: string; high_alert: boolean; high_alert_note: string; summary: string; batch: number;
  status: string; origin: string; clinically_reviewed: boolean; pharmacist_reviewed: boolean; clinical_reviewers: unknown[]; banner: string;
  evidence_status: string; license_status: string; label_source: string; label_ref: string; jurisdiction_note: string;
  sources: { id: string; read: "full" | "partial" | "not_read"; use: string }[];
  sections: Record<string, { support: string; items: MedItem[] }>;
  monitoring: { kind: string; text: string; critical: boolean; support: Support; sources: string[] }[];
  gaps: string[]; permissions: string[];
}
export interface PlanRow { number: number; name: string; category: string; batch: number }

const verdict = /\b(you are competent|passed|certified|certificate (issued|awarded)|validated (clinical )?(standard|competency)|pharmacist[- ](approved|verified|checked|reviewed by)|approved by|reviewed by|signed off by|endorsed by)\b/i;
const ITEM_SUPPORT = ["sourced", "partial", "local_protocol"];
const SECTION_SUPPORT = ["full", "partial", "local_protocol", "permission_required"];
const REQUIRED = ["nursing_responsibilities", "safety_alerts", "escalation", "institution_preparation", "institution_dosing"];

export function validateMedicationDraft(d: MedicationDraft, known: Set<string>, plan: Map<number, PlanRow>): MedicationDraftIssue[] {
  const out: MedicationDraftIssue[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });
  const id = d.med_id ?? "?";
  const row = plan.get(d.number);
  if (!/^MD-(0[1-9]|[1-4]\d|50)$/.test(id)) add("id", `${id}: med_id must be MD-01..MD-50`);
  if (!row) add("scope", `${id}: number ${d.number} is not in PLAN.csv`);
  else {
    if (!d.name?.toLowerCase().includes(row.name.toLowerCase())) add("scope", `${id}: name "${d.name}" does not match plan entry "${row.name}"`);
    if (d.category !== row.category) add("scope", `${id}: category ${d.category} differs from the plan (${row.category})`);
    if (d.batch !== row.batch) add("scope", `${id}: batch ${d.batch} differs from the plan (${row.batch})`);
  }
  if (d.status !== "DRAFT") add("status", `${id}: status must be DRAFT`);
  if (d.origin !== "ai_generated") add("origin", `${id}: origin must be ai_generated`);
  if (d.clinically_reviewed !== false) add("review", `${id}: clinically_reviewed must be false`);
  if (d.pharmacist_reviewed !== false) add("review", `${id}: pharmacist_reviewed must be false (the pharmacist workflow is designed, not active)`);
  if ((d.clinical_reviewers ?? []).length > 0) add("review", `${id}: clinical_reviewers must be empty`);
  if (!/NOT clinically reviewed/.test(d.banner ?? "") || !/NOT pharmacist reviewed/.test(d.banner ?? "")) add("banner", `${id}: banner must say NOT clinically reviewed and NOT pharmacist reviewed`);
  if (!["partial", "unsupported"].includes(d.evidence_status)) add("evidence", `${id}: a draft's evidence_status may only be partial or unsupported`);
  if (["original", "cleared"].includes(d.license_status)) add("licence", `${id}: a draft cannot claim cleared or original licensing`);
  if (!(MEDICATION_CATEGORIES as readonly string[]).includes(d.category)) add("category", `${id}: unknown category ${d.category}`);
  if (!d.label_source || !d.label_ref || !known.has(d.label_ref)) add("label", `${id}: a regulator label source recorded in LABEL_SOURCES.csv is required`);
  if (!d.jurisdiction_note || !/only/i.test(d.jurisdiction_note)) add("jurisdiction", `${id}: a jurisdiction limitation note is required ("... label only ...")`);
  if (typeof d.high_alert !== "boolean" || !d.high_alert_note) add("high_alert", `${id}: high_alert needs an explanatory note stating its basis or that it was not confirmed`);
  if (!d.gaps?.length) add("gaps", `${id}: declare evidence gaps`);
  if (!d.permissions?.length) add("permissions", `${id}: declare permission/licensing notes`);
  for (const k of ["name", "drug_class", "summary"] as const) scan(`${id}.${k}`, d[k] ?? "");

  const listed = new Map((d.sources ?? []).map((s) => [s.id, s.read]));
  if (listed.get(d.label_ref) !== "full") add("label", `${id}: the label source must be listed in sources with read = full`);
  const cited = (ids: string[], where: string, support: string) => {
    for (const s of ids) if (!listed.has(s)) add("source", `${id} ${where}: cites ${s} which is not listed in the draft's sources`);
    if (support === "sourced" && !ids.some((s) => listed.get(s) === "full")) add("sourced", `${id} ${where}: a 'sourced' statement must cite a source read in full`);
    if ((support === "sourced" || support === "partial") && ids.length === 0) add("sourced", `${id} ${where}: ${support} statements need a source`);
  };
  for (const r of REQUIRED) if (!d.sections?.[r]) add("section", `${id}: required section ${r} is missing`);
  for (const r of ["institution_preparation", "institution_dosing"]) {
    const s = d.sections?.[r];
    if (s && !(s.support === "local_protocol" && s.items.every((x) => x.support === "local_protocol" && /institution-specific|follow/i.test(x.text)))) add("institution", `${id}.${r}: must be a local-protocol referral only`);
  }
  for (const [key, s] of Object.entries(d.sections ?? {})) {
    if (!(MEDICATION_SECTIONS as readonly string[]).includes(key)) { add("section", `${id}: unknown section ${key}`); continue; }
    if (!SECTION_SUPPORT.includes(s.support)) add("section", `${id}.${key}: bad support ${s.support}`);
    if (!s.items?.length) add("section", `${id}.${key}: empty section; omit it`);
    if (s.support === "full" && !(s.items.every((x) => x.support === "sourced" || x.support === "local_protocol") && s.items.some((x) => x.support === "sourced"))) add("support", `${id}.${key}: 'full' requires every statement sourced`);
    for (const [i, x] of (s.items ?? []).entries()) {
      if (!ITEM_SUPPORT.includes(x.support)) add("support", `${id}.${key}[${i}]: bad support ${x.support}`);
      cited(x.sources ?? [], `${key}[${i}]`, x.support);
      if (x.support === "local_protocol" && !/\b(follow|follows|unit|local|policy|protocol|institution|prescriber|pharmacy|standard)\b/i.test(x.text)) add("local", `${id}.${key}[${i}]: a local-protocol statement must refer to policy, protocol or the prescriber`);
      scan(`${id}.${key}[${i}]`, x.text);
    }
  }
  if ((d.monitoring ?? []).length < 3) add("monitoring", `${id}: at least 3 monitoring items`);
  if (!(d.monitoring ?? []).some((m) => m.critical)) add("monitoring", `${id}: at least one critical monitoring item`);
  for (const [i, m] of (d.monitoring ?? []).entries()) {
    if (!(MONITORING_KINDS as readonly string[]).includes(m.kind)) add("monitoring", `${id}.monitoring[${i}]: bad kind ${m.kind}`);
    if (m.text.length < 3 || m.text.length > 400) add("monitoring", `${id}.monitoring[${i}]: text must be 3-400 characters`);
    cited(m.sources ?? [], `monitoring[${i}]`, m.support);
    scan(`${id}.monitoring[${i}]`, m.text);
  }
  return out;

  function scan(where: string, text: string) {
    const v = medicationTextViolation(text);
    if (v) add("dosing", `${where}: contains ${v}; not allowed in this library`);
    if (verdict.test(text)) add("verdict", `${where}: must not claim approval, review or competence`);
  }
}

/** Set checks: unique numbers, at most 10 drafts per batch, and the plan covers exactly 50 medications. */
export function validateMedicationSet(drafts: MedicationDraft[], plan: Map<number, PlanRow>): MedicationDraftIssue[] {
  const out: MedicationDraftIssue[] = [];
  if (plan.size !== 50) out.push({ rule: "scope", message: `PLAN.csv must list exactly 50 medications (found ${plan.size})` });
  const nums = drafts.map((d) => d.number);
  if (new Set(nums).size !== nums.length) out.push({ rule: "scope", message: "duplicate medication numbers" });
  const perBatch = new Map<number, number>();
  for (const d of drafts) perBatch.set(d.batch, (perBatch.get(d.batch) ?? 0) + 1);
  for (const [b, n] of perBatch) if (n > 10) out.push({ rule: "batch", message: `batch ${b} has ${n} drafts; the limit is 10` });
  return out;
}
