// Same dimensional arithmetic as src/components/working/infusion-calculator.tsx.
// Educational calculations only: no drug library, dose recommendation or pump programming.

export type DurationUnit = "hours" | "minutes";
export type DoseUnit = "mg/h" | "mcg/min";
export type ConcentrationUnit = "mg/mL" | "mcg/mL";

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
function answer(value: number): number | null {
  return positive(value) ? value : null;
}

/** Convert a known volume and a duration to a volumetric rate in mL/h. */
export function volumetricRate(volumeMl: number, duration: number, unit: DurationUnit): number | null {
  if (!positive(volumeMl) || !positive(duration)) return null;
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
  if (input.weightBased && !positive(input.weightKg ?? Number.NaN)) return null;
  const totalDose = input.dose * (input.weightBased ? input.weightKg! : 1);
  const doseMgHour = totalDose * (input.doseUnit === "mcg/min" ? 60 / 1000 : 1);
  const concentrationMgMl = input.concentration * (input.concentrationUnit === "mcg/mL" ? 1 / 1000 : 1);
  return answer(doseMgHour / concentrationMgMl);
}
