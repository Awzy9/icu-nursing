import { z } from "zod";
import { QuestionBankError } from "@/lib/question-bank/types";

export { QuestionBankError as SkillError };

export const SKILL_CATEGORIES = [
  "vascular-access", "airway-ventilation", "transfusion-nutrition", "elimination-drains", "skin-mobility-transport",
  "renal-support", "cardiac-resuscitation", "safety-infection-devices", "assessment",
] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
export const SKILL_SECTIONS = [
  "indications", "safety", "responsibilities", "scope", "equipment", "preparation", "assessment", "procedure",
  "monitoring", "escalation", "complications", "errors", "documentation", "communication",
] as const;
export type SkillSection = (typeof SKILL_SECTIONS)[number];
export const CHECKLIST_PHASES = ["preparation", "assessment", "procedure", "monitoring", "escalation", "documentation"] as const;
export const SUPPORT_LEVELS = ["full", "partial", "local_protocol", "permission_required"] as const;
export const RESULTS = ["done", "unsure", "not_done"] as const;
export type Result = (typeof RESULTS)[number];

const localized = z.record(z.string(), z.string());
const localizedList = z.record(z.string(), z.array(z.string()));
const category = z.enum(SKILL_CATEGORIES);

export const skillCardSchema = z.object({
  id: z.string(), code: z.string(), title: localized, summary: localized, category, synthetic: z.boolean(),
  steps: z.number().int(), bookmarked: z.boolean(),
  in_progress_session: z.string().nullable(), sessions_completed: z.number().int(), last_completed_at: z.string().nullable(),
  last_items_done: z.number().int().nullable(), last_items_total: z.number().int().nullable(),
});
export type SkillCard = z.infer<typeof skillCardSchema>;
export const skillListSchema = z.array(skillCardSchema);

export const skillProgressSchema = z.object({
  available: z.number().int(), practised: z.number().int(), in_progress: z.number().int(), bookmarked: z.number().int(), synthetic_fixtures: z.boolean(),
});
export type SkillProgress = z.infer<typeof skillProgressSchema>;

const checklistItem = z.object({
  id: z.string(), position: z.number().int(), phase: z.enum(CHECKLIST_PHASES), text: localized, critical: z.boolean(),
  support: z.enum(["sourced", "partial", "local_protocol"]),
});
const mySession = z.object({
  id: z.string(), status: z.enum(["in_progress", "completed", "abandoned"]), started_at: z.string(), completed_at: z.string().nullable(),
  items_done: z.number().int().nullable(), items_total: z.number().int().nullable(), critical_done: z.number().int().nullable(), critical_total: z.number().int().nullable(),
});
export const skillDetailSchema = skillCardSchema.extend({
  objectives: localizedList, prerequisites: localizedList,
  sections: z.record(z.string(), localizedList), section_support: z.record(z.string(), z.enum(SUPPORT_LEVELS)),
  evidence_status: z.enum(["unassessed", "supported", "partial", "unsupported"]),
  license_status: z.enum(["unassessed", "original", "cleared", "permission_required", "restricted"]),
  evidence_date: z.string().nullable(),
  references: z.array(z.object({ title: z.string(), publisher: z.string().optional(), year: z.number().int().optional(), url: z.string().optional(), licence: z.string().optional() })),
  version: z.number().int(), published_at: z.string().nullable(),
  checklist: z.array(checklistItem),
  revisions: z.array(z.object({ version: z.number().int(), changed_at: z.string(), summary: localized })),
  my_sessions: z.array(mySession),
});
export type SkillDetail = z.infer<typeof skillDetailSchema>;

export const skillSessionSchema = z.object({
  id: z.string(), status: z.enum(["in_progress", "completed", "abandoned"]), mode: z.literal("self_study"),
  started_at: z.string(), completed_at: z.string().nullable(),
  skill: z.object({ id: z.string(), code: z.string(), title: localized, category, synthetic: z.boolean(), version: z.number().int() }),
  items: z.array(checklistItem.extend({ result: z.enum(RESULTS).nullable() })),
  summary: z.object({ items_total: z.number().int(), items_done: z.number().int(), items_unsure: z.number().int(), critical_total: z.number().int(), critical_done: z.number().int() }).nullable(),
});
export type SkillSessionView = z.infer<typeof skillSessionSchema>;

export const listFilterSchema = z.object({
  query: z.string().trim().max(80).optional(),
  category: category.optional(),
  bookmarked: z.boolean().optional(),
});
export type SkillListFilter = z.infer<typeof listFilterSchema>;

export interface SkillService {
  readonly mode: "database" | "fixtures";
  progress(): Promise<SkillProgress>;
  list(filter?: SkillListFilter): Promise<SkillCard[]>;
  get(code: string): Promise<SkillDetail | null>;
  setBookmark(skillId: string, on: boolean): Promise<void>;
  start(skillId: string): Promise<string>;
  getSession(sessionId: string): Promise<SkillSessionView | null>;
  mark(sessionId: string, itemId: string, result: Result): Promise<void>;
  complete(sessionId: string): Promise<SkillSessionView>;
  discard(sessionId: string): Promise<void>;
}
