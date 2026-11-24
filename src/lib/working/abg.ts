// Educational consistency and pattern checks only; not a clinical diagnostic algorithm.
// Sources: ATS Interpretation of ABGs; Merck Professional Acid-Base Disorders.
// Compensation approximations do not establish chronicity or rule out mixed metabolic disorders.
export interface AbgInput { pH: number; paco2: number; hco3: number; pao2?: number; fio2?: number }
export type PrimaryDisorder =
  | "normal" | "respiratory_acidosis" | "respiratory_alkalosis"
  | "metabolic_acidosis" | "metabolic_alkalosis" | "mixed_acidosis" | "mixed_alkalosis"
  | "mixed_opposing" | "indeterminate" | "inconsistent";
export type CompensationStatus = "not_applicable" | "within_expected" | "outside_expected" | "indeterminate";
export type OxygenationStatus = "normal" | "mild_hypoxemia" | "moderate_hypoxemia" | "severe_hypoxemia" | "not_assessed";
export interface AbgInterpretation {
  phStatus: "acidemia" | "alkalemia" | "normal";
  primaryDisorder: PrimaryDisorder;
  compensation: CompensationStatus;
  expectedCompensationRange?: [number, number];
  oxygenation: OxygenationStatus;
  pfRatio?: number;
  notes: string[];
}
function round1(n: number) { return Math.round(n * 10) / 10; }
const positive = (n: number) => Number.isFinite(n) && n > 0;
/** Approximate pH from same-sample arterial PaCO2 (mmHg) and calculated HCO3 (mEq/L). */
export function calculatedPh(paco2: number, hco3: number): number {
  return 6.1 + Math.log10(hco3 / (0.03 * paco2));
}
export function interpretAbg(input: AbgInput): AbgInterpretation {
  const { pH, paco2, hco3 } = input;
  const notes: string[] = [];
  const phStatus = pH < 7.35 ? "acidemia" : pH > 7.45 ? "alkalemia" : "normal";
  let primaryDisorder: PrimaryDisorder = "indeterminate";
  let compensation: CompensationStatus = "indeterminate";
  let expectedCompensationRange: [number, number] | undefined;
  const winter = (): [number, number] => [1.5 * hco3 + 6, 1.5 * hco3 + 10];
  const assess = (range: [number, number], observed: number) => {
    expectedCompensationRange = [round1(range[0]), round1(range[1])];
    compensation = observed >= range[0] && observed <= range[1] ? "within_expected" : "outside_expected";
    if (compensation === "outside_expected") notes.push("Observed compensation differs from the approximate expectation; consider a second primary process and review clinical context.");
  };
  // Tolerance is a fixture-integrity heuristic for rounded teaching values, not a laboratory QC limit.
  if (!positive(pH) || !positive(paco2) || !positive(hco3) || Math.abs(pH - calculatedPh(paco2, hco3)) > 0.05) {
    primaryDisorder = "inconsistent";
    notes.push("The same-sample pH, PaCO2 and bicarbonate do not agree with the approximate Henderson–Hasselbalch relationship. Verify the values and sample before interpretation.");
  } else if (phStatus === "normal") {
    if (paco2 >= 35 && paco2 <= 45 && hco3 >= 22 && hco3 <= 26) {
      primaryDisorder = "normal";
      compensation = "not_applicable";
      notes.push("These values are within the teaching reference intervals; electrolyte results and clinical context are still required to exclude hidden disorders.");
    } else if (hco3 < 22 && paco2 < winter()[0]) {
      primaryDisorder = "mixed_opposing";
      assess(winter(), paco2);
      notes.push("Possible metabolic acidosis with respiratory alkalosis: PaCO2 is below Winter's expected range. A normal-range pH does not establish full compensation; review electrolytes, anion gap and history.");
    } else {
      notes.push("A normal-range pH with abnormal PaCO2 or bicarbonate cannot establish a single primary disorder or full compensation. Review expected responses, history and electrolytes.");
    }
  } else if (phStatus === "acidemia") {
    if (paco2 > 45 && hco3 < 22) {
      primaryDisorder = "mixed_acidosis";
      compensation = "not_applicable";
      notes.push("Respiratory and metabolic components both contribute to acidemia.");
    } else if (hco3 < 22) {
      primaryDisorder = "metabolic_acidosis";
      assess(winter(), paco2);
      if (paco2 > winter()[1]) notes.push("PaCO2 is higher than Winter's formula predicts, suggesting additional respiratory acidosis even if it lies within its reference interval.");
      if (paco2 < winter()[0]) notes.push("PaCO2 is lower than Winter's formula predicts, suggesting additional respiratory alkalosis.");
    } else if (paco2 > 45) {
      primaryDisorder = "respiratory_acidosis";
      const delta = (paco2 - 40) / 10;
      assess([24 + delta, 24 + 4 * delta], hco3);
      notes.push("Broad acute-to-chronic teaching envelope only; duration and clinical context are required to distinguish acute, chronic and mixed processes.");
    }
  } else {
    if (paco2 < 35 && hco3 > 26) {
      primaryDisorder = "mixed_alkalosis";
      compensation = "not_applicable";
      notes.push("Respiratory and metabolic components both contribute to alkalemia.");
    } else if (hco3 > 26) {
      primaryDisorder = "metabolic_alkalosis";
      const delta = hco3 - 24;
      assess([Math.min(40 + 0.6 * delta, 55), Math.min(40 + 0.75 * delta, 55)], paco2);
    } else if (paco2 < 35) {
      primaryDisorder = "respiratory_alkalosis";
      const delta = (40 - paco2) / 10;
      assess([24 - 5 * delta, 24 - 2 * delta], hco3);
      notes.push("Broad acute-to-chronic teaching envelope only; compensation and chronicity require clinical context.");
    }
  }
  if (primaryDisorder === "indeterminate" && phStatus !== "normal") notes.push("The pattern is not sufficiently clear for a simple teaching classification; review the values and clinical context.");
  let oxygenation: OxygenationStatus = "not_assessed";
  let pfRatio: number | undefined;
  if (input.pao2 !== undefined && positive(input.pao2)) {
    oxygenation = input.pao2 >= 80 ? "normal" : input.pao2 >= 60 ? "mild_hypoxemia" : input.pao2 >= 40 ? "moderate_hypoxemia" : "severe_hypoxemia";
    if (input.fio2 !== undefined && Number.isFinite(input.fio2) && input.fio2 >= 0.21 && input.fio2 <= 1) pfRatio = round1(input.pao2 / input.fio2);
    notes.push("PaO2 bands describe the raw measurement only; interpret oxygen support, trajectory and clinical context. P/F alone does not diagnose ARDS.");
  }
  return { phStatus, primaryDisorder, compensation, expectedCompensationRange, oxygenation, pfRatio, notes };
}
