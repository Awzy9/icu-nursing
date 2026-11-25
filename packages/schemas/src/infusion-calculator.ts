// Shared web and native educational infusion arithmetic.
// Educational calculations only: no drug library, dose recommendation or pump programming.

export type DurationUnit = "hours" | "minutes";
export type DoseUnit = "mg/h" | "mcg/min";
export type ConcentrationUnit = "mg/mL" | "mcg/mL";

/** Parse educational decimal entry without silently accepting hex, exponent or Infinity. */
export function parsePositiveDecimal(raw: string): number | null {
  // Normalize only decimal digit scripts and the explicit Arabic decimal separator.
  // Never strip grouping separators, internal spaces or directional control characters.
  const trimmed = raw.trim().replace(/[\u0660-\u0669\u06F0-\u06F9]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 0x06F0 ? 0x06F0 : 0x0660));
  }).replace(/\u066B/g, ".");
  // A single comma followed by three digits can look like a thousands separator.
  // Require an explicit decimal point in that case rather than silently changing magnitude.
  if (/^\d+,\d{3}$/.test(trimmed)) return null;
  const text = trimmed.replace(",", ".");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
function answer(value: number): number | null {
  return positive(value) ? value : null;
}

/** Convert a known volume and a duration to a volumetric rate in mL/h. */
export function volumetricRate(volumeMl: number, duration: number, unit: DurationUnit): number | null {
  if (!positive(volumeMl) || !positive(duration) || (unit !== "hours" && unit !== "minutes")) return null;
  return answer(volumeMl / (unit === "minutes" ? duration / 60 : duration));
}

/** Convert a known volume and pump rate to an infusion duration in hours. */
export function infusionDuration(volumeMl: number, rateMlHour: number): number | null {
  if (!positive(volumeMl) || !positive(rateMlHour)) return null;
  return answer(volumeMl / rateMlHour);
}

export interface DoseRateInput {
  dose: number;
  weightKg?: number;
  weightBased: boolean;
  doseUnit: DoseUnit;
  concentration: number;
  concentrationUnit: ConcentrationUnit;
}

/** Calculate mL/h after converting the dose and concentration to mg/h and mg/mL. */
export function doseToPumpRate(input: DoseRateInput): number | null {
  if (!positive(input.dose) || !positive(input.concentration)) return null;
  if ((input.doseUnit !== "mg/h" && input.doseUnit !== "mcg/min")
    || (input.concentrationUnit !== "mg/mL" && input.concentrationUnit !== "mcg/mL")) return null;
  if (input.weightBased && !positive(input.weightKg ?? Number.NaN)) return null;
  const totalDose = input.dose * (input.weightBased ? input.weightKg! : 1);
  const doseMgHour = totalDose * (input.doseUnit === "mcg/min" ? 60 / 1000 : 1);
  const concentrationMgMl = input.concentration * (input.concentrationUnit === "mcg/mL" ? 1 / 1000 : 1);
  return answer(doseMgHour / concentrationMgMl);
}

/** Display the relation as approximate if any displayed operand or result is rounded. */
export function equationSign(...values: number[]): "=" | "≈" {
  return values.some(value => Number(value.toPrecision(6)) !== value) ? "≈" : "=";
}
