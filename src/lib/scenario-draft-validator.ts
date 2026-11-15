// Validates the DRAFT clinical simulation scenarios (content/drafts/scenarios/SC-*.json): the authoring format for the ORIGINAL 20 scenarios of the master plan.
// A draft is either a "decision_graph" (changing observations, branching decisions with consequences, scope-of-practice labels, a structured debrief, and a
// source trace on every option) or an "outline" (objectives, the nursing actions the sources support, and the sources still needed). Drafts are never
// importable: the case engine only knows synthetic fixtures, and the same structure rules as the database (case_structure_errors) are applied here.
import { CASE_SCOPES } from "@/lib/cases/types";

export type ScenarioIssue = { rule: string; message: string };
type Support = "sourced" | "partial" | "local_protocol";
export interface ScOption { text: string; points: number; next: number | null; scope: string; feedback: string; consequence: string; support: Support; sources: string[] }
export interface ScObservation { key: string; label: string; value: number | string; unit?: string; low?: number; high?: number }
export interface ScStep { position: number; info: string; prompt: string; observations: ScObservation[]; options: ScOption[] }
export interface ScAction { text: string; scope: string; support: Support; sources: string[] }
export interface ScenarioDraft {
  scenario_id: string; number: number; title: string; status: string; origin: string; clinically_reviewed: boolean; clinical_reviewers: unknown[]; banner: string;
  fictional_patient: boolean; spec_level: "decision_graph" | "outline"; evidence_status: string; domain: string; difficulty: number;
  learning_objectives: string[]; related: { skills: string[]; medications: string[]; topic_drafts: string[] };
  sources: { id: string; read: "full" | "partial" | "not_read"; use: string }[]; gaps: string[]; permissions: string[]; required_sources: string[];
  setting?: string; steps?: ScStep[]; debrief?: { learning_points: string[]; links: { kind: string; code: string }[] };
  expected_actions?: ScAction[];
}

/** The original master plan's 20 scenarios (Part 8), in order. A draft whose number and title do not match this list is rejected. */
export const MASTER_SCENARIOS = [
  "Septic shock", "Cardiogenic shock", "Acute respiratory deterioration", "Ventilator alarm", "Sudden oxygen desaturation", "Accidental extubation", "Raised intracranial pressure",
  "Acute seizure", "Postoperative bleeding", "Hypoglycemia", "Severe hyperkalemia", "Acute arrhythmia", "Cardiac arrest", "Transfusion reaction", "CRRT circuit complication",
  "Acute hypotension", "Delirium and agitation", "Aspiration event", "Anaphylaxis", "Acute neurological deterioration",
] as const;

const dose = /\b\d+(\.\d+)?\s?(mcg|µg|mg|g|units?|mEq|mmol|mL)\s?(\/|per)\s?(kg|min|h|hr|hour|minute)\b|\b\d+(\.\d+)?\s?(mcg|µg|mg|units?|mEq)\b/i;
const verdict = /\b(you are competent|passed|certified|validated (clinical )?(standard|competency)|approved by|reviewed by|signed off by|endorsed by)\b/i;
const ITEM = ["sourced", "partial", "local_protocol"];
const KEY = /^[a-z][a-z0-9_]{1,30}$/;

