import { z } from "zod";

export const EQUIPMENT_CATEGORIES = [
  "monitors-alarms", "ventilator-waveforms", "arterial-pressure", "infusion-pumps",
  "defibrillators", "crrt-systems", "enteral-feeding-pumps", "pressure-relieving-equipment",
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];
export const DIAGRAM_KINDS = ["loop", "signal", "flow"] as const;

const localized = z.record(z.string(), z.string());
const localizedList = z.record(z.string(), z.array(z.string()));

export const equipmentModuleSchema = z.object({
  code: z.string().regex(/^SYN-EQ-\d{3}$/),
  category: z.enum(EQUIPMENT_CATEGORIES),
  synthetic: z.literal(true),
  title: localized,
  summary: localized,
  diagram: z.object({
    kind: z.enum(DIAGRAM_KINDS),
    alt: localized,
    parts: z.array(z.object({ id: z.string().regex(/^[a-z]+$/), label: localized, detail: localized })).min(3).max(6),
  }),
  parameters: z.array(z.object({ key: z.string(), name: localized, meaning: localized })).min(1).max(8),
  safety: localizedList,
  escalation: localizedList,
});
export type EquipmentModule = z.infer<typeof equipmentModuleSchema>;
export const equipmentListSchema = z.array(equipmentModuleSchema);
