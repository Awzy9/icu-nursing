import synthetic from "./synthetic-equipment.json";
import { equipmentListSchema, type EquipmentModule } from "./types";

/**
 * Equipment-learning content source. Only the synthetic, nonclinical fixtures are ever served here.
 * Real equipment drafts live in content/drafts/equipment/ and are never imported (the schema requires synthetic: true).
 */
export function listEquipment(): EquipmentModule[] {
  return equipmentListSchema.parse(synthetic);
}
export function getEquipment(code: string): EquipmentModule | null {
  return listEquipment().find((m) => m.code === code) ?? null;
}
