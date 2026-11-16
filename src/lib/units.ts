/**
 * Clinical units: DISPLAY ONLY.
 *
 * This module intentionally has no unit-conversion functions. Medication doses, infusion rates and
 * concentrations must never be converted automatically; they are shown exactly as authored and
 * reviewed (see CLINICAL_GOVERNANCE.md). Any future conversion needs validated clinical rules,
 * pharmacist sign-off and tests before it may be added.
 */
import { formatNumber } from "./format";

export const DISPLAY_UNITS = ["mmHg", "kPa", "mmol/L", "mg/dL", "bpm", "breaths/min", "°C", "mL/h", "%"] as const;
export type DisplayUnit = (typeof DISPLAY_UNITS)[number];

export function formatQuantity(value: number, unit: DisplayUnit, locale: string): string {
  return `${formatNumber(value, locale, { maximumFractionDigits: 2 })} ${unit}`;
}
