export interface HemoInputs { heartRate: number; strokeVolume: number; sbp: number; dbp: number; cvp: number }

export interface HemoResult {
  cardiacOutput: number | null; // L/min; null if HR or SV is zero (nothing to divide by)
  map: number | null; // estimated mmHg; null for an invalid pressure pair
  svr: number | null; // dyn.s/cm^5; null if cardiacOutput is null/zero (undefined by the formula)
}

export function computeHemodynamics(input: HemoInputs): HemoResult {
  const { heartRate, strokeVolume, sbp, dbp, cvp } = input;
  const cardiacOutput = Number.isFinite(heartRate) && Number.isFinite(strokeVolume) && heartRate > 0 && strokeVolume > 0
    ? heartRate * strokeVolume / 1000 : null;
  const map = Number.isFinite(sbp) && Number.isFinite(dbp) && sbp > dbp && dbp >= 0
    ? dbp + (sbp - dbp) / 3 : null;
  const svr = cardiacOutput !== null && map !== null && Number.isFinite(cvp) && map > cvp
    ? 80 * (map - cvp) / cardiacOutput : null;
  return { cardiacOutput, map, svr };
}