export function validateScenarioDraft(d: ScenarioDraft, known: Set<string>): ScenarioIssue[] {
  const out: ScenarioIssue[] = [];
  const add = (rule: string, message: string) => out.push({ rule, message });
  const id = d.scenario_id ?? "?";
  const master = MASTER_SCENARIOS[(d.number ?? 0) - 1];
  if (!/^SC-(0[1-9]|1\d|20)$/.test(id) || id !== `SC-${String(d.number).padStart(2, "0")}`) add("id", `${id}: scenario_id must be SC-NN matching its number`);
  if (!master || d.title?.toLowerCase() !== master.toLowerCase()) add("scope", `${id}: scenario #${d.number} must be "${master}" (the original master list is neither replaced nor reordered), found "${d.title}"`);
  if (d.status !== "DRAFT") add("status", `${id}: status must be DRAFT`);
  if (d.origin !== "ai_generated") add("origin", `${id}: origin must be ai_generated`);
  if (d.clinically_reviewed !== false || (d.clinical_reviewers ?? []).length > 0) add("review", `${id}: must not claim clinical review`);
  if (!/NOT clinically reviewed/.test(d.banner ?? "") || !/never imported|not importable|never shown/i.test(d.banner ?? "")) add("banner", `${id}: banner must say NOT clinically reviewed and that the draft is never imported or shown`);
  if (d.fictional_patient !== true) add("fictional", `${id}: fictional_patient must be true (no real patient data)`);
  if (!["partial", "unsupported"].includes(d.evidence_status)) add("evidence", `${id}: evidence_status may only be partial or unsupported`);
  if (!["decision_graph", "outline"].includes(d.spec_level)) add("shape", `${id}: spec_level must be decision_graph or outline`);
  if (!d.learning_objectives?.length) add("shape", `${id}: learning objectives required`);
  if (!d.gaps?.length || !d.permissions?.length || !d.required_sources?.length) add("gaps", `${id}: gaps, permissions and required_sources must be declared`);
  for (const s of d.related?.skills ?? []) if (!/^SK-(0[1-9]|1\d|2[0-5])$/.test(s)) add("related", `${id}: bad skill reference ${s}`);
  for (const m of d.related?.medications ?? []) if (!/^MD-(0[1-9]|[1-4]\d|50)$/.test(m)) add("related", `${id}: bad medication reference ${m}`);
  const listed = new Map((d.sources ?? []).map((s) => [s.id, s.read]));
  for (const s of d.sources ?? []) if (!known.has(s.id)) add("source", `${id}: source ${s.id} is not registered`);
  const trace = (ids: string[], where: string, support: string) => {
    for (const s of ids) if (!listed.has(s)) add("source", `${id} ${where}: cites ${s} which is not listed in sources`);
    if (support === "sourced" && !ids.some((s) => listed.get(s) === "full")) add("sourced", `${id} ${where}: a 'sourced' statement must cite a source read in full`);
    if ((support === "sourced" || support === "partial") && ids.length === 0) add("sourced", `${id} ${where}: ${support} statements need a source`);
    if (!ITEM.includes(support)) add("support", `${id} ${where}: bad support ${support}`);
  };
  const scan = (where: string, t: string) => { if (dose.test(t)) add("dosing", `${id} ${where}: dose/rate content is not allowed`); if (verdict.test(t)) add("verdict", `${id} ${where}: must not claim approval, review or competence`); };
  for (const [i, t] of [...(d.learning_objectives ?? []), ...(d.setting ? [d.setting] : [])].entries()) scan(`text[${i}]`, t);

  if (d.spec_level === "outline") {
    if (!d.expected_actions?.length && d.evidence_status !== "unsupported") add("outline", `${id}: an outline with no supported actions must be marked unsupported`);
    if (d.steps?.length) add("outline", `${id}: an outline must not contain steps`);
    for (const [i, a] of (d.expected_actions ?? []).entries()) {
      if (!(CASE_SCOPES as readonly string[]).includes(a.scope)) add("scope", `${id} action[${i}]: bad scope ${a.scope}`);
      trace(a.sources ?? [], `action[${i}]`, a.support); scan(`action[${i}]`, a.text);
    }
    return out;
  }
  // decision graph: the same structural rules as the database (case_structure_errors) and the authoring features of the extended engine
  const steps = d.steps ?? [];
  if (steps.length < 2 || steps.length > 8) add("graph", `${id}: a decision graph needs 2-8 steps`);
  if (!d.debrief?.learning_points?.length || d.debrief.learning_points.length > 8) add("debrief", `${id}: a structured debrief with 1-8 learning points is required`);
  for (const t of d.debrief?.learning_points ?? []) scan("debrief", t);
  const scopes = new Set<string>();
  steps.forEach((s, si) => {
    if (s.position !== si + 1) add("graph", `${id}: step positions must be 1..n`);
    if ((s.observations ?? []).length < 2 || s.observations.length > 8) add("observations", `${id} step ${s.position}: 2-8 changing observations are required`);
    for (const o of s.observations ?? []) {
      if (!KEY.test(o.key) || !o.label || !["number", "string"].includes(typeof o.value)) add("observations", `${id} step ${s.position}: malformed observation ${o.key}`);
      if (o.low !== undefined || o.high !== undefined) add("observations", `${id} step ${s.position}: clinical drafts must not assert normal bands (${o.key}) without a source`);
      scan(`step ${s.position} obs`, `${o.label} ${o.value}`);
    }
    scan(`step ${s.position}`, `${s.info} ${s.prompt}`);
    if (s.options.length < 2 || s.options.length > 4) add("graph", `${id} step ${s.position}: needs 2-4 options`);
    if (!s.options.some((o) => o.points === 2) || !s.options.some((o) => o.points < 2)) add("graph", `${id} step ${s.position}: needs a 2-point option and a lower-scoring one`);
    const last = si === steps.length - 1;
    for (const [oi, o] of s.options.entries()) {
      const w = `step ${s.position} option ${oi + 1}`;
      if (![0, 1, 2].includes(o.points)) add("graph", `${id} ${w}: points must be 0-2`);
      if (!(CASE_SCOPES as readonly string[]).includes(o.scope)) add("scope", `${id} ${w}: bad scope ${o.scope}`); else scopes.add(o.scope);
      if (last ? o.next !== null : o.next === null || o.next <= s.position || o.next > steps.length) add("graph", `${id} ${w}: next must be a later existing step (null only on the last step)`);
      if ((o.feedback ?? "").length < 10) add("feedback", `${id} ${w}: feedback is required`);
      if ((o.consequence ?? "").length < 10 || o.consequence.length > 600) add("consequence", `${id} ${w}: a consequence of 10-600 characters is required`);
      trace(o.sources ?? [], w, o.support); scan(w, `${o.text} ${o.feedback} ${o.consequence}`);
    }
  });
  const reach = new Set<number>([1]);
  for (const s of steps) if (reach.has(s.position)) for (const o of s.options) if (o.next) reach.add(o.next);
  if (steps.some((s) => !reach.has(s.position))) add("graph", `${id}: every step must be reachable from step 1`);
  if (!scopes.has("escalation") && !scopes.has("assessment") && !scopes.has("monitoring")) add("scope", `${id}: the scenario must include nursing assessment, monitoring or escalation options`);
  if (!scopes.has("order_or_protocol_required") && !scopes.has("prescriber_or_other_discipline")) add("scope", `${id}: the scenario must include at least one option that needs an order, protocol or another discipline (scope-of-practice distinction)`);
  return out;
}

export function validateScenarioSet(drafts: ScenarioDraft[]): ScenarioIssue[] {
  const nums = drafts.map((d) => d.number).sort((a, b) => a - b);
  return nums.join(",") === Array.from({ length: 20 }, (_, i) => i + 1).join(",") ? [] : [{ rule: "scope", message: `drafts must cover scenarios 1..20 exactly once (found ${nums.join(",")})` }];
}
