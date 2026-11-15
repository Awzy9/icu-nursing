import { z } from "zod";
import { QuestionBankError } from "@/lib/question-bank/types";
import { SUPPORT_LEVELS } from "@/lib/skills/types";

export { QuestionBankError as MedicationError };

export const MEDICATION_CATEGORIES = [
  "vasoactives-inotropes", "sedatives-analgesics", "neuromuscular-blockers", "anticoagulants-hemostasis", "antiarrhythmics-cardiac",
  "insulin-electrolytes-fluids", "anti-infectives", "neuro-seizure-icp", "respiratory-gi-support", "reversal-emergency",
] as const;
export type MedicationCategory = (typeof MEDICATION_CATEGORIES)[number];
export const MEDICATION_SECTIONS = [
  "general_pharmacology", "administration_considerations", "institution_preparation", "institution_dosing", "nursing_responsibilities",
  "monitoring", "safety_alerts", "adverse_effects", "escalation", "documentation", "communication", "special_populations",
] as const;
export type MedicationSection = (typeof MEDICATION_SECTIONS)[number];
export const MONITORING_KINDS = ["observe", "assess", "laboratory", "escalate", "document"] as const;

const localized = z.record(z.string(), z.string());
const localizedList = z.record(z.string(), z.array(z.string()));
const category = z.enum(MEDICATION_CATEGORIES);

export const medicationCardSchema = z.object({
  id: z.string(), code: z.string(), name: localized, drug_class: localized, summary: localized, category, high_alert: z.boolean(), synthetic: z.boolean(), bookmarked: z.boolean(),
});
export type MedicationCard = z.infer<typeof medicationCardSchema>;
export const medicationListSchema = z.array(medicationCardSchema);

export const medicationProgressSchema = z.object({ available: z.number().int(), high_alert: z.number().int(), bookmarked: z.number().int(), synthetic_fixtures: z.boolean() });
export type MedicationProgress = z.infer<typeof medicationProgressSchema>;

export const medicationDetailSchema = medicationCardSchema.extend({
  sections: z.record(z.string(), localizedList), section_support: z.record(z.string(), z.enum(SUPPORT_LEVELS)),
  evidence_status: z.enum(["unassessed", "supported", "partial", "unsupported"]),
  license_status: z.enum(["unassessed", "original", "cleared", "permission_required", "restricted"]),
  evidence_date: z.string().nullable(),
  references: z.array(z.object({ title: z.string(), publisher: z.string().optional(), year: z.number().int().optional(), url: z.string().optional(), licence: z.string().optional() })),
  version: z.number().int(), published_at: z.string().nullable(),
  label_source: z.enum(["FDA", "EMA", "MHRA", "SFDA", "other"]).nullable(), label_version: z.string().nullable(), label_date: z.string().nullable(), jurisdiction_note: localized.nullable(),
  monitoring: z.array(z.object({ id: z.string(), position: z.number().int(), kind: z.enum(MONITORING_KINDS), text: localized, critical: z.boolean(), support: z.enum(["sourced", "partial", "local_protocol"]) })),
  revisions: z.array(z.object({ version: z.number().int(), changed_at: z.string(), summary: localized })),
});
export type MedicationDetail = z.infer<typeof medicationDetailSchema>;

export const medicationFilterSchema = z.object({
  query: z.string().trim().max(80).optional(), category: category.optional(), bookmarked: z.boolean().optional(), highAlert: z.boolean().optional(),
});
export type MedicationFilter = z.infer<typeof medicationFilterSchema>;

export interface MedicationService {
  readonly mode: "database" | "fixtures";
  progress(): Promise<MedicationProgress>;
  list(filter?: MedicationFilter): Promise<MedicationCard[]>;
  get(code: string): Promise<MedicationDetail | null>;
  setBookmark(medicationId: string, on: boolean): Promise<void>;
}
