// Deterministic hemodynamic calculations and a simplified shock-pattern classifier, built from
// the standard formulas taught in critical care nursing:
//   CO (L/min)  = HR (bpm) * SV (mL) / 1000
//   MAP (mmHg)  = DBP + (SBP - DBP) / 3
//   SVR (dyn.s/cm^5) = 80 * (MAP - CVP) / CO
// This is a teaching-level model, not a diagnostic tool: real shock states are distinguished
// using far more than four numbers (history, exam, echo, lactate) - the classifier below is
// explicit about where the numbers alone are genuinely ambiguous (cardiogenic vs obstructive)
// rather than forcing a guess.

export interface HemoInputs { heartRate: number; strokeVolume: number; sbp: number; dbp: number; cvp: number }

export interface HemoResult {
  cardiacOutput: number | null; // L/min; null if HR or SV is zero (nothing to divide by)
  map: number; // mmHg
  svr: number | null; // dyn.s/cm^5; null if cardiacOutput is null/zero (undefined by the formula)
}

export type HemoPattern = "normal" | "distributive" | "hypovolemic" | "cardiogenic_or_obstructive" | "indeterminate";

const NORMAL = { co: [4, 8] as [number, number], map: [70, 105] as [number, number], svr: [800, 1200] as [number, number], cvp: [2, 6] as [number, number] };
const inRange = (v: number, [lo, hi]: [number, number]) => v >= lo && v <= hi;

export function computeHemodynamics(input: HemoInputs): HemoResult {
  const { heartRate, strokeVolume, sbp, dbp, cvp } = input;
  const cardiacOutput = heartRate > 0 && strokeVolume > 0 ? round2((heartRate * strokeVolume) / 1000) : null;
  const map = round2(dbp + (sbp - dbp) / 3);
  const svr = cardiacOutput && cardiacOutput > 0 ? round2((80 * (map - cvp)) / cardiacOutput) : null;
  return { cardiacOutput, map, svr };
}

export function classifyHemoPattern(result: HemoResult, cvp: number): HemoPattern {
  const { cardiacOutput: co, map, svr } = result;
  if (co === null || svr === null) return "indeterminate";
  if (inRange(co, NORMAL.co) && inRange(map, NORMAL.map) && inRange(svr, NORMAL.svr) && inRange(cvp, NORMAL.cvp)) return "normal";
  // Low SVR (vasodilation) is the hallmark that most distinguishes distributive shock from the others.
  if (svr < NORMAL.svr[0]) return "distributive";
  if (cvp < NORMAL.cvp[0] && co < NORMAL.co[0]) return "hypovolemic";
  // Elevated CVP with low CO and compensatory vasoconstriction fits BOTH cardiogenic shock (pump
  // failure backing up into the venous system) and obstructive shock (tamponade/tension
  // pneumothorax/massive PE impeding filling or outflow) - these cannot be told apart from these
  // four numbers alone; exam findings (muffled heart sounds, pulsus paradoxus, tracheal
  // deviation, echo) are needed.
  if (cvp > NORMAL.cvp[1] && co < NORMAL.co[0]) return "cardiogenic_or_obstructive";
  return "indeterminate";
}

function round2(n: number) { return Math.round(n * 100) / 100; }
